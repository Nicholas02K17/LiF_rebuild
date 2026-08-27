'use strict';

/**
 * Async handler safety.
 *
 * Express 4 does not await a handler, so a rejected promise from an `async`
 * route escapes as an unhandled rejection — and Node terminates the process on
 * an unhandled rejection by default.
 *
 * On a normal server that means a restart. On a serverless host it means the
 * whole function dies with an opaque platform error page instead of returning
 * a 500, and the Member's calm error state never gets a chance to render. It
 * also means a single missing module turns every request into a crash.
 *
 * Every async handler goes through here, so a failure anywhere in it — the try
 * block, a `finally`, or code before either — becomes an ordinary
 * `next(error)` and reaches the error handler like everything else.
 *
 * Express 5 does this natively. When the host application is on Express 5 this
 * file can be deleted and the calls unwrapped, with no behaviour change.
 */

module.exports = function asyncRoute(handler) {
  return function wrappedAsyncRoute(req, res, next) {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
};
