'use strict';

const express = require('express');
const features = require('../config/features');
const { navigationFor } = require('../viewmodels/hub.viewModel');

/**
 * Reviewable destination prototypes.
 *
 * The Hub's job in this slice is the Hub. The feature pages behind it belong to
 * their own Unified specifications and their own Journey IDs. Rather than
 * shipping broken links or empty boxes, each destination answers with a
 * labelled prototype that states what it is, which specification owns it, and
 * how to get back — which is exactly what section 10 asks for.
 *
 * Each page is marked PROTOTYPE — REQUIRES LiF APPROVAL in its own surface.
 */

const router = express.Router();

const DESTINATIONS = [
  {
    // Explore the Playground lives permanently in the Resources Library and is
    // never a dead end, so it has its own route rather than folding into
    // /resources (Dashboard Unified v1.2 sections 11 and 19.7).
    path: '/resources/explore-the-playground',
    featureKey: 'playgroundTour',
    title: 'Explore the Playground',
    owner: 'Dashboard Unified Implementation Specification v1.2 section 19.7 — step-by-step tutorial cards',
    aspectKey: 'service-offerings'
  },
  { path: '/organizations', featureKey: 'organizations', title: 'Organizations', owner: 'Dashboard Unified Implementation Specification v1.2 section 12.1', aspectKey: 'presence-being' },
  { path: '/commons', featureKey: 'commons', title: 'Commons', owner: 'Dashboard Unified Implementation Specification v1.2 section 12.1 — detailed mapping pending', aspectKey: 'whole-human-potential' },
  { path: '/pathway/:component', featureKey: null, title: 'Welcome Home Pathway', owner: 'Dashboard Unified Implementation Specification v1.2 sections 6 to 11', aspectKey: 'whole-human-potential' },

  /**
   * Individual records the Hub points at.
   *
   * Each belongs to its own feature's Unified specification, so none of them is
   * built here — but every one of them answers. A Member who follows an
   * invitation or a Gathering from their Hub must never land on a 404 that
   * looks like the thing was taken away from them (section 10, and Dashboard
   * Unified v1.2 section 0.11 on dead ends).
   */
  { path: '/connections/invitations/:id', featureKey: 'connections', title: 'Invitation to Connect', owner: 'Dashboard Unified Implementation Specification v1.2 sections 9 and 19.3', aspectKey: 'engagement-communion' },
  { path: '/groups/:slug/:area', featureKey: 'groups', title: 'A Group Area', owner: 'Groups Unified Implementation Specification v2.1', aspectKey: 'community-inclusion' },
  { path: '/resources/:slug', featureKey: 'resources', title: 'A Resource', owner: 'Shared Foundation v1.4 section 12', aspectKey: 'nature-nurture' },
  { path: '/opportunities/:slug', featureKey: 'opportunities', title: 'An Opportunity to Engage', owner: 'Shared Foundation v1.4 section 6', aspectKey: 'source-resources' },
  { path: '/sign-in', featureKey: null, title: 'Sign in', owner: 'Dashboard Unified Implementation Specification v1.2 section 5.3 — passwordless six-digit code', aspectKey: 'presence-being' }
];

for (const destination of DESTINATIONS) {
  router.get(destination.path, (req, res, next) => {
    // A hidden feature must not leave a reachable route behind (section 19.6).
    if (destination.featureKey && !features.isVisible(destination.featureKey)) {
      const gone = new Error('Not available');
      gone.status = 404;
      return next(gone);
    }

    return res.renderPage('features/hub/prototype', {
      page: { title: `${destination.title} — Love is Foundation`, path: req.path, reviewState: null },
      destination: {
        ...destination,
        focus: req.query.focus ? String(req.query.focus) : null,
        component: req.params.component || null,
        comingSoon: destination.featureKey ? features.stateOf(destination.featureKey) === 'coming-soon' : false
      },
      navigation: navigationFor()
    });
  });
}

module.exports = router;
