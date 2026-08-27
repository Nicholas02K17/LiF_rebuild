'use strict';

const repositories = require('../repositories');
const discovery = require('./discovery.service');
const { listAspects, getAspect } = require('../content/aspects');

/**
 * The feature pages.
 *
 * Each of these is the landing view for its feature's recommended journey, as
 * named in Build Instructions v3.4 Step 3:
 *
 *   Events   EV-J-006  register for an available free Event
 *   Groups   GR-J-003  request access to a Group
 *   Map      MAP-J-001 open the authorized Playground Map
 *   Calendar CAL-J-001 open the Playground Calendar
 *
 * Connections, Resources and Opportunities have no separate specification yet,
 * so they are built from the Shared Foundation and the Dashboard's own sections
 * and are marked as such on the page.
 */

/* ------------------------------------------------------------------ events */

/**
 * Events Human Mapping v1.0 §2 requires a *truthful* availability label — one
 * that never implies a place exists when it does not, and never hides a
 * waitlist behind a closed door.
 */
const AVAILABILITY = {
  open: { tone: 'open', canRegister: true, action: 'Register' },
  waitlist: { tone: 'waiting', canRegister: false, action: 'Join the waitlist' },
  closed: { tone: 'closed', canRegister: false, action: null }
};

function shapeEvent(event, viewer) {
  const availability = AVAILABILITY[event.availability] || AVAILABILITY.closed;

  // Show only actions this viewer can actually take (§3).
  let primaryAction = null;
  if (!viewer.isMember) {
    primaryAction = { label: 'Sign in to register', href: '/sign-in', tone: 'quiet' };
  } else if (event.memberState === 'registered') {
    primaryAction = { label: 'You are registered', href: `/gatherings/${event.slug}`, tone: 'done' };
  } else if (event.memberState === 'proposed') {
    primaryAction = { label: 'You are hosting', href: `/gatherings/${event.slug}`, tone: 'done' };
  } else if (availability.action) {
    primaryAction = { label: availability.action, href: `/gatherings/${event.slug}`, tone: 'primary' };
  }

  return {
    ...event,
    href: `/gatherings/${event.slug}`,
    availabilityTone: availability.tone,
    primaryAction,
    whenLabel: `${event.dateLabel}, ${event.timeLabel}`,
    placeLabel: event.place || 'Online',
    aspect: getAspect(event.aspectKey)
  };
}

async function loadEvents(raw, viewer) {
  discovery.assertAvailable('events');
  const result = await discovery.search('events', raw, viewer, '/gatherings', 'gatherings');
  return { ...result, items: result.items.map((event) => shapeEvent(event, viewer)) };
}

async function loadEvent(slug, viewer) {
  discovery.assertAvailable('events');
  const { discoveryRepository } = repositories.get();
  const event = await discoveryRepository.findEvent(slug, viewer);
  if (!event) {
    const missing = new Error('Not found');
    missing.status = 404;
    throw missing;
  }
  return shapeEvent(event, viewer);
}

/* ------------------------------------------------------------------ groups */

/**
 * Groups Human Mapping v1.1 §2 and §5: participation begins through Request
 * Access or an authorized invitation. There is no public instant join, so no
 * card ever offers one.
 */
function shapeGroup(group, viewer) {
  let primaryAction = null;
  if (!viewer.isMember) {
    primaryAction = { label: 'Sign in to request access', href: '/sign-in', tone: 'quiet' };
  } else if (group.memberState === 'joined') {
    primaryAction = { label: 'Open the Group', href: `/groups/${group.slug}`, tone: 'primary' };
  } else if (group.memberState === 'requested') {
    primaryAction = { label: 'Request pending', href: `/groups/${group.slug}`, tone: 'waiting' };
  } else if (group.access === 'invitation') {
    primaryAction = { label: 'By invitation', href: `/groups/${group.slug}`, tone: 'quiet' };
  } else {
    primaryAction = { label: 'Request Access', href: `/groups/${group.slug}`, tone: 'primary' };
  }

  return {
    ...group,
    href: `/groups/${group.slug}`,
    primaryAction,
    placeLabel: group.area || 'Online',
    aspect: getAspect(group.aspectKey)
  };
}

async function loadGroups(raw, viewer) {
  discovery.assertAvailable('groups');
  const result = await discovery.search('groups', raw, viewer, '/groups', 'Groups');
  const items = result.items.map((group) => shapeGroup(group, viewer));

  // §3.1 — My Groups and Explore Groups are distinct regions, not one list.
  return {
    ...result,
    items,
    mine: items.filter((g) => ['joined', 'requested'].includes(g.memberState)),
    explore: items.filter((g) => !['joined', 'requested'].includes(g.memberState))
  };
}

async function loadGroup(slug, viewer) {
  discovery.assertAvailable('groups');
  const { discoveryRepository } = repositories.get();
  const group = await discoveryRepository.findGroup(slug, viewer);
  if (!group) {
    // A Group this viewer may not discover reads exactly like one that is not
    // there. Nothing distinguishes them (Shared Foundation v1.4 §5).
    const missing = new Error('Not found');
    missing.status = 404;
    throw missing;
  }
  return shapeGroup(group, viewer);
}

/* ------------------------------------------------------------- connections */

async function loadConnections(viewer) {
  discovery.assertAvailable('connections');
  const { discoveryRepository } = repositories.get();
  const connections = await discoveryRepository.findConnections(viewer);
  return {
    ...connections,
    total: connections.connected.length,
    invitationCount: connections.invitations.length
  };
}

/* ---------------------------------------------------------------- calendar */

/**
 * Calendar Human Mapping v1.2 §3 and §4.
 *
 * The grid shows one month and can be moved through, because a Calendar that
 * can only ever show one hard-coded month is not a Calendar. The month defaults
 * to the one containing today, so "My Calendar" shows what a Member actually
 * has coming up rather than an arbitrary page of it.
 *
 * Registered and Interested stay distinct and are never conflated, and only
 * authorized Events reach the grid — so a day count can never leak the
 * existence of a private one.
 */
const TODAY = require('../config').today;

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function parseMonth(value, fallback) {
  if (typeof value === 'string' && /^\d{4}-\d{2}$/.test(value)) {
    const year = Number(value.slice(0, 4));
    const month = Number(value.slice(5, 7));
    if (month >= 1 && month <= 12) return { year, month };
  }
  return fallback;
}

function shiftMonth({ year, month }, delta) {
  const zero = month - 1 + delta;
  return { year: year + Math.floor(zero / 12), month: ((zero % 12) + 12) % 12 + 1 };
}

function monthKey({ year, month }) {
  return `${year}-${String(month).padStart(2, '0')}`;
}

/** Monday-first column for the 1st, and the real length of the month. */
function monthShape({ year, month }) {
  const first = new Date(Date.UTC(year, month - 1, 1));
  const jsDay = first.getUTCDay(); // 0 = Sunday
  return {
    startColumn: jsDay === 0 ? 7 : jsDay,
    days: new Date(Date.UTC(year, month, 0)).getUTCDate()
  };
}

async function loadCalendar(raw, viewer) {
  discovery.assertAvailable('calendar');
  const result = await discovery.search('events', raw, viewer, '/calendar', 'gatherings');

  const mode = ['playground', 'mine', 'new'].includes(raw.mode) ? raw.mode : 'playground';
  let items = result.items;
  if (mode === 'mine') {
    items = items.filter((e) => ['registered', 'bookmarked'].includes(e.memberState));
  } else if (mode === 'new') {
    items = items.filter((e) => e.isNew);
  }

  const shaped = items.map((event) => shapeEvent(event, viewer));

  const today = { year: Number(TODAY.slice(0, 4)), month: Number(TODAY.slice(5, 7)) };
  const current = parseMonth(raw.month, today);
  const key = monthKey(current);
  const { startColumn, days } = monthShape(current);

  const inMonth = shaped.filter((event) => event.startsAt.slice(0, 7) === key);
  const outsideMonth = shaped.length - inMonth.length;

  const byDay = new Map();
  for (const event of inMonth) {
    const day = Number(event.startsAt.slice(8, 10));
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day).push(event);
  }

  const cells = [];
  for (let i = 1; i < startColumn; i += 1) cells.push({ blank: true });
  for (let day = 1; day <= days; day += 1) {
    const dayEvents = byDay.get(day) || [];
    cells.push({
      blank: false,
      day,
      isToday: key === TODAY.slice(0, 7) && day === Number(TODAY.slice(8, 10)),
      events: dayEvents,
      // Dense days summarise rather than overflow (§5).
      overflow: Math.max(0, dayEvents.length - 2),
      shown: dayEvents.slice(0, 2)
    });
  }

  const keepMode = mode === 'playground' ? '' : `&mode=${mode}`;

  return {
    ...result,
    mode,
    monthLabel: `${MONTH_NAMES[current.month - 1]} ${current.year}`,
    monthKey: key,
    cells,
    // The list is the grid's month, so "the same records" is true of both.
    scheduled: inMonth,
    outsideMonth,
    prevHref: `/calendar?month=${monthKey(shiftMonth(current, -1))}${keepMode}`,
    nextHref: `/calendar?month=${monthKey(shiftMonth(current, 1))}${keepMode}`,
    todayHref: `/calendar?month=${monthKey(today)}${keepMode}`,
    isCurrentMonth: key === monthKey(today),
    modes: [
      { key: 'playground', label: 'Playground Calendar', href: `/calendar?month=${key}` },
      { key: 'mine', label: 'My Calendar', href: `/calendar?month=${key}&mode=mine` },
      { key: 'new', label: 'New', href: `/calendar?month=${key}&mode=new` }
    ]
  };
}

/* --------------------------------------------------------------------- map */

/**
 * Map Human Mapping v1.2.
 *
 * Positions are projected into the SVG frame here rather than in the template,
 * and only from the general areas the repository already coarsened. Online-only
 * offerings carry no marker at all and are reachable through the Online panel,
 * exactly as §5 requires.
 */
/**
 * The drawn frame's coordinate space, shared with the template so the
 * projection and the viewBox can never disagree. They did once: y was projected
 * into 0..100 while the viewBox was 62 tall, and every southern marker fell off
 * the bottom of the picture.
 */
const MAP_VIEW = { width: 100, height: 56, inset: 8 };

function project(items, kind, bounds) {
  const located = items.filter((item) => item.lat !== null && item.lng !== null);
  if (!located.length) return [];

  const { minLat, maxLat, minLng, maxLng } = bounds;
  const spanLat = maxLat - minLat || 1;
  const spanLng = maxLng - minLng || 1;
  const usableW = MAP_VIEW.width - MAP_VIEW.inset * 2;
  const usableH = MAP_VIEW.height - MAP_VIEW.inset * 2;

  return located.map((item) => ({
    ...item,
    marker: kind,
    x: Number((MAP_VIEW.inset + ((item.lng - minLng) / spanLng) * usableW).toFixed(2)),
    // Latitude runs the other way to the y axis.
    y: Number((MAP_VIEW.inset + (1 - (item.lat - minLat) / spanLat) * usableH).toFixed(2))
  }));
}

/** One set of bounds across every kind, so the layers stay in register. */
function boundsOf(groupsOfItems) {
  const located = groupsOfItems.flat().filter((i) => i.lat !== null && i.lng !== null);
  if (!located.length) return { minLat: 0, maxLat: 1, minLng: 0, maxLng: 1 };
  const lats = located.map((i) => i.lat);
  const lngs = located.map((i) => i.lng);
  return {
    minLat: Math.min(...lats) - 0.02,
    maxLat: Math.max(...lats) + 0.02,
    minLng: Math.min(...lngs) - 0.02,
    maxLng: Math.max(...lngs) + 0.02
  };
}

async function loadMap(raw, viewer) {
  discovery.assertAvailable('map');

  const [events, groups, members] = await Promise.all([
    discovery.search('events', raw, viewer, '/map', 'gatherings'),
    discovery.search('groups', raw, viewer, '/map', 'Groups'),
    discovery.search('members', raw, viewer, '/map', 'Members')
  ]);

  const shapedEvents = events.items.map((e) => shapeEvent(e, viewer));
  const shapedGroups = groups.items.map((g) => shapeGroup(g, viewer));
  const shapedMembers = members.items.map((m) => ({
    ...m,
    title: m.playgroundName,
    href: '/connections'
  }));

  // Every layer is projected through the same bounds, or they drift apart.
  const bounds = boundsOf([shapedEvents, shapedGroups, shapedMembers]);
  const all = [
    ...project(shapedEvents, 'E', bounds),
    ...project(shapedGroups, 'G', bounds),
    ...project(shapedMembers, 'M', bounds)
  ];

  const onlineCount = events.onlineCount + groups.onlineCount;

  return {
    query: events.query,
    filters: discovery.describeFilters(events.query, '/map'),
    view: MAP_VIEW,
    markers: all,
    total: all.length,
    onlineCount,
    newCount: all.filter((m) => m.isNew).length,
    failure: events.failure,
    // §7 — the legend is always available, and meaning never rests on colour.
    legend: [
      { symbol: 'E', label: 'A Gathering' },
      { symbol: 'G', label: 'A Group' },
      { symbol: 'M', label: 'A Member who chose to appear' },
      { symbol: 'H', label: 'Hybrid — meets in person and online' },
      { symbol: 'N', label: 'New since your last visit' }
    ],
    areaLabel: 'Halifax and Dartmouth'
  };
}

/* --------------------------------------------------- resources and offers  */

async function loadResources(raw, viewer) {
  discovery.assertAvailable('resources');
  const result = await discovery.search('resources', raw, viewer, '/resources', 'resources');
  return {
    ...result,
    items: result.items.map((item) => ({
      ...item,
      href: `/resources/${item.slug}`,
      aspect: getAspect(item.aspectKey)
    }))
  };
}

async function loadOpportunities(raw, viewer) {
  discovery.assertAvailable('opportunities');
  const result = await discovery.search('opportunities', raw, viewer, '/opportunities', 'opportunities');
  return {
    ...result,
    items: result.items.map((item) => ({
      ...item,
      href: `/opportunities/${item.slug}`,
      aspect: getAspect(item.aspectKey)
    }))
  };
}

module.exports = {
  loadEvents,
  loadEvent,
  loadGroups,
  loadGroup,
  loadConnections,
  loadCalendar,
  loadMap,
  loadResources,
  loadOpportunities,
  aspects: listAspects
};
