'use strict';

const path = require('path');
const express = require('express');

const config = require('./config');
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
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, 'views'));

  app.use(
    '/assets',
    express.static(path.join(__dirname, 'public'), {
      maxAge: config.isProduction ? '7d' : 0,
      etag: true
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
