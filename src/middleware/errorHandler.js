'use strict';

const config = require('../config');

/**
 * Error handling.
 *
 * Dashboard Unified v1.2 section 0.11: every error state says what happened,
 * whether the Member's work is safe, what can be done next and how to return.
 * A permission-denied state reveals no protected metadata — which is why a
 * 403 and a "does not exist" produce the same Member-facing wording.
 */

function notFound(req, res, next) {
  const error = new Error('Not found');
  error.status = 404;
  next(error);
}

function statusCopy(status, t) {
  if (status === 403 || status === 404) {
    return {
      heading: 'This is not open to you right now.',
      body: 'That might be because it is private, because it has not opened yet, or because it is no longer there. Nothing you have saved is affected.',
      action: { label: 'Return to My Playground', href: '/' }
    };
  }
  if (status === 401) {
    return {
      heading: 'You will need to be signed in for this.',
      body: 'We have kept where you were going. Sign in and we will take you straight back to it.',
      action: { label: 'Sign in', href: '/sign-in' }
    };
  }
  return {
    heading: t ? t('state.error') : 'We could not bring this in yet.',
    body: 'Nothing you have entered is lost. You can try again, or come back to it later.',
    action: { label: 'Return to My Playground', href: '/' }
  };
}

// eslint-disable-next-line no-unused-vars
function errorHandler(error, req, res, next) {
  const status = error.status && error.status >= 400 && error.status < 600 ? error.status : 500;

  if (status >= 500) {
    // Server-side detail stays server-side.
    console.error('[lif] request failed', { path: req.path, message: error.message, stack: error.stack });
  }

  const copy = statusCopy(status, req.t);
  res.status(status);

  if (req.accepts(['html', 'json']) === 'json') {
    return res.json({ error: { status, message: copy.heading } });
  }

  if (typeof res.renderPage !== 'function') {
    return res.type('text/plain').send(`${copy.heading}\n\n${copy.body}`);
  }

  return res.renderPage('features/hub/error', {
    page: { title: `${copy.heading} — Love is Foundation`, path: req.path, reviewState: null },
    status,
    copy,
    // One flag, decided in src/config. Never re-derive this from NODE_ENV here.
    showDetail: config.exposeErrorDetail,
    detail: config.exposeErrorDetail ? error.stack : null
  });
}

module.exports = { notFound, errorHandler };
