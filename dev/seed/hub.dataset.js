'use strict';

const DATASET_ID = 'lif-dev-hub';

const member = {
  id: 'mem_dev_0001',
  datasetId: DATASET_ID,
  playgroundName: 'Wren',
  country: 'Canada',
  city: 'Halifax',
  preferredLanguage: 'en',
  aspectThemeKey: null,
  lastVisitAt: '2026-08-22T19:40:00.000Z'
};

const pathway = [
  { key: 'i-am-here', complete: true, required: true, completedAt: '2026-08-20T14:02:00.000Z' },
  { key: 'what-interests-me', complete: true, required: false, completedAt: '2026-08-20T14:19:00.000Z' },
  { key: 'connection-my-way', complete: false, required: false, completedAt: null },
  { key: 'welcome-home-gathering', complete: false, required: false, completedAt: null },
  { key: 'explore-the-playground', complete: false, required: false, completedAt: null }
];

const dashboardPreference = {
  order: ['events', 'connections', 'groups', 'opportunities', 'resources', 'organizations', 'commons'],
  hidden: [],
  pathwayMinimized: false,
  scope: 'for-me'
};

/**
 * Feature summaries. `lines` are plain-language labelled counts — never bare
 * numbers — and each line key is the deep-link focus token for that category.
 */
const featureSummaries = [
  {
    featureKey: 'events',
    title: 'Gatherings',
    orientation: 'Two things you said yes to are coming up.',
    aspectKey: 'service-offerings',
    href: '/gatherings',
    status: 'ready',
    statusReason: null,
    lines: [
      { key: 'registered', label: 'You are registered for', count: 2, isNew: false },
      { key: 'bookmarked', label: 'Saved to look at again', count: 4, isNew: false },
      { key: 'suggested', label: 'Suggested from what interests you', count: 6, isNew: true },
      { key: 'proposed', label: 'Gatherings you proposed', count: 1, isNew: false }
    ]
  },
  {
    featureKey: 'connections',
    title: 'Connections',
    orientation: 'One person is waiting to hear from you.',
    aspectKey: 'engagement-communion',
    href: '/connections',
    status: 'ready',
    statusReason: null,
    lines: [
      { key: 'connected', label: 'Members you are connected with', count: 9, isNew: false },
      { key: 'invitations', label: 'Invitations to Connect waiting for you', count: 1, isNew: true },
      { key: 'suggestions', label: 'Members who share your interests', count: 5, isNew: true }
    ]
  },
  {
    featureKey: 'groups',
    title: 'Groups',
    orientation: 'Quiet this week — which is allowed.',
    aspectKey: 'community-inclusion',
    href: '/groups',
    status: 'ready',
    statusReason: null,
    lines: [
      { key: 'joined', label: 'Groups you belong to', count: 3, isNew: false },
      { key: 'activity', label: 'Group Areas with something new', count: 2, isNew: true },
      { key: 'suggested', label: 'Groups that match your interests', count: 4, isNew: false }
    ]
  },
  {
    featureKey: 'opportunities',
    title: 'Opportunities to Engage',
    orientation: null,
    aspectKey: 'source-resources',
    href: '/opportunities',
    status: 'ready',
    statusReason: null,
    lines: [
      { key: 'suggested', label: 'Matched to what you said calls you', count: 3, isNew: true },
      { key: 'saved', label: 'Saved for later', count: 2, isNew: false }
    ]
  },
  {
    featureKey: 'resources',
    title: 'Resources',
    orientation: 'Including the Playground tour, whenever you want it.',
    aspectKey: 'nature-nurture',
    href: '/resources',
    status: 'ready',
    statusReason: null,
    lines: [
      { key: 'saved', label: 'Saved by you', count: 7, isNew: false },
      { key: 'suggested', label: 'Suggested for you', count: 4, isNew: false }
    ]
  },
  {
    featureKey: 'organizations',
    title: 'Organizations',
    orientation: null,
    aspectKey: 'presence-being',
    href: '/organizations',
    status: 'restricted',
    statusReason: 'Organizations open up once a verified organization relationship is on your account. Nothing is missing from your Playground until then.',
    lines: []
  },
  {
    featureKey: 'commons',
    title: 'Commons',
    orientation: null,
    aspectKey: 'whole-human-potential',
    href: '/commons',
    status: 'empty',
    statusReason: null,
    lines: []
  }
];

/** Priority 2 in the information hierarchy: context plus one direct action. */
const currentActivity = [
  {
    id: 'act_0001',
    kind: 'registered-event',
    aspectKey: 'service-offerings',
    title: 'Morning Circle by the Water',
    context: 'Saturday 30 August, 8:00 AM Atlantic · In person, Halifax',
    body: 'You are registered. Elena is hosting, and eleven Members are coming.',
    actionLabel: 'See the details',
    actionHref: '/gatherings/morning-circle-by-the-water',
    isNew: false
  },
  {
    id: 'act_0002',
    kind: 'connection-invitation',
    aspectKey: 'engagement-communion',
    title: 'Tobi sent you an Invitation to Connect',
    context: 'From the Seed Savers Group · 2 days ago',
    body: 'We ended up in the same seed-saving thread twice this month. I would like to know you properly.',
    actionLabel: 'Read and respond',
    actionHref: '/connections/invitations/inv_0031',
    isNew: true
  },
  {
    id: 'act_0003',
    kind: 'group-activity',
    aspectKey: 'community-inclusion',
    title: 'Coastal Growers posted in Planning',
    context: 'Group Area · Planning · yesterday',
    body: 'Three replies since you last looked. Nothing needs you — it is there when you want it.',
    actionLabel: 'Open the Group Area',
    actionHref: '/groups/coastal-growers/planning',
    isNew: true
  },
  {
    id: 'act_0004',
    kind: 'saved-step',
    aspectKey: 'whole-human-potential',
    title: 'You were part-way through Connection, My Way',
    context: 'Saved 4 days ago · nothing was lost',
    body: 'You had chosen how you would like to be discovered. The rest is still waiting exactly where you left it.',
    actionLabel: 'Pick it back up',
    actionHref: '/pathway/connection-my-way',
    isNew: false
  }
];

const discoverySuggestions = [
  {
    id: 'sug_0001',
    aspectKey: 'nature-nurture',
    title: 'Shoreline Restoration Saturdays',
    kind: 'Gathering',
    reason: 'Because you marked Nature as Deeply Called, and this is in Halifax.',
    href: '/gatherings/shoreline-restoration-saturdays'
  },
  {
    id: 'sug_0002',
    aspectKey: 'whole-human-potential',
    title: 'Grief and Growing — a slow-reading Group',
    kind: 'Group',
    reason: 'Because you are Engaged with Whole Human Potential, and this Group reads in English.',
    href: '/groups/grief-and-growing'
  },
  {
    id: 'sug_0003',
    aspectKey: 'source-resources',
    title: 'Seed library steward — 2 hours a month',
    kind: 'Opportunity to Engage',
    reason: 'Because you are Exploring Flow, and this one is near you.',
    href: '/opportunities/seed-library-steward'
  }
];

module.exports = {
  DATASET_ID,
  member,
  pathway,
  dashboardPreference,
  featureSummaries,
  currentActivity,
  discoverySuggestions
};
