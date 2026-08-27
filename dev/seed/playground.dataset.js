'use strict';

/**
 * Review fixtures for the feature pages.
 *
 * Shaped by what each specification says a card must carry, so the pages are
 * reviewed against realistic content rather than lorem ipsum:
 *
 *   Gatherings — Events Human Mapping v1.0 §2: title, image, Host, date/time in
 *     the viewer's timezone, format, language, Area of Interest,
 *     access/eligibility and a truthful availability label.
 *   Groups — Groups Human Mapping v1.1 §4.1: identity, focus, format/location,
 *     language, access, activity status, action.
 *   Map — Map Human Mapping v1.2 §5 and §7: general area only, never an exact
 *     code; E/G/M markers, H for hybrid, N for new; online-only offerings carry
 *     no pin and appear in the Online count.
 *   Calendar — Calendar Human Mapping v1.2 §3: Registered and Interested are
 *     distinct and never conflated.
 *
 * Dates are fixed strings rather than computed, so a review screenshot is
 * reproducible and a test can assert on them.
 */

const DATASET_ID = 'lif-dev-hub';

/** Where "today" sits for the fixtures. The Hub is reviewed against this. */
const TODAY = '2026-08-26';

const events = [
  {
    id: 'ev_0001',
    slug: 'morning-circle-by-the-water',
    title: 'Morning Circle by the Water',
    aspectKey: 'service-offerings',
    host: 'Elena Marchetti',
    hostLine: 'Held by Elena Marchetti',
    invitation: 'A slow start to the day, standing where the harbour meets the light.',
    startsAt: '2026-08-30T08:00:00-03:00',
    dateLabel: 'Saturday 30 August',
    timeLabel: '8:00 AM Atlantic',
    format: 'in-person',
    formatLabel: 'In person',
    place: 'Halifax, Nova Scotia',
    area: 'Halifax area',
    lat: 44.65, lng: -63.57,
    language: 'English',
    cost: null,
    costLabel: 'No cost',
    capacity: 20,
    registered: 11,
    availability: 'open',
    availabilityLabel: 'Open — 9 places left',
    memberState: 'registered',
    isNew: false,
    recording: false,
    accessibility: 'Step-free shoreline path. Seating provided.'
  },
  {
    id: 'ev_0002',
    slug: 'shoreline-restoration-saturdays',
    title: 'Shoreline Restoration Saturdays',
    aspectKey: 'nature-nurture',
    host: 'Coastal Growers',
    hostLine: 'Held by the Coastal Growers Group',
    invitation: 'Hands in the sand, putting the dune grass back where it belongs.',
    startsAt: '2026-09-05T09:30:00-03:00',
    dateLabel: 'Saturday 5 September',
    timeLabel: '9:30 AM Atlantic',
    format: 'in-person',
    formatLabel: 'In person',
    place: 'Lawrencetown Beach',
    area: 'Halifax County',
    lat: 44.64, lng: -63.35,
    language: 'English',
    cost: null,
    costLabel: 'No cost',
    capacity: 30,
    registered: 24,
    availability: 'open',
    availabilityLabel: 'Open — 6 places left',
    memberState: 'suggested',
    reason: 'Because you marked Nature as Deeply Called, and this is near you.',
    isNew: true,
    recording: false,
    accessibility: 'Soft sand. Tools and gloves provided.'
  },
  {
    id: 'ev_0003',
    slug: 'grief-and-growing-reading',
    title: 'Grief and Growing — an evening reading',
    aspectKey: 'whole-human-potential',
    host: 'Tobi Adeyemi',
    hostLine: 'Held by Tobi Adeyemi',
    invitation: 'We read slowly, out loud, and let the silences sit.',
    startsAt: '2026-09-02T19:00:00-03:00',
    dateLabel: 'Tuesday 2 September',
    timeLabel: '7:00 PM Atlantic',
    format: 'online',
    formatLabel: 'Online',
    place: null,
    area: null,
    lat: null, lng: null,
    language: 'English',
    cost: null,
    costLabel: 'No cost',
    capacity: 40,
    registered: 40,
    availability: 'waitlist',
    availabilityLabel: 'Full — waitlist open',
    memberState: 'bookmarked',
    isNew: false,
    recording: true,
    accessibility: 'Live captions. Recording shared with those who attend.'
  },
  {
    id: 'ev_0004',
    slug: 'seed-library-open-hours',
    title: 'Seed Library Open Hours',
    aspectKey: 'source-resources',
    host: 'Wren',
    hostLine: 'You are hosting this',
    invitation: 'Come and take what you need. Bring back what you can.',
    startsAt: '2026-09-09T16:00:00-03:00',
    dateLabel: 'Tuesday 9 September',
    timeLabel: '4:00 PM Atlantic',
    format: 'hybrid',
    formatLabel: 'Hybrid',
    place: 'North Branch Library, Halifax',
    area: 'Halifax area',
    lat: 44.66, lng: -63.59,
    language: 'English',
    cost: null,
    costLabel: 'No cost',
    capacity: null,
    registered: 6,
    availability: 'open',
    availabilityLabel: 'Open — no limit',
    memberState: 'proposed',
    isNew: false,
    recording: false,
    accessibility: 'Step-free. Hearing loop in the meeting room.'
  },
  {
    id: 'ev_0005',
    slug: 'welcome-home-gathering-september',
    title: 'Welcome Home Gathering — September',
    aspectKey: 'community-inclusion',
    host: 'The LiF Member Team',
    hostLine: 'Held by the LiF Member Team',
    invitation: 'A place to be met, welcomed and introduced to other Members.',
    startsAt: '2026-09-11T18:30:00-03:00',
    dateLabel: 'Thursday 11 September',
    timeLabel: '6:30 PM Atlantic',
    format: 'online',
    formatLabel: 'Online',
    place: null,
    area: null,
    lat: null, lng: null,
    language: 'English',
    cost: null,
    costLabel: 'No cost',
    capacity: 60,
    registered: 22,
    availability: 'open',
    availabilityLabel: 'Open — 38 places left',
    memberState: 'suggested',
    reason: 'Because this completes a step on your Welcome Home Pathway.',
    isNew: true,
    recording: false,
    accessibility: 'Live captions. No camera required.'
  },
  {
    id: 'ev_0006',
    slug: 'quiet-hands-mending-circle',
    title: 'Quiet Hands — a mending circle',
    aspectKey: 'presence-being',
    host: 'Marguerite Aubé',
    hostLine: 'Held by Marguerite Aubé',
    invitation: 'Bring the thing you have been meaning to fix.',
    startsAt: '2026-09-18T14:00:00-03:00',
    dateLabel: 'Thursday 18 September',
    timeLabel: '2:00 PM Atlantic',
    format: 'in-person',
    formatLabel: 'In person',
    place: 'Dartmouth',
    area: 'Dartmouth area',
    lat: 44.67, lng: -63.57,
    language: 'Français',
    cost: 12,
    costLabel: '$12 — covers materials',
    capacity: 12,
    registered: 5,
    availability: 'open',
    availabilityLabel: 'Open — 7 places left',
    memberState: 'none',
    isNew: true,
    recording: false,
    accessibility: 'Step-free. Held in French; English materials available.'
  },
  {
    id: 'ev_0007',
    slug: 'winter-planning-closed',
    title: 'Winter Planning — Coastal Growers',
    aspectKey: 'community-inclusion',
    host: 'Coastal Growers',
    hostLine: 'Held by the Coastal Growers Group',
    invitation: 'Setting the shape of the cold months together.',
    startsAt: '2026-08-24T10:00:00-03:00',
    dateLabel: 'Sunday 24 August',
    timeLabel: '10:00 AM Atlantic',
    format: 'hybrid',
    formatLabel: 'Hybrid',
    place: 'Coastal Growers plot',
    area: 'Halifax County',
    lat: 44.63, lng: -63.48,
    language: 'English',
    cost: null,
    costLabel: 'No cost',
    capacity: 25,
    registered: 25,
    availability: 'closed',
    availabilityLabel: 'Registration closed',
    memberState: 'none',
    isNew: false,
    recording: true,
    accessibility: 'Uneven ground at the plot. Online route available.'
  }
];

const groups = [
  {
    id: 'gr_0001',
    slug: 'coastal-growers',
    name: 'Coastal Growers',
    aspectKey: 'community-inclusion',
    focus: 'Restoring the dune line, one Saturday at a time',
    description: 'We grow, plant and mend the shoreline together, and we talk about it a lot.',
    format: 'hybrid',
    formatLabel: 'Hybrid',
    area: 'Halifax County',
    lat: 44.63, lng: -63.48,
    language: 'English',
    access: 'request',
    accessLabel: 'Request Access',
    activity: 'active',
    activityLabel: 'Active',
    memberCountLabel: 'Around 40 Members',
    memberState: 'joined',
    newInAreas: 2,
    isNew: false,
    stewards: 'Elena Marchetti and two other stewards'
  },
  {
    id: 'gr_0002',
    slug: 'seed-savers',
    name: 'Seed Savers',
    aspectKey: 'source-resources',
    focus: 'Keeping open-pollinated varieties in circulation',
    description: 'Saving, labelling, swapping and occasionally arguing about tomatoes.',
    format: 'in-person',
    formatLabel: 'In person',
    area: 'Halifax area',
    lat: 44.66, lng: -63.61,
    language: 'English',
    access: 'request',
    accessLabel: 'Request Access',
    activity: 'active',
    activityLabel: 'Active',
    memberCountLabel: 'Around 25 Members',
    memberState: 'joined',
    newInAreas: 0,
    isNew: false,
    stewards: 'Tobi Adeyemi'
  },
  {
    id: 'gr_0003',
    slug: 'grief-and-growing',
    name: 'Grief and Growing',
    aspectKey: 'whole-human-potential',
    focus: 'A slow-reading Group for people carrying something',
    description: 'We read one short thing a fortnight and meet to sit with it.',
    format: 'online',
    formatLabel: 'Online',
    area: null,
    lat: null, lng: null,
    language: 'English',
    access: 'request',
    accessLabel: 'Request Access',
    activity: 'active',
    activityLabel: 'Active',
    memberCountLabel: 'Around 18 Members',
    memberState: 'suggested',
    reason: 'Because you are Engaged with Whole Human Potential, and this Group reads in English.',
    newInAreas: 0,
    isNew: true,
    stewards: 'Marguerite Aubé'
  },
  {
    id: 'gr_0004',
    slug: 'harbour-walkers',
    name: 'Harbour Walkers',
    aspectKey: 'presence-being',
    focus: 'Walking the same route until we notice it properly',
    description: 'Every Sunday, the same nine kilometres, at whatever pace you have.',
    format: 'in-person',
    formatLabel: 'In person',
    area: 'Halifax area',
    lat: 44.64, lng: -63.575,
    language: 'English',
    access: 'request',
    accessLabel: 'Request Access',
    activity: 'quiet',
    activityLabel: 'Quiet this season',
    memberCountLabel: 'Around 12 Members',
    memberState: 'requested',
    newInAreas: 0,
    isNew: false,
    stewards: 'Priya Raman'
  },
  {
    id: 'gr_0005',
    slug: 'mending-and-making',
    name: 'Mending and Making',
    aspectKey: 'service-offerings',
    focus: 'Repair before replacement',
    description: 'Textiles, small electronics, furniture and the occasional bicycle.',
    format: 'hybrid',
    formatLabel: 'Hybrid',
    area: 'Dartmouth area',
    lat: 44.671, lng: -63.565,
    language: 'Français',
    access: 'request',
    accessLabel: 'Request Access',
    activity: 'active',
    activityLabel: 'Active',
    memberCountLabel: 'Member count hidden by this Group',
    memberState: 'none',
    newInAreas: 0,
    isNew: true,
    stewards: 'Marguerite Aubé'
  },
  {
    id: 'gr_0006',
    slug: 'first-light-swimmers',
    name: 'First Light Swimmers',
    aspectKey: 'engagement-communion',
    focus: 'Cold water, early, together',
    description: 'We go in at sunrise. We do not stay in long.',
    format: 'in-person',
    formatLabel: 'In person',
    area: 'Halifax County',
    lat: 44.60, lng: -63.30,
    language: 'English',
    access: 'invitation',
    accessLabel: 'By invitation',
    activity: 'active',
    activityLabel: 'Active',
    memberCountLabel: 'Around 15 Members',
    memberState: 'none',
    newInAreas: 0,
    isNew: false,
    stewards: 'Not shown for this Group'
  }
];

/** Members who have opted in to appearing on the Map (Map §5). */
const members = [
  {
    id: 'mem_2001', playgroundName: 'Tobi', country: 'Canada', area: 'Halifax area',
    lat: 44.655, lng: -63.60, aspectKey: 'source-resources',
    shared: 'Seed Savers, and an interest in Flow',
    connectionState: 'invited-you', isNew: true
  },
  {
    id: 'mem_2002', playgroundName: 'Elena', country: 'Canada', area: 'Halifax area',
    lat: 44.648, lng: -63.585, aspectKey: 'service-offerings',
    shared: 'Coastal Growers, and Morning Circle by the Water',
    connectionState: 'connected', isNew: false
  },
  {
    id: 'mem_2003', playgroundName: 'Priya', country: 'Canada', area: 'Dartmouth area',
    lat: 44.673, lng: -63.562, aspectKey: 'presence-being',
    shared: 'An interest in Me, and Harbour Walkers',
    connectionState: 'suggested', isNew: true
  },
  {
    id: 'mem_2004', playgroundName: 'Marguerite', country: 'Canada', area: 'Dartmouth area',
    lat: 44.669, lng: -63.571, aspectKey: 'whole-human-potential',
    shared: 'Grief and Growing',
    connectionState: 'connected', isNew: false
  },
  {
    id: 'mem_2005', playgroundName: 'Ade', country: 'Canada', area: 'Halifax County',
    lat: 44.62, lng: -63.42, aspectKey: 'nature-nurture',
    shared: 'An interest in Nature',
    connectionState: 'suggested', isNew: false
  }
];

const connections = {
  connected: members.filter((m) => m.connectionState === 'connected'),
  invitations: [
    {
      id: 'inv_0031',
      from: 'Tobi',
      aspectKey: 'engagement-communion',
      context: 'From the Seed Savers Group · 2 days ago',
      message: 'We ended up in the same seed-saving thread twice this month. I would like to know you properly.',
      isNew: true
    }
  ],
  suggestions: members.filter((m) => m.connectionState === 'suggested')
};

const resources = [
  {
    id: 'res_0001', slug: 'explore-the-playground', title: 'Explore the Playground',
    aspectKey: 'service-offerings', kind: 'Step-by-step tour',
    summary: 'Eleven short cards that walk you through the whole Playground. Leave and resume whenever.',
    memberState: 'suggested', language: 'English', isNew: false
  },
  {
    id: 'res_0002', slug: 'dune-planting-notes', title: 'Dune planting — what we learned',
    aspectKey: 'nature-nurture', kind: 'Notes',
    summary: 'Three seasons of shoreline planting, including the parts that failed.',
    memberState: 'saved', language: 'English', isNew: false
  },
  {
    id: 'res_0003', slug: 'seed-saving-basics', title: 'Seed saving, from the beginning',
    aspectKey: 'source-resources', kind: 'Guide',
    summary: 'How to save, dry, label and store seed so it is still viable next spring.',
    memberState: 'saved', language: 'English', isNew: true
  },
  {
    id: 'res_0004', slug: 'community-guidelines', title: 'Community Guidelines',
    aspectKey: 'community-inclusion', kind: 'Governance',
    summary: 'What we ask of each other here, and what happens when it goes wrong.',
    memberState: 'suggested', language: 'English', isNew: false
  },
  {
    id: 'res_0005', slug: 'reading-list-grief', title: 'Grief and Growing — reading list',
    aspectKey: 'whole-human-potential', kind: 'Reading list',
    summary: 'Everything the Group has read so far, with the short pieces marked.',
    memberState: 'saved', language: 'English', isNew: false
  }
];

const opportunities = [
  {
    id: 'opp_0001', slug: 'seed-library-steward', title: 'Seed library steward',
    aspectKey: 'source-resources', commitment: '2 hours a month',
    summary: 'Keep the library labelled, stocked and open on Tuesdays.',
    area: 'Halifax area', memberState: 'suggested',
    reason: 'Because you are Exploring Flow, and this one is near you.', isNew: true
  },
  {
    id: 'opp_0002', slug: 'shoreline-survey-volunteer', title: 'Shoreline survey volunteer',
    aspectKey: 'nature-nurture', commitment: 'Four mornings, September to October',
    summary: 'Walk a marked stretch and record what is growing back.',
    area: 'Halifax County', memberState: 'suggested',
    reason: 'Because you marked Nature as Deeply Called.', isNew: true
  },
  {
    id: 'opp_0003', slug: 'welcome-host', title: 'Welcome Home Gathering host',
    aspectKey: 'community-inclusion', commitment: 'One evening a month',
    summary: 'Meet new Members and introduce them to the Playground.',
    area: 'Online', memberState: 'saved',
    reason: null, isNew: false
  },
  {
    id: 'opp_0004', slug: 'translation-support', title: 'Translation support — French',
    aspectKey: 'engagement-communion', commitment: 'As and when it suits you',
    summary: 'Help offerings reach Members who read French first.',
    area: 'Online', memberState: 'saved',
    reason: null, isNew: false
  }
];

module.exports = {
  DATASET_ID,
  TODAY,
  events,
  groups,
  members,
  connections,
  resources,
  opportunities
};
