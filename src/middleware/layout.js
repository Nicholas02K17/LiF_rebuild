'use strict';

/**
 * Shared layout support without an extra dependency.
 *
 * `res.renderPage(view, locals)` renders the page template, then renders
 * `layouts/base.ejs` with that output as `body`. Pages stay free of shell
 * markup, and the shell is defined once (AI Run Instructions v2.1 section 5.3).
 */

module.exports = function layout(layoutView = 'layouts/base') {
  return function layoutMiddleware(req, res, next) {
    res.renderPage = function renderPage(view, locals = {}) {
      const merged = { ...res.locals, ...locals };
      res.render(view, merged, (pageError, body) => {
        if (pageError) return next(pageError);
        return res.render(layoutView, { ...merged, body }, (shellError, html) => {
          if (shellError) return next(shellError);
          res.set('Content-Type', 'text/html; charset=utf-8');
          return res.send(html);
        });
      });
    };
    next();
  };
};
