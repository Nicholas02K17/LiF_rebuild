'use strict';

const repositories = require('../repositories');
const features = require('../config/features');
const pathwayService = require('./pathway.service');

/**
 * Hub (My Playground) workflow.
 *
 * This is where business decisions are made. Controllers only assemble a view
 * model from what this returns, and EJS templates only display it — no service
 * calls, no permission decisions and no data access happen in a template
 * (AI Run Instructions v2.1 sections 5.1 and 5.4).
 */

const SCOPES = ['for-me', 'whole-playground'];

function normalizeScope(value, fallback) {
  return SCOPES.includes(value) ? value : fallback;
}

/**
 * Ordering rule. Dashboard Unified v1.2 section 0.6: "New since last visit" is
 * a category and a click-through — it is explicitly NOT a card-sorting method.
 * So the Member's saved order is authoritative and newness never reorders.
 */
function orderSummaries(summaries, preference) {
  const order = preference.order || [];
  const rank = new Map(order.map((key, index) => [key, index]));
  return [...summaries].sort((a, b) => {
    const ra = rank.has(a.featureKey) ? rank.get(a.featureKey) : Number.MAX_SAFE_INTEGER;
    const rb = rank.has(b.featureKey) ? rank.get(b.featureKey) : Number.MAX_SAFE_INTEGER;
    return ra - rb;
  });
}

/**
 * A feature the administrator has hidden disappears completely; a feature
 * marked coming-soon is shown, labelled, and not actionable
 * (Dashboard Unified v1.2 section 19.6).
 */
function applyAvailability(summaries) {
  return summaries
    .filter((summary) => features.isVisible(summary.featureKey))
    .map((summary) => {
      if (features.stateOf(summary.featureKey) === 'coming-soon') {
        return {
          ...summary,
          status: 'not-yet-available',
          statusReason: 'This part of the Playground is being prepared. It will open here when it is ready.',
          href: null,
          lines: []
        };
      }
      return summary;
    });
}

/** Counts are already authorized by the repository; this only labels them. */
function decorateSummary(summary, preference) {
  const hidden = new Set(preference.hidden || []);
  const newLines = summary.lines.filter((line) => line.isNew);
  return {
    ...summary,
    hidden: hidden.has(summary.featureKey),
    hasNew: newLines.length > 0,
    newCount: newLines.reduce((total, line) => total + line.count, 0),
    // Every line deep-links into the same page focused on that category.
    lines: summary.lines.map((line) => ({
      ...line,
      href: summary.href ? `${summary.href}?focus=${encodeURIComponent(line.key)}` : null
    }))
  };
}

async function loadHub({ memberId, isMember, scopeOverride, aspectFilterKey, returnToIntent }) {
  const { memberRepository, playgroundRepository } = repositories.get();

  const [identity, pathwayStatus, preference] = await Promise.all([
    memberRepository.findIdentity(memberId),
    memberRepository.findPathwayStatus(memberId),
    memberRepository.findDashboardPreference(memberId)
  ]);

  if (!identity) {
    const notFound = new Error('Member identity not available');
    notFound.status = 404;
    throw notFound;
  }

  const scope = normalizeScope(scopeOverride, preference.scope);

  const viewer = {
    memberId,
    isMember,
    scope,
    aspectFilterKey: aspectFilterKey || null
  };

  const [rawSummaries, activity, suggestions] = await Promise.all([
    playgroundRepository.findFeatureSummaries(viewer),
    playgroundRepository.findCurrentActivity(viewer),
    playgroundRepository.findDiscoverySuggestions(viewer)
  ]);

  const summaries = orderSummaries(applyAvailability(rawSummaries), preference)
    .map((summary) => decorateSummary(summary, preference));

  const pathway = pathwayService.build(pathwayStatus, identity);

  return {
    identity,
    preference: { ...preference, scope },
    scope,
    aspectFilterKey: viewer.aspectFilterKey,
    pathway,
    summaries,
    activity,
    suggestions,
    /**
     * When a participation action was interrupted, the destination is held and
     * the Member is returned to it after I Am Here completion, rather than
     * being dropped on the Hub (Shared Foundation v1.4 section 4).
     */
    returnToIntent: returnToIntent || null,
    isFirstVisit: !identity.lastVisitAt
  };
}

async function saveLayout(memberId, patch) {
  const { memberRepository } = repositories.get();
  const clean = {};
  if (Array.isArray(patch.order)) clean.order = patch.order.map(String);
  if (Array.isArray(patch.hidden)) clean.hidden = patch.hidden.map(String);
  if (typeof patch.pathwayMinimized === 'boolean') clean.pathwayMinimized = patch.pathwayMinimized;
  if (patch.scope !== undefined) clean.scope = normalizeScope(patch.scope, 'for-me');
  return memberRepository.saveDashboardPreference(memberId, clean);
}

/** Restore Default Layout is always available (Dashboard Unified v1.2 section 0.6). */
async function restoreDefaultLayout(memberId) {
  const { memberRepository } = repositories.get();
  return memberRepository.saveDashboardPreference(memberId, {
    order: ['events', 'connections', 'groups', 'opportunities', 'resources', 'organizations', 'commons'],
    hidden: []
  });
}

module.exports = { SCOPES, loadHub, saveLayout, restoreDefaultLayout, normalizeScope };
