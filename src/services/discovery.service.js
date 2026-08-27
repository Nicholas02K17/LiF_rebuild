'use strict';

const repositories = require('../repositories');
const features = require('../config/features');
const { getAspect } = require('../content/aspects');

/**
 * Shared discovery.
 *
 * Shared Foundation v1.4 §8 asks for one discovery behaviour across Events,
 * Groups, Members, Resources, Opportunities, the Calendar and the Map — the
 * same filters, the same "For me", the same truthful counts — with each feature
 * supplying only what is distinctive about it.
 *
 * This is where a query is normalised and a result is shaped. Every business
 * decision lives here; controllers assemble, templates display.
 */

const SCOPES = ['for-me', 'whole-playground'];
const FORMATS = ['in-person', 'online', 'hybrid'];

/** Never trust a query string. Anything unrecognised becomes "no filter". */
function normalizeQuery(raw, viewer) {
  const scope = SCOPES.includes(raw.scope) ? raw.scope : 'for-me';
  const aspect = raw.aspect && getAspect(String(raw.aspect)) ? String(raw.aspect) : null;
  const format = FORMATS.includes(raw.format) ? raw.format : null;
  const search = typeof raw.q === 'string' ? raw.q.slice(0, 120) : null;
  const language = typeof raw.language === 'string' ? raw.language.slice(0, 40) : null;

  return {
    memberId: viewer.memberId,
    isMember: Boolean(viewer.isMember),
    scope,
    search,
    aspectKey: aspect,
    format,
    language,
    onlyNew: raw.new === 'true' || raw.new === '1'
  };
}

/**
 * The filters a Member has actually applied, so the page can show them and —
 * more importantly — offer a way out of every one of them. A filtered view must
 * never become a place a Member cannot leave (Map §4, Groups §3.2).
 */
function describeFilters(query, basePath) {
  const applied = [];
  const paramsFor = (omit) => {
    const params = new URLSearchParams();
    if (query.search && omit !== 'q') params.set('q', query.search);
    if (query.aspectKey && omit !== 'aspect') params.set('aspect', query.aspectKey);
    if (query.format && omit !== 'format') params.set('format', query.format);
    if (query.language && omit !== 'language') params.set('language', query.language);
    if (query.onlyNew && omit !== 'new') params.set('new', 'true');
    if (query.scope !== 'for-me') params.set('scope', query.scope);
    const string = params.toString();
    return string ? `${basePath}?${string}` : basePath;
  };

  if (query.search) applied.push({ key: 'q', label: `“${query.search}”`, removeHref: paramsFor('q') });
  if (query.aspectKey) {
    const aspect = getAspect(query.aspectKey);
    applied.push({ key: 'aspect', label: aspect.label, removeHref: paramsFor('aspect') });
  }
  if (query.format) {
    const label = { 'in-person': 'In person', online: 'Online', hybrid: 'Hybrid' }[query.format];
    applied.push({ key: 'format', label, removeHref: paramsFor('format') });
  }
  if (query.language) applied.push({ key: 'language', label: query.language, removeHref: paramsFor('language') });
  if (query.onlyNew) applied.push({ key: 'new', label: 'New since your last visit', removeHref: paramsFor('new') });

  return {
    applied,
    clearAllHref: basePath,
    hasAny: applied.length > 0,
    formatHref: (format) => {
      const params = new URLSearchParams();
      if (query.search) params.set('q', query.search);
      if (query.aspectKey) params.set('aspect', query.aspectKey);
      if (format) params.set('format', format);
      if (query.language) params.set('language', query.language);
      if (query.onlyNew) params.set('new', 'true');
      if (query.scope !== 'for-me') params.set('scope', query.scope);
      const string = params.toString();
      return string ? `${basePath}?${string}` : basePath;
    },
    scopeHref: (scope) => {
      const params = new URLSearchParams();
      if (query.search) params.set('q', query.search);
      if (query.aspectKey) params.set('aspect', query.aspectKey);
      if (query.format) params.set('format', query.format);
      if (query.language) params.set('language', query.language);
      if (query.onlyNew) params.set('new', 'true');
      if (scope !== 'for-me') params.set('scope', scope);
      const string = params.toString();
      return string ? `${basePath}?${string}` : basePath;
    },
    aspectHref: (aspectKey) => {
      const params = new URLSearchParams();
      if (query.search) params.set('q', query.search);
      if (aspectKey && aspectKey !== query.aspectKey) params.set('aspect', aspectKey);
      if (query.format) params.set('format', query.format);
      if (query.language) params.set('language', query.language);
      if (query.onlyNew) params.set('new', 'true');
      if (query.scope !== 'for-me') params.set('scope', query.scope);
      const string = params.toString();
      return string ? `${basePath}?${string}` : basePath;
    }
  };
}

/**
 * An empty result is not one thing.
 *
 * Dashboard Unified v1.2 §0.11 distinguishes "nothing exists" from "nothing
 * matches your filters" from "nothing new" — a Member who has filtered
 * themselves into a corner needs a different sentence, and a different way out,
 * from one who is simply early.
 */
function emptiness(result, query, filters, noun) {
  if (result.total > 0) return null;

  if (filters.hasAny) {
    return {
      kind: 'no-matches',
      title: 'Nothing matches what you are showing right now.',
      body: `There are ${noun} here — none of them fit these filters. Try removing one.`,
      action: { label: 'Clear the filters', href: filters.clearAllHref }
    };
  }

  if (query.scope === 'for-me') {
    return {
      kind: 'none-for-me',
      title: 'Nothing here matches your saved preferences yet.',
      body: 'The Whole Playground is one click away, and nothing you have saved changes by looking.',
      action: { label: 'Show the Whole Playground', href: filters.scopeHref('whole-playground') }
    };
  }

  return {
    kind: 'nothing-yet',
    title: 'Nothing is here yet.',
    body: `When ${noun} appear here, this is where you will find them.`,
    action: null
  };
}

async function search(kind, raw, viewer, basePath, noun) {
  const { discoveryRepository } = repositories.get();
  const query = normalizeQuery(raw, viewer);
  const filters = describeFilters(query, basePath);

  const method = {
    events: 'findEvents',
    groups: 'findGroups',
    members: 'findMembers',
    resources: 'findResources',
    opportunities: 'findOpportunities'
  }[kind];

  let result;
  try {
    result = await discoveryRepository[method](query);
  } catch (error) {
    // A discovery outage is a state, not a crash. The Member keeps the page,
    // the filters they set, and a way to try again.
    return {
      query,
      filters,
      items: [],
      total: 0,
      onlineCount: 0,
      newCount: 0,
      failure: {
        title: 'We could not bring these in just now.',
        body: 'Nothing you have chosen is lost. The filters you set are still here.',
        action: { label: 'Try again', href: basePath }
      },
      empty: null
    };
  }

  return {
    query,
    filters,
    items: result.items,
    total: result.total,
    onlineCount: result.onlineCount,
    newCount: result.newCount,
    failure: null,
    empty: emptiness(result, query, filters, noun)
  };
}

/** A feature turned off by an administrator is not reachable at all (§19.6). */
function assertAvailable(featureKey) {
  if (!features.isVisible(featureKey)) {
    const gone = new Error('Not available');
    gone.status = 404;
    throw gone;
  }
  if (!features.isActive(featureKey)) {
    const soon = new Error('Not open yet');
    soon.status = 503;
    soon.comingSoon = true;
    throw soon;
  }
}

module.exports = { SCOPES, FORMATS, normalizeQuery, describeFilters, search, assertAvailable };
