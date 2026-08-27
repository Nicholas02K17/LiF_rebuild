'use strict';

/**
 * Administrator-controlled availability.
 *
 * Dashboard Unified v1.2 §19.6 (FOUNDATIONAL CROSS-FEATURE REQUIREMENT):
 * every offering must be activatable, pausable or hideable without a code
 * change, and an offering that is not ready is never shown as an available
 * Member option. A disabled feature must disappear cleanly from navigation,
 * cards, filters and routes — it must not leave a dead control behind.
 *
 * States:
 *   'active'      — fully available.
 *   'coming-soon' — LiF has intentionally chosen to announce it. Visible,
 *                   clearly labelled, not actionable.
 *   'hidden'      — absent from navigation, cards, search and routes.
 */

const DEFAULT_FEATURES = {
  events:        { state: 'active',      label: 'Gatherings' },
  groups:        { state: 'active',      label: 'Groups' },
  connections:   { state: 'active',      label: 'Connections' },
  resources:     { state: 'active',      label: 'Resources' },
  opportunities: { state: 'active',      label: 'Opportunities to Engage' },
  organizations: { state: 'coming-soon', label: 'Organizations' },
  commons:       { state: 'coming-soon', label: 'Commons' },
  calendar:      { state: 'active',      label: 'Calendar' },
  map:           { state: 'active',      label: 'Map' },
  notifications: { state: 'active',      label: 'Notifications' },
  memberThemes:  { state: 'active',      label: 'Member Aspect themes' },
  playgroundTour:{ state: 'active',      label: 'Explore the Playground' }
};

let current = { ...DEFAULT_FEATURES };

function isVisible(key) {
  const f = current[key];
  return Boolean(f) && f.state !== 'hidden';
}

function isActive(key) {
  const f = current[key];
  return Boolean(f) && f.state === 'active';
}

function stateOf(key) {
  return current[key] ? current[key].state : 'hidden';
}

function all() {
  return Object.entries(current).map(([key, value]) => ({ key, ...value }));
}

/** Used by the administration surface and by tests. */
function setState(key, state) {
  if (!current[key]) throw new Error(`Unknown feature: ${key}`);
  if (!['active', 'coming-soon', 'hidden'].includes(state)) {
    throw new Error(`Unknown feature state: ${state}`);
  }
  current[key] = { ...current[key], state };
  return current[key];
}

function reset() {
  current = { ...DEFAULT_FEATURES };
}

module.exports = { DEFAULT_FEATURES, isVisible, isActive, stateOf, all, setState, reset };
