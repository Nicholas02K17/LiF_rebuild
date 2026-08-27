'use strict';

const path = require('path');
const express = require('express');
const ejs = require('ejs');

const config = require('./config');
const assets = require('./config/assets');
const layout = require('./middleware/layout');
const requestContext = require('./middleware/requestContext');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const routes = require('./routes');

/**
 * Express application factory.
 *
 * This file exists so the presentation layer can be mounted INTO the
 * authoritative LiF Node.js / Express application rather than replacing it:
 * the host can call `mount(existingApp)` and keep its own startup, session,
 * security-header, authorization and error middleware. `createApp()` is only
 * for local review and tests.
 *
 * No second server, no duplicate backend (AI Run Instructions v2.1 section 5).
 */

function mount(app) {
  /**
   * Register the view engine explicitly rather than leaving Express to find it.
   *
   * `app.set('view engine', 'ejs')` alone makes Express do `require(name)` with
   * a variable at first render. A bundler's static file tracer cannot follow
   * that, so ejs is simply not deployed and the first page render fails on a
   * host that ships only what it traced — which is every serverless platform.
   *
   * Requiring it at the top of this file and handing Express the engine
   * directly makes the dependency visible to the tracer. Behaviour is identical
   * either way; only the packaging differs.
   */
  app.engine('ejs', ejs.__express);
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, 'views'));

  /**
   * Asset caching, decided by whether the URL carries the current fingerprint.
   *
   *   with ?v=<current>  the URL changes whenever the file does, so it can be
   *                      cached hard and never revalidated.
   *   without it         an ES module importing './motion.js' does not inherit
   *                      the entry point's query string, so those URLs are
   *                      stable and must revalidate. An ETag makes that a 304
   *                      in almost every case, which costs a round trip and
   *                      nothing else — far cheaper than serving a stale module
   *                      graph against fresh markup.
   */
  function assetCacheContext(req, res, next) {
    res.locals.assetIsFingerprinted =
      config.isProduction && req.query.v === assets.version();
    next();
  }

  app.use(
    '/assets',
    assetCacheContext,
    express.static(path.join(__dirname, 'public'), {
      etag: true,
      lastModified: true,
      setHeaders(res) {
        if (!config.isProduction) {
          res.setHeader('Cache-Control', 'no-store');
          return;
        }
        res.setHeader(
          'Cache-Control',
          res.locals.assetIsFingerprinted
            ? 'public, max-age=31536000, immutable'
            : 'public, max-age=0, must-revalidate'
        );
      }
    })
  );

  app.use(express.urlencoded({ extended: false }));
  app.use(express.json());

  app.use(layout('layouts/base'));
  app.use(requestContext());
  app.use(routes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

function createApp() {
  const app = express();

  app.disable('x-powered-by');

  // Minimal headers for standalone review. In the authoritative repository the
  // host application's existing security-header middleware stays authoritative
  // and this block is not mounted.
  app.use((req, res, next) => {
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('Referrer-Policy', 'same-origin');
    next();
  });

  return mount(app);
}

module.exports = { createApp, mount };
