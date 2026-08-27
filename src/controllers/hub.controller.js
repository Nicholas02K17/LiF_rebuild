'use strict';

const hubService = require('../services/hub.service');
const hubViewModel = require('../viewmodels/hub.viewModel');
const config = require('../config');
const repositories = require('../repositories');

const REVIEW_STATES = ['empty', 'loading', 'error', 'dense', 'restricted'];

/**
 * Non-ideal states are reviewable from the browser, so the LiF experience
 * reviewer never has to read code to see an empty, restricted or failing Hub.
 *
 * Available in development, and on a deployment that declared itself a review
 * deployment — that is what a review deployment is for. Inert in a real
 * production release, where `?state=` is ignored completely.
 */
function applyReviewState(req) {
  if (config.isProduction && !config.reviewDeployment) return null;
  const requested = String(req.query.state || '');
  if (!REVIEW_STATES.includes(requested)) return null;
  const bound = repositories.get();
  if (typeof bound.setReviewState === 'function') bound.setReviewState(requested);
  return requested;
}

/**
 * Only ever undo something that was actually done.
 *
 * This runs in a `finally`, which is the worst place to throw from: it fires
 * after the response has already been decided, and the failure it raises
 * replaces whatever the request was going to say. So it does nothing at all
 * unless a review state was applied, and it swallows an adapter that has since
 * become unavailable — by then the request already has its answer.
 */
function clearReviewState(applied) {
  if (!applied) return;
  try {
    const bound = repositories.get();
    if (typeof bound.setReviewState === 'function') bound.setReviewState(null);
  } catch {
    /* the adapter is gone; the response is already settled either way */
  }
}

async function show(req, res, next) {
  let reviewState = null;
  try {
    reviewState = applyReviewState(req);
    const hub = await hubService.loadHub({
      memberId: req.viewer.memberId,
      isMember: Boolean(req.viewer.isMember),
      scopeOverride: req.query.scope,
      aspectFilterKey: req.query.aspect,
      returnToIntent: req.session && req.session.returnToIntent ? req.session.returnToIntent : null
    });

    const model = hubViewModel.build(hub, {
      t: req.t,
      requestPath: req.path,
      reviewState
    });

    // `page` is lifted out for the shared layout, which is the only thing that
    // needs it; the page template works from `model`.
    res.renderPage('features/hub/index', { model, page: model.page });
  } catch (error) {
    next(error);
  } finally {
    // Pass what was actually applied. Without it the guard inside sees
    // undefined, returns early, and the review state leaks into every
    // subsequent request on this instance.
    clearReviewState(reviewState);
  }
}

/**
 * Layout preference save.
 *
 * Post/Redirect/Get so a refresh never re-submits, with a JSON path for the
 * progressive-enhancement module. Both go through the same service, so the
 * enhanced and unenhanced routes can never drift (section 5.3).
 */
async function saveLayout(req, res, next) {
  try {
    const patch = {};
    if (req.body.order) {
      patch.order = String(req.body.order).split(',').map((s) => s.trim()).filter(Boolean);
    }
    if (req.body.hidden !== undefined) {
      patch.hidden = String(req.body.hidden).split(',').map((s) => s.trim()).filter(Boolean);
    }

    // Hide and Show arrive as a single feature key from a card or a chip. They
    // are resolved against the saved list here rather than in the template, so
    // the enhanced and unenhanced paths cannot drift apart.
    if (req.body.hideCard || req.body.showCard) {
      const repositoriesForRead = require('../repositories').get();
      const saved = await repositoriesForRead.memberRepository.findDashboardPreference(req.viewer.memberId);
      const hidden = new Set(saved.hidden || []);
      if (req.body.hideCard) hidden.add(String(req.body.hideCard));
      if (req.body.showCard) hidden.delete(String(req.body.showCard));
      patch.hidden = Array.from(hidden);
    }
    if (req.body.pathwayMinimized !== undefined) {
      patch.pathwayMinimized = req.body.pathwayMinimized === 'true' || req.body.pathwayMinimized === true;
    }
    if (req.body.scope !== undefined) patch.scope = req.body.scope;

    const saved = await hubService.saveLayout(req.viewer.memberId, patch);

    if (req.accepts(['html', 'json']) === 'json') {
      return res.json({ ok: true, preference: saved });
    }
    return res.redirect(303, req.body.returnTo || '/');
  } catch (error) {
    return next(error);
  }
}

async function restoreLayout(req, res, next) {
  try {
    const saved = await hubService.restoreDefaultLayout(req.viewer.memberId);
    if (req.accepts(['html', 'json']) === 'json') {
      return res.json({ ok: true, preference: saved });
    }
    return res.redirect(303, '/');
  } catch (error) {
    return next(error);
  }
}

/**
 * Aspect theme selection.
 *
 * Brand Reference v1.1 section 4: theme accents may affect navigation
 * highlights, buttons, card borders and selected states. They never change
 * logo/Aspect colours or functional safety and status colours, and the
 * administrator may turn selection off without deleting a saved choice.
 */
async function saveAspectTheme(req, res, next) {
  try {
    const features = require('../config/features');
    if (!features.isActive('memberThemes')) {
      const off = new Error('Theme selection is turned off');
      off.status = 403;
      throw off;
    }
    const { memberRepository } = repositories.get();
    const requested = req.body.aspectKey ? String(req.body.aspectKey) : null;
    const { getAspect } = require('../content/aspects');
    if (requested && !getAspect(requested)) {
      const bad = new Error('Unknown Aspect');
      bad.status = 400;
      throw bad;
    }
    const identity = await memberRepository.saveAspectTheme(req.viewer.memberId, requested);
    if (req.accepts(['html', 'json']) === 'json') {
      return res.json({ ok: true, aspectThemeKey: identity.aspectThemeKey });
    }
    return res.redirect(303, req.body.returnTo || '/');
  } catch (error) {
    return next(error);
  }
}

module.exports = { show, saveLayout, restoreLayout, saveAspectTheme };
