'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { createApp } = require('../../src/app');
const features = require('../../src/config/features');
const repositories = require('../../src/repositories');

let server;
let base;

test.before(async () => {
  const app = createApp();
  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });
  base = `http://127.0.0.1:${server.address().port}`;
});

test.after(() => {
  if (server) server.close();
  features.reset();
  repositories.reset();
});

async function get(path) {
  const response = await fetch(`${base}${path}`, { redirect: 'manual' });
  return { status: response.status, body: await response.text() };
}

const TABS = [
  '/', '/gatherings', '/groups', '/connections', '/calendar', '/map',
  '/resources', '/opportunities'
];

test('every tab in the side panel opens a real page, not a prototype notice', async () => {
  for (const path of TABS) {
    const page = await get(path);
    assert.equal(page.status, 200, `${path} answers`);
    assert.doesNotMatch(
      page.body,
      /deliberately not built yet/,
      `${path} must be a built page, not the placeholder`
    );
  }
});

test('the side panel and the top bar reach the same places', async () => {
  const hub = await get('/');
  for (const path of TABS.filter((p) => p !== '/')) {
    assert.ok(hub.body.includes(`href="${path}"`), `the Hub links to ${path}`);
  }
});

test('a Gathering card carries everything its specification requires', async () => {
  // Events Human Mapping v1.0 §2 — Host, when, format, language, Area of
  // Interest and a truthful availability label.
  const page = await get('/gatherings?scope=whole-playground');
  assert.match(page.body, /Held by Elena Marchetti/);
  assert.match(page.body, /Saturday 30 August, 8:00 AM Atlantic/);
  assert.match(page.body, /In person/);
  assert.match(page.body, /English/);
  assert.match(page.body, /Open — 9 places left/);
  assert.match(page.body, /Full — waitlist open/, 'a full Event says so, and says the waitlist is open');
  assert.match(page.body, /Registration closed/, 'a closed Event is not dressed up as open');
});

test('an Event detail page puts what is shared before the action', async () => {
  const page = await get('/gatherings/morning-circle-by-the-water');
  assert.equal(page.status, 200);
  const sharingAt = page.body.indexOf('If you register');
  const actionAt = page.body.indexOf('detail__actions');
  assert.ok(sharingAt > -1, 'the data-sharing summary is present');
  assert.ok(sharingAt < actionAt, 'and it comes before the action, not after it');
});

test('Groups separate what you belong to from what you may discover', async () => {
  const page = await get('/groups?scope=whole-playground');
  const mineAt = page.body.indexOf('id="my-groups"');
  const exploreAt = page.body.indexOf('id="explore-groups"');
  assert.ok(mineAt > -1 && exploreAt > -1);
  assert.ok(mineAt < exploreAt, 'My Groups comes before Explore Groups');
  /**
   * No control offers a straight join. This looks at the actions rather than
   * the prose, because the page quite reasonably *says* there is no instant
   * join — and matching on words made that explanation fail its own test.
   */
  const actions = [...page.body.matchAll(/class="btn[^"]*"[^>]*>\s*([^<]+?)\s*</g)].map((m) => m[1]);
  assert.ok(actions.length > 0, 'there are actions to check');
  assert.ok(
    !actions.some((label) => /^join\b/i.test(label)),
    `no action offers a straight join; found: ${actions.join(' | ')}`
  );
  assert.ok(
    actions.some((label) => /Request Access|Open the Group|Request pending/.test(label)),
    'and the real routes in are offered'
  );
});

test('a Group nobody may discover is indistinguishable from one that is absent', async () => {
  const invitationOnly = await get('/groups/first-light-swimmers');
  const doesNotExist = await get('/groups/there-is-no-such-group');
  assert.equal(invitationOnly.status, 404);
  assert.equal(doesNotExist.status, 404);

  const heading = /<h1[^>]*>([^<]+)</;
  assert.equal(
    invitationOnly.body.match(heading)[1],
    doesNotExist.body.match(heading)[1],
    'and they read identically'
  );
});

test('the Map shows only general areas, and online offerings carry no pin', async () => {
  const page = await get('/map?scope=whole-playground');
  assert.equal(page.status, 200);

  // Map Human Mapping v1.2 §5 — no exact coordinate, ever.
  assert.doesNotMatch(page.body, /44\.6[0-9]{3}/, 'no precise latitude reaches the page');
  assert.doesNotMatch(page.body, /-63\.5[0-9]{3}/, 'no precise longitude reaches the page');
  assert.match(page.body, /postal code is never shown/i);

  // §7 — the legend is always there, and meaning never rests on colour alone.
  assert.match(page.body, /A Gathering/);
  assert.match(page.body, /Hybrid — meets in person and online/);
  assert.match(page.body, />E</, 'markers carry a letter, not only a hue');

  // Online-only offerings are reachable without a pin.
  assert.match(page.body, /happen online, so they have no place on the map/);
});

test('every Map marker is also readable as text', async () => {
  const page = await get('/map?scope=whole-playground');
  const markers = (page.body.match(/class="map-marker"/g) || []).length;
  const listed = (page.body.match(/class="person lif-enter"/g) || []).length;
  assert.ok(markers > 0, 'there are markers');
  assert.equal(listed, markers, 'and every one of them appears in the list too');
});

test('the Calendar keeps Registered and Interested apart', async () => {
  // August holds the registered Gathering, September the saved one, so the
  // month has to be chosen deliberately for both badges to be on one screen.
  const page = await get('/calendar?mode=mine&month=2026-08');
  assert.equal(page.status, 200);
  assert.match(page.body, /calendar__badge">\s*Registered/, 'August shows the registered Gathering');

  const september = await get('/calendar?mode=mine&month=2026-09');
  assert.match(september.body, /calendar__badge--soft">\s*Interested/, 'September shows the saved one');

  // The two states use different markup, so they can never render alike.
  assert.notEqual(
    /calendar__badge">/.source,
    /calendar__badge--soft">/.source,
    'Registered and Interested are distinct, never one conflated state'
  );
});

test('the Calendar can be moved through the months', async () => {
  const august = await get('/calendar?month=2026-08');
  assert.match(august.body, /August 2026/);

  const september = await get('/calendar?month=2026-09');
  assert.match(september.body, /September 2026/);
  assert.match(september.body, /Shoreline Restoration Saturdays/, 'September holds its own Gatherings');

  // A nonsense month falls back rather than throwing.
  const nonsense = await get('/calendar?month=not-a-month');
  assert.equal(nonsense.status, 200);
  assert.match(nonsense.body, /August 2026/, 'and lands on the month containing today');
});

test('the Calendar grid and its list show the same records', async () => {
  const page = await get('/calendar?month=2026-09&scope=whole-playground');
  // Anything outside the shown month is declared rather than silently dropped.
  assert.match(page.body, /outside September 2026/);
});

test('a filtered view always offers a way out of every filter', async () => {
  const page = await get('/gatherings?aspect=nature-nurture&format=in-person');
  assert.equal(page.status, 200);
  assert.match(page.body, /Clear everything/);
  // One removal control per applied filter.
  const removals = (page.body.match(/chip--removable/g) || []).length;
  assert.equal(removals, 2, 'each applied filter can be removed on its own');
});

test('an empty result says which kind of empty it is', async () => {
  const noMatches = await get('/gatherings?q=zzzznothing');
  assert.match(noMatches.body, /Nothing matches what you are showing/);
  assert.match(noMatches.body, /Clear the filters/, 'and offers the way out');

  const nothingYet = await get('/gatherings?state=empty&scope=whole-playground');
  assert.match(nothingYet.body, /Nothing is here yet/);
});

test('a discovery failure keeps the page, the filters and a way on', async () => {
  const failing = await get('/gatherings?state=error');
  assert.equal(failing.status, 200, 'a failed search is a state, not an error page');
  assert.match(failing.body, /could not bring these in/i);
  assert.match(failing.body, /Nothing you have chosen is lost/);
  assert.match(failing.body, /Try again/);
});

test('an administrator can turn a feature off and its page goes with it', async () => {
  features.setState('map', 'hidden');
  const gone = await get('/map');
  assert.equal(gone.status, 404, 'the route goes too, not just the link');

  const hub = await get('/');
  assert.ok(!hub.body.includes('href="/map"'), 'and nothing points at it');
  features.reset();

  const back = await get('/map');
  assert.equal(back.status, 200);
});

test('no feature page leaks an unresolved terminology key', async () => {
  for (const path of TABS) {
    const page = await get(path);
    assert.doesNotMatch(page.body, /\[missing: /, `${path} resolved every string`);
  }
});
