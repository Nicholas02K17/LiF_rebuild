'use strict';

/**
 * Development / review discovery adapter.
 *
 * Implements the DiscoveryRepository contract over the fixtures. Authorization
 * and filtering are modelled here rather than skipped, so the pages are written
 * against data a real viewer would actually receive:
 *
 *  - a Guest never receives a Member marker, a member-scoped state, or a
 *    private Group's existence;
 *  - counts are taken after filtering, never before;
 *  - "For me" narrows what is shown and never what is permitted;
 *  - an exact coordinate is rounded to a general area before it leaves here.
 */

const seed = require('../seed/playground.dataset');

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

/**
 * Map Human Mapping v1.2 §5: general postal area only. Coordinates are coarsened
 * before they leave the repository so no caller can leak a precise position even
 * by accident.
 */
const AREA_PRECISION = 2;
function coarsen(value) {
  if (value === null || value === undefined) return null;
  return Number(value.toFixed(AREA_PRECISION));
}

function matchesSearch(item, search) {
  if (!search) return true;
  const needle = search.trim().toLowerCase();
  if (!needle) return true;
  // Approved, publicly displayed fields only — never description-only matches
  // that could expose unpublished text through a snippet.
  const haystack = [item.title, item.name, item.focus, item.host, item.area, item.kind]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return haystack.includes(needle);
}

function matchesFilters(item, query) {
  if (query.aspectKey && item.aspectKey !== query.aspectKey) return false;
  if (query.format && item.format !== query.format) return false;
  if (query.language && item.language !== query.language) return false;
  if (query.onlyNew && !item.isNew) return false;
  return true;
}

/**
 * "For me" applies the Member's saved preferences. It narrows the view; it is
 * never a permission boundary, and Whole Playground is always one control away
 * (Shared Foundation v1.4 §6).
 */
function matchesScope(item, query) {
  if (query.scope !== 'for-me') return true;
  if (!query.isMember) return true;
  const mine = [
    'registered', 'bookmarked', 'joined', 'requested', 'proposed', 'saved',
    'suggested',
    // A Member you are already connected to, or who has written to you, is
    // about as "for me" as it gets. Leaving these out dropped every Member
    // marker off the Map under the default scope.
    'connected', 'invited-you'
  ];
  return mine.includes(item.memberState);
}

function create() {
  let reviewState = null;
  function setDiscoveryReviewState(value) {
    reviewState = value || null;
  }

  function collection(records, query, options = {}) {
    if (reviewState === 'empty') {
      return { items: [], total: 0, onlineCount: 0, newCount: 0 };
    }
    if (reviewState === 'error') {
      const failure = new Error('The discovery index did not answer in time');
      failure.memberSafe = true;
      throw failure;
    }

    let items = clone(records);

    // Authorization first, so everything counted below is already permitted.
    if (!query.isMember && options.memberOnly) items = [];
    if (!query.isMember) {
      items = items.filter((item) => item.access !== 'invitation');
      items = items.map((item) => ({ ...item, memberState: 'none', reason: null }));
    }

    items = items
      .filter((item) => matchesSearch(item, query.search))
      .filter((item) => matchesFilters(item, query))
      .filter((item) => matchesScope(item, query))
      .map((item) => ({
        ...item,
        lat: coarsen(item.lat),
        lng: coarsen(item.lng)
      }));

    return {
      items,
      total: items.length,
      onlineCount: items.filter((item) => item.format === 'online').length,
      newCount: items.filter((item) => item.isNew).length
    };
  }

  return {
    setDiscoveryReviewState,

    async findEvents(query) {
      return collection(seed.events, query);
    },

    async findGroups(query) {
      return collection(seed.groups, query);
    },

    async findMembers(query) {
      // Members appear only where they have opted in (Map §5), and never to a
      // Guest. A Member's relationship state is its member state for filtering,
      // so the shared scope rule applies to people the same way it applies to
      // everything else.
      const asItems = seed.members.map((m) => ({ ...m, memberState: m.connectionState }));
      return collection(asItems, query, { memberOnly: true });
    },

    async findResources(query) {
      return collection(seed.resources, query);
    },

    async findOpportunities(query) {
      return collection(seed.opportunities, query);
    },

    async findEvent(slug, viewer) {
      const found = seed.events.find((event) => event.slug === slug);
      if (!found) return null;
      const event = clone(found);
      if (!viewer.isMember) {
        event.memberState = 'none';
        event.accessNote = 'Sign in to register. You can read everything here first.';
      }
      event.lat = coarsen(event.lat);
      event.lng = coarsen(event.lng);
      return event;
    },

    async findGroup(slug, viewer) {
      const found = seed.groups.find((group) => group.slug === slug);
      if (!found) return null;
      // A Group nobody may discover does not exist to an unauthorized viewer —
      // not "exists but is hidden" (Shared Foundation v1.4 §5).
      if (found.access === 'invitation' && found.memberState !== 'joined') return null;
      const group = clone(found);
      if (!viewer.isMember) group.memberState = 'none';
      group.lat = coarsen(group.lat);
      group.lng = coarsen(group.lng);
      return group;
    },

    async findConnections(viewer) {
      if (!viewer.isMember) {
        return { connected: [], invitations: [], suggestions: [] };
      }
      if (reviewState === 'empty') {
        return { connected: [], invitations: [], suggestions: [] };
      }
      return clone(seed.connections);
    }
  };
}

module.exports = { create };
