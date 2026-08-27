'use strict';

const featuresService = require('../services/features.service');
const { navigationFor } = require('../viewmodels/hub.viewModel');
const { listAspects } = require('../content/aspects');
const config = require('../config');
const repositories = require('../repositories');

const REVIEW_STATES = ['empty', 'loading', 'error', 'dense', 'restricted'];

function applyReviewState(req) {
  if (config.isProduction && !config.reviewDeployment) return null;
  const requested = String(req.query.state || '');
  if (!REVIEW_STATES.includes(requested)) return null;
  const bound = repositories.get();
  if (typeof bound.setReviewState === 'function') bound.setReviewState(requested);
  return requested;
}

function clearReviewState(applied) {
  if (!applied) return;
  try {
    const bound = repositories.get();
    if (typeof bound.setReviewState === 'function') bound.setReviewState(null);
  } catch {
    /* the adapter is gone; the response is already settled */
  }
}

/**
 * The shell every feature page shares: navigation, the Aspect filter, the
 * scope switch and the review flag. Built once, here, so no page invents its
 * own version of the same controls.
 */
function shell(req, model, extras = {}) {
  return {
    page: { title: `${model.title} — Love is Foundation`, path: req.path, reviewState: extras.reviewState || null },
    navigation: navigationFor(),
    aspects: listAspects(),
    ...model
  };
}

function handler(name, load, view, title, orientation) {
  return async function featurePage(req, res, next) {
    const reviewState = applyReviewState(req);
    try {
      const data = await load(req.query, req.viewer, req.params);
      const model = shell(req, { title, orientation, ...data }, { reviewState });
      res.renderPage(view, { model, page: model.page });
    } catch (error) {
      next(error);
    } finally {
      clearReviewState(reviewState);
    }
  };
}

const gatherings = handler(
  'events',
  (query, viewer) => featuresService.loadEvents(query, viewer),
  'features/gatherings/index',
  'Gatherings',
  'What is being offered, and whether it is for you.'
);

const gathering = handler(
  'event',
  (query, viewer, params) => featuresService.loadEvent(params.slug, viewer).then((event) => ({ event })),
  'features/gatherings/detail',
  'A Gathering',
  null
);

const groups = handler(
  'groups',
  (query, viewer) => featuresService.loadGroups(query, viewer),
  'features/groups/index',
  'Groups',
  'Places people gather around a shared purpose.'
);

const group = handler(
  'group',
  (query, viewer, params) => featuresService.loadGroup(params.slug, viewer).then((group) => ({ group })),
  'features/groups/detail',
  'A Group',
  null
);

const connections = handler(
  'connections',
  (query, viewer) => featuresService.loadConnections(viewer).then((connections) => ({ connections })),
  'features/connections/index',
  'Connections',
  'The people you have met here, and the ones who would like to meet you.'
);

const calendar = handler(
  'calendar',
  (query, viewer) => featuresService.loadCalendar(query, viewer),
  'features/calendar/index',
  'Calendar',
  'See what is happening across the Playground.'
);

const map = handler(
  'map',
  (query, viewer) => featuresService.loadMap(query, viewer),
  'features/map/index',
  'Map',
  'Explore what is happening across the Playground.'
);

const resources = handler(
  'resources',
  (query, viewer) => featuresService.loadResources(query, viewer),
  'features/resources/index',
  'Resources',
  'What the Playground has gathered and kept.'
);

const opportunities = handler(
  'opportunities',
  (query, viewer) => featuresService.loadOpportunities(query, viewer),
  'features/opportunities/index',
  'Opportunities to Engage',
  'Ways to put your hands to something here.'
);

module.exports = {
  gatherings,
  gathering,
  groups,
  group,
  connections,
  calendar,
  map,
  resources,
  opportunities
};
