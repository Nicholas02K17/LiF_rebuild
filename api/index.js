'use strict';

/**
 * Vercel serverless entry point.
 *
 * Vercel does not run a long-lived `node src/server.js`; it invokes a handler
 * per request. An Express app *is* a `(req, res)` handler, so the same
 * application object serves both — `src/server.js` stays the local review
 * server and nothing in `src/` knows or cares which one is running it.
 *
 * `vercel.json` rewrites every path here, so Express keeps doing the routing.
 *
 * ONE CAVEAT, and it matters for a demo: serverless instances are recycled.
 * The review adapter under /dev holds its state in memory, so a layout or theme
 * change sticks while the instance stays warm and resets to the seed data after
 * a cold start. That is a property of running fixtures on serverless, not a
 * bug in the Hub — the real deployment writes through the bound repositories.
 * A platform that runs `npm start` as a normal process (Render, Railway, Fly)
 * keeps that state for as long as the process lives.
 */

const NL = '\n';

let app = null;
let bootError = null;

try {
  const config = require('../src/config');
  const repositories = require('../src/repositories');

  if (config.reviewDeployment) {
    /**
     * Bind the review fixtures here, from the deployment entry point, in the
     * same shape the host application binds its real repositories.
     *
     * Two reasons this lives in `api/` rather than being left to the lazy
     * require inside `src/repositories/index.js`:
     *
     * 1. It is a static, top-level require, so a bundler's file tracer can see
     *    it. The lazy one is inside a function and behind a condition, which is
     *    exactly the shape tracers drop — and a dropped module here is not a
     *    500, it is the whole function crashing.
     * 2. `src/` still cannot reach the fixtures on its own, which is the rule
     *    that matters (AI Run Instructions v2.1 section 7). A review deployment
     *    declares them from outside, exactly like production declares real ones.
     */
    const devAdapter = require('../dev/adapters/devRepositories');
    repositories.bind(devAdapter.create());
  }

  // Building the app at module load is what we want: a configuration mistake
  // should surface on the first request, not on the hundredth.
  app = require('../src/app').createApp();
} catch (error) {
  bootError = error;
  // The platform's own crash page says nothing useful, so make the log say it.
  console.error('[lif] the Hub failed to start:', error && error.message);
  console.error(error);
}

/**
 * A boot failure would otherwise surface as an opaque platform crash page.
 * Answer with something a person can act on instead — and with no stack trace,
 * because this URL is public. The detail goes to the function log.
 */
function bootFailureHandler(req, res) {
  res.statusCode = 500;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(
    [
      'The LiF Hub could not start.',
      '',
      'This is a configuration problem rather than a fault in the page you asked for.',
      "The reason is in this deployment's function logs, and /api/health reports it too.",
      '',
      'The usual cause: a deployment with no LiF backend behind it needs the',
      'environment variable LIF_REVIEW_DEPLOYMENT set to true, and needs a',
      'redeploy afterwards — environment changes do not reach a build that has',
      'already happened.',
      ''
    ].join(NL)
  );
}

/**
 * TEMPORARY request-level error reporting.
 *
 * The platform answers a failed invocation with an opaque page, and its runtime
 * logs sit behind an account login — so a failure that happens only under the
 * platform's own request objects is otherwise invisible from outside. This
 * captures it and puts it in the response body.
 *
 * Delete this wrapper once the deployment is healthy. `module.exports = app`
 * is the whole of it in normal operation.
 */
function reportingHandler(req, res) {
  if (bootError) return bootFailureHandler(req, res);

  let settled = false;

  const finish = (error) => {
    if (settled || res.headersSent) return;
    settled = true;
    console.error('[lif] request failed:', req && req.url, error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.end(
      [
        'LiF Hub — request failed',
        '',
        'url:     ' + (req && req.url),
        'name:    ' + (error && error.name),
        'message: ' + (error && error.message),
        '',
        String((error && error.stack) || '(no stack)')
          .split(NL)
          .slice(0, 14)
          .join(NL),
        ''
      ].join(NL)
    );
  };

  const release = () => {
    settled = true;
    process.off('uncaughtException', finish);
    process.off('unhandledRejection', finish);
  };

  process.once('uncaughtException', finish);
  process.once('unhandledRejection', finish);
  res.on('finish', release);
  res.on('close', release);

  try {
    return app(req, res);
  } catch (error) {
    return finish(error);
  }
}

module.exports = reportingHandler;
