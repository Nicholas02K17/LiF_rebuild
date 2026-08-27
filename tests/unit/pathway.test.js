'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const pathway = require('../../src/services/pathway.service');

const IDENTITY = { playgroundName: 'Wren' };

test('components may be completed in any order and none blocks another', () => {
  const outOfOrder = pathway.build(
    [
      { key: 'welcome-home-gathering', complete: true },
      { key: 'connection-my-way', complete: true }
    ],
    IDENTITY
  );

  assert.equal(outOfOrder.completedCore, 2);
  assert.equal(outOfOrder.allCoreComplete, false);
  // I Am Here is untouched and still offered, not locked behind the others.
  const iAmHere = outOfOrder.components.find((c) => c.key === 'i-am-here');
  assert.equal(iAmHere.complete, false);
  assert.equal(iAmHere.href, '/pathway/i-am-here');
});

test('only I Am Here gates participation', () => {
  const gated = pathway.build([{ key: 'what-interests-me', complete: true }], IDENTITY);
  assert.equal(gated.participationOpen, false);

  const open = pathway.build([{ key: 'i-am-here', complete: true }], IDENTITY);
  assert.equal(open.participationOpen, true);

  const gatesFlags = pathway.COMPONENTS.filter((c) => c.gatesParticipation).map((c) => c.key);
  assert.deepEqual(gatesFlags, ['i-am-here'], 'exactly one component may gate participation');
});

test('the optional tour never blocks pathway completion', () => {
  const allCoreDone = pathway.build(
    [
      { key: 'i-am-here', complete: true },
      { key: 'what-interests-me', complete: true },
      { key: 'connection-my-way', complete: true },
      { key: 'welcome-home-gathering', complete: true }
      // explore-the-playground deliberately left incomplete
    ],
    IDENTITY
  );

  assert.equal(allCoreDone.allCoreComplete, true, 'the tour is not a core component');
  assert.equal(allCoreDone.seal.closed, true);

  const tour = allCoreDone.components.find((c) => c.key === 'explore-the-playground');
  assert.equal(tour.core, false);
  assert.equal(tour.complete, false);
});

test('the Welcome Home Gathering card is personalized with the Playground Name', () => {
  const built = pathway.build([], { playgroundName: 'Ama' });
  const card = built.components.find((c) => c.key === 'welcome-home-gathering');
  assert.match(card.title, /^Ama, You are Invited to a Welcome Home Gathering$/);
  assert.doesNotMatch(card.title, /\{name\}/);
});

test('every component occupies a distinct Seed of Life seat, and none takes the seal', () => {
  const seats = pathway.COMPONENTS.map((c) => c.seat);
  assert.equal(new Set(seats).size, seats.length, 'no two components share a seat');
  assert.ok(!seats.includes(0), 'the centre belongs to the Member');
  assert.ok(!seats.includes(pathway.SEAL_SEAT), 'the seal seat is not a component');
});

test('an unknown or absent status never throws and never claims completion', () => {
  const built = pathway.build(undefined, IDENTITY);
  assert.equal(built.completedCore, 0);
  assert.equal(built.allCoreComplete, false);
  assert.equal(built.participationOpen, false);
  assert.equal(built.components.length, pathway.COMPONENTS.length);
});
