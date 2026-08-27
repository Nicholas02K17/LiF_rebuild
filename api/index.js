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

let app = null;
let bootError = null;

try {
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
    'The LiF Hub could not start.\n\n' +
      'This is a configuration problem rather than a fault in the page you asked for.\n' +
      'The reason is in this deployment\'s function logs.\n\n' +
      'The usual cause: a deployment with no LiF backend behind it needs the\n' +
      'environment variable LIF_REVIEW_DEPLOYMENT set to true, and needs a\n' +
      'redeploy afterwards — environment changes do not reach a build that has\n' +
      'already happened.\n'
  );
}

module.exports = bootError ? bootFailureHandler : app;
