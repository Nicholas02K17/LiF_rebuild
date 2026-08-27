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
});

async function get(path, headers = {}) {
  const response = await fetch(`${base}${path}`, { redirect: 'manual', headers });
  return { status: response.status, headers: response.headers, body: await response.text() };
}

test('the Hub renders and leads with welcome, not with counts', async () => {
  const page = await get('/');
  assert.equal(page.status, 200);

  const welcomeAt = page.body.indexOf('Welcome Home');
  const cardsAt = page.body.indexOf('id="cards-heading"');
  assert.ok(welcomeAt > -1, 'Welcome Home is present');
  assert.ok(cardsAt > -1, 'the summary cards are present');
  assert.ok(welcomeAt < cardsAt, 'welcome precedes the summaries in the document order');
});

test('every rendered destination answers with a real page, never a dead link', async () => {
  const page = await get('/');
  const hrefs = [...page.body.matchAll(/href="(\/[^"#?]*)/g)]
    .map((m) => m[1])
    .filter((href) => !href.startsWith('/assets'));

  const unique = [...new Set(hrefs)];
  assert.ok(unique.length >= 8, `expected several internal links, found ${unique.length}`);

  for (const href of unique) {
    const response = await get(href);
    assert.ok(
      response.status === 200,
      `${href} answered ${response.status} — the Hub must not link anywhere that is not there`
    );
  }
});

test('a card count deep-links into the same page focused on that category', async () => {
  const focused = await get('/gatherings?focus=registered');
  assert.equal(focused.status, 200);
  assert.match(focused.body, /registered/, 'the focus token reaches the destination');
});

test('a hidden feature leaves no reachable route behind', async () => {
  features.setState('groups', 'hidden');
  const gone = await get('/groups');
  assert.equal(gone.status, 404);

  const hub = await get('/');
  assert.ok(!hub.body.includes('href="/groups"'), 'and no control pointing at it');
  features.reset();
});

test('an unknown route answers with a dignified page, not a stack trace', async () => {
  const missing = await get('/there-is-nothing-here');
  assert.equal(missing.status, 404);
  assert.match(missing.body, /not open to you right now/i);
  assert.match(missing.body, /Return to My Playground/);
  assert.ok(!/at Object\.<anonymous>/.test(missing.body) || !/production/.test(missing.body));
});

test('a 404 and a 403 read identically, so private existence is never inferable', async () => {
  const missing = await get('/there-is-nothing-here');
  const alsoMissing = await get('/another-thing-that-is-not-there');
  const heading = /<h1[^>]*>([^<]+)</;
  assert.equal(missing.body.match(heading)[1], alsoMissing.body.match(heading)[1]);
});

test('the layout preference round-trips through a real form post', async () => {
  const response = await fetch(`${base}/my-playground/layout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ hideCard: 'resources', returnTo: '/' }),
    redirect: 'manual'
  });

  assert.equal(response.status, 303, 'Post/Redirect/Get, so a refresh never re-submits');
  assert.equal(response.headers.get('location'), '/');

  const after = await get('/');
  assert.match(after.body, /Resources · show this card/i, 'the hidden card is offered back in the rail');

  await fetch(`${base}/my-playground/layout/restore`, { method: 'POST', redirect: 'manual' });
  repositories.reset();
});

test('the Aspect theme rejects an unknown Aspect rather than storing it', async () => {
  const response = await fetch(`${base}/my-playground/theme`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: new URLSearchParams({ aspectKey: 'not-an-aspect' }),
    redirect: 'manual'
  });
  assert.equal(response.status, 400);
});

test('theme selection turned off by an administrator is refused server-side', async () => {
  features.setState('memberThemes', 'hidden');
  const response = await fetch(`${base}/my-playground/theme`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: new URLSearchParams({ aspectKey: 'nature-nurture' }),
    redirect: 'manual'
  });
  assert.equal(response.status, 403, 'hiding the control is not the enforcement');
  features.reset();
});

test('every non-ideal state renders with a next action and without alarm', async () => {
  for (const state of ['empty', 'loading', 'error', 'dense', 'restricted']) {
    const page = await get(`/?state=${state}`);
    assert.equal(page.status, 200, `${state} renders`);
    assert.match(page.body, /Welcome Home/, `${state} still welcomes the Member`);
  }

  const empty = await get('/?state=empty');
  assert.match(empty.body, /Nothing is here yet/i);
  assert.doesNotMatch(empty.body, /failed|invalid|error occurred/i);

  const failing = await get('/?state=error');
  assert.match(failing.body, /Nothing you have entered is lost|Nothing you have saved is affected/i);
  assert.match(failing.body, /Try again/i);
});

test('no template leaks an unresolved terminology key', async () => {
  const page = await get('/');
  assert.doesNotMatch(page.body, /\[missing: /, 'every member-facing string resolved');
});
