'use strict';

const config = require('../config');
const terminology = require('../services/terminology.service');
const { seedOfLife } = require('../content/aspects');

/**
 * The Seed of Life geometry, pre-rounded and pre-resolved to CSS custom
 * property names. Templates iterate it; they never compute it
 * (AI Run Instructions v2.1 section 5.3 — simple display conditions and
 * iteration only).
 */
const SEED_FOR_VIEW = seedOfLife().map((s) => ({
  seat: s.seat,
  cx: Number(s.x.toFixed(2)),
  cy: Number(s.y.toFixed(2)),
  r: s.r,
  aspectKey: s.aspect.key,
  aspectLabel: s.aspect.label,
  aspectCode: s.aspect.code,
  colour: `var(--${s.aspect.key}-600)`,
  tint: `var(--${s.aspect.key}-100)`
}));

/**
 * Request context.
 *
 * In the authoritative LiF application the viewer comes from the existing
 * session and authorization middleware. This module is the single seam where
 * that binding happens — nothing downstream reads a session directly.
 *
 * `app.set('lif.resolveViewer', fn)` lets the host supply the real resolver.
 */

const DEV_VIEWER = {
  memberId: 'mem_dev_0001',
  isMember: true,
  roles: ['member']
};

module.exports = function requestContext() {
  return function requestContextMiddleware(req, res, next) {
    const resolveViewer = req.app.get('lif.resolveViewer');

    if (typeof resolveViewer === 'function') {
      req.viewer = resolveViewer(req);
    } else if (!config.isProduction || config.reviewDeployment) {
      // A review deployment has no session layer behind it, so everyone who
      // opens it is the same fixture Member. This is only reachable because
      // LIF_REVIEW_DEPLOYMENT was set deliberately — see src/config/index.js.
      req.viewer = { ...DEV_VIEWER };
    } else {
      return next(
        new Error(
          'No viewer resolver bound. The host LiF application must call ' +
          "app.set('lif.resolveViewer', fn) so the existing session and " +
          'authorization middleware remain authoritative.'
        )
      );
    }

    const locale = (req.viewer && req.viewer.preferredLanguage) || config.locale;
    const dictionary = terminology.forLocale(locale);

    req.t = dictionary.t;
    res.locals.t = dictionary.t;
    res.locals.locale = dictionary.locale;
    res.locals.env = config.env;
    res.locals.viewer = req.viewer;
    res.locals.requestPath = req.path;
    res.locals.seed = SEED_FOR_VIEW;
    res.locals.reviewDeployment = config.reviewDeployment;

    return next();
  };
};
