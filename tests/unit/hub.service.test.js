'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const repositories = require('../../src/repositories');
const features = require('../../src/config/features');
const hubService = require('../../src/services/hub.service');

function reset() {
  repositories.reset();
  features.reset();
}

const VIEWER = { memberId: 'mem_dev_0001', isMember: true };

test('a hidden card never removes the feature, and Restore Default Layout brings it back', async () => {
  reset();
  await hubService.saveLayout(VIEWER.memberId, { hidden: ['groups'] });

  const withHidden = await hubService.loadHub(VIEWER);
  const groups = withHidden.summaries.find((s) => s.featureKey === 'groups');
  assert.equal(groups.hidden, true, 'the card is marked hidden');
  assert.ok(groups, 'the feature is still present in the model, not deleted');

  await hubService.restoreDefaultLayout(VIEWER.memberId);
  const restored = await hubService.loadHub(VIEWER);
  assert.equal(restored.summaries.find((s) => s.featureKey === 'groups').hidden, false);
  reset();
});

test('an administrator-hidden feature disappears completely', async () => {
  reset();
  features.setState('groups', 'hidden');
  const hub = await hubService.loadHub(VIEWER);
  assert.equal(hub.summaries.find((s) => s.featureKey === 'groups'), undefined);
  reset();
});

test('a coming-soon feature is shown, labelled, and not actionable', async () => {
  reset();
  features.setState('groups', 'coming-soon');
  const hub = await hubService.loadHub(VIEWER);
  const groups = hub.summaries.find((s) => s.featureKey === 'groups');

  assert.equal(groups.status, 'not-yet-available');
  assert.equal(groups.href, null, 'no dead control is left behind');
  assert.deepEqual(groups.lines, [], 'no counts leak from an unopened feature');
  assert.ok(groups.statusReason, 'the Member is told why');
  reset();
});

test('"new since last visit" is a category, never a sort order', async () => {
  reset();
  const order = ['resources', 'events', 'connections', 'groups', 'opportunities', 'organizations', 'commons'];
  await hubService.saveLayout(VIEWER.memberId, { order });

  const hub = await hubService.loadHub(VIEWER);
  const rendered = hub.summaries.map((s) => s.featureKey);

  assert.equal(rendered[0], 'resources', 'the saved order wins');
  const hasNew = hub.summaries.filter((s) => s.hasNew).map((s) => s.featureKey);
  assert.ok(hasNew.length > 0, 'there is newness to be tempted to sort by');
  assert.notEqual(rendered[0], hasNew[0], 'newness did not float a card to the top');

  await hubService.restoreDefaultLayout(VIEWER.memberId);
  reset();
});

test('every count line carries a plain-language label and its own deep link', async () => {
  reset();
  const hub = await hubService.loadHub(VIEWER);
  const ready = hub.summaries.filter((s) => s.status === 'ready');
  assert.ok(ready.length > 0);

  for (const summary of ready) {
    for (const line of summary.lines) {
      assert.ok(line.label && line.label.trim().length > 3, `${summary.featureKey}.${line.key} needs a real label`);
      assert.ok(/[a-z]/i.test(line.label), 'a label is words, not a bare number');
      assert.equal(line.href, `${summary.href}?focus=${encodeURIComponent(line.key)}`);
    }
  }
  reset();
});

test('a Guest sees no member-scoped counts, and no restricted reason leaks detail', async () => {
  reset();
  const guest = await hubService.loadHub({ memberId: 'mem_dev_0001', isMember: false });

  const events = guest.summaries.find((s) => s.featureKey === 'events');
  const keys = events.lines.map((l) => l.key);
  assert.ok(!keys.includes('registered'), 'a Guest is not told what a Member registered for');
  assert.ok(!keys.includes('bookmarked'));

  const restricted = guest.summaries.filter((s) => s.status === 'restricted');
  for (const summary of restricted) {
    assert.deepEqual(summary.lines, [], 'a restricted card exposes no counts');
    assert.ok(!/\d/.test(summary.statusReason), 'a restricted reason contains no numbers to infer from');
  }
  reset();
});

test('scope is a lens, not a permission — it never changes what is returned as permitted', async () => {
  reset();
  const forMe = await hubService.loadHub({ ...VIEWER, scopeOverride: 'for-me' });
  const whole = await hubService.loadHub({ ...VIEWER, scopeOverride: 'whole-playground' });

  assert.deepEqual(
    forMe.summaries.map((s) => s.featureKey),
    whole.summaries.map((s) => s.featureKey),
    'the same features are reachable under both scopes'
  );
  assert.equal(forMe.scope, 'for-me');
  assert.equal(whole.scope, 'whole-playground');
  reset();
});

test('an unknown scope value falls back rather than throwing', async () => {
  reset();
  const hub = await hubService.loadHub({ ...VIEWER, scopeOverride: 'everything-everywhere' });
  assert.ok(hubService.SCOPES.includes(hub.scope));
  reset();
});
