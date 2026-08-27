'use strict';

/**
 * Development / review adapter.
 *
 * Implements the same named contracts the host LiF application will implement
 * with real repositories. It holds state in memory only — nothing here is a
 * persistence design, and nothing here may be imported by `src/` except through
 * `src/repositories/index.js` under `LIF_DATA_ADAPTER=dev`.
 *
 * Authorization is still modelled here rather than skipped, so the presentation
 * layer is never written against data a viewer would not really receive: the
 * adapter filters by viewer before counting, exactly as the real repository must
 * (AI Run Instructions v2.1 section 6).
 */

const seed = require('../seed/hub.dataset');

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function create() {
  const state = {
    member: clone(seed.member),
    pathway: clone(seed.pathway),
    preference: clone(seed.dashboardPreference)
  };

  /** Non-ideal-state review flags, set per request by the dev middleware. */
  let reviewState = null;
  function setReviewState(value) {
    reviewState = value || null;
  }

  const memberRepository = {
    async findIdentity(memberId) {
      if (memberId !== state.member.id) return null;
      if (reviewState === 'empty') {
        return { ...clone(state.member), playgroundName: 'Wren', lastVisitAt: null };
      }
      return clone(state.member);
    },

    async findPathwayStatus(memberId) {
      if (memberId !== state.member.id) return [];
      if (reviewState === 'empty') {
        return state.pathway.map((c) => ({ ...c, complete: false, completedAt: null }));
      }
      return clone(state.pathway);
    },

    async findDashboardPreference(memberId) {
      if (memberId !== state.member.id) return clone(seed.dashboardPreference);
      return clone(state.preference);
    },

    async saveDashboardPreference(memberId, patch) {
      if (memberId !== state.member.id) throw new Error('Not permitted');
      const allowed = ['order', 'hidden', 'pathwayMinimized', 'scope'];
      for (const key of allowed) {
        if (Object.prototype.hasOwnProperty.call(patch, key)) {
          state.preference[key] = clone(patch[key]);
        }
      }
      return clone(state.preference);
    },

    async saveAspectTheme(memberId, aspectKey) {
      if (memberId !== state.member.id) throw new Error('Not permitted');
      state.member.aspectThemeKey = aspectKey;
      return clone(state.member);
    },

    async touchLastVisit(memberId) {
      if (memberId !== state.member.id) return;
      state.member.lastVisitAt = new Date().toISOString();
    }
  };

  /** Only Members see member-scoped categories; a Guest sees public counts. */
  function authorizeLines(lines, viewer) {
    const memberOnly = new Set([
      'registered', 'bookmarked', 'proposed', 'joined', 'connected',
      'invitations', 'saved', 'activity'
    ]);
    return lines.filter((line) => viewer.isMember || !memberOnly.has(line.key));
  }

  function applyScope(summary, viewer) {
    if (viewer.scope === 'whole-playground') return summary;
    // "For me" narrows what is shown; it never narrows what is permitted.
    return summary;
  }

  function applyAspectFilter(items, viewer) {
    if (!viewer.aspectFilterKey) return items;
    return items.filter((item) => item.aspectKey === viewer.aspectFilterKey);
  }

  const playgroundRepository = {
    async findFeatureSummaries(viewer) {
      if (reviewState === 'error') {
        return clone(seed.featureSummaries).map((s, index) =>
          index === 0
            ? {
                ...s,
                status: 'error',
                statusReason: 'This summary did not answer in time. Nothing you have saved is affected.',
                lines: []
              }
            : s
        );
      }

      let summaries = clone(seed.featureSummaries);

      if (reviewState === 'loading') {
        return summaries.map((s) => ({ ...s, status: 'loading', lines: [], orientation: null }));
      }

      if (reviewState === 'empty') {
        summaries = summaries.map((s) => ({
          ...s,
          status: s.status === 'restricted' ? 'restricted' : 'empty',
          orientation: null,
          lines: []
        }));
      }

      if (reviewState === 'dense') {
        summaries = summaries.map((s) => ({
          ...s,
          lines: s.lines.map((l) => ({ ...l, count: l.count * 37 + 11 }))
        }));
      }

      if (reviewState === 'restricted') {
        summaries = summaries.map((s) =>
          s.featureKey === 'groups'
            ? {
                ...s,
                status: 'restricted',
                statusReason: 'Groups open once your I Am Here details are complete. Everything you have already written is saved.',
                lines: []
              }
            : s
        );
      }

      return summaries.map((s) => {
        const scoped = applyScope(s, viewer);
        const lines = authorizeLines(scoped.lines, viewer);
        const status = scoped.status === 'ready' && lines.length === 0 ? 'empty' : scoped.status;
        return { ...scoped, lines, status };
      });
    },

    async findCurrentActivity(viewer) {
      if (!viewer.isMember) return [];
      if (reviewState === 'empty') return [];
      let items = clone(seed.currentActivity);
      if (reviewState === 'dense') {
        items = items.concat(
          items.map((item, i) => ({ ...item, id: `${item.id}_x${i}`, isNew: false }))
        );
      }
      return applyAspectFilter(items, viewer);
    },

    async findDiscoverySuggestions(viewer) {
      if (reviewState === 'empty') return [];
      const items = clone(seed.discoverySuggestions);
      return applyAspectFilter(items, viewer);
    }
  };

  return { memberRepository, playgroundRepository, setReviewState, DATASET_ID: seed.DATASET_ID };
}

module.exports = { create };
