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

const { createApp } = require('../src/app');

module.exports = createApp();
