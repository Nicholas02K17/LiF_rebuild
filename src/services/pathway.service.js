'use strict';

const { seedOfLife } = require('../content/aspects');

/**
 * Welcome Home Pathway.
 *
 * Dashboard Unified v1.2 sections 6 and 0.8:
 *  - components may be completed in any order;
 *  - incomplete status stays visible without shame or repeated interruption;
 *  - only I Am Here required fields gate participation actions — everything
 *    else is invited and non-blocking;
 *  - Explore the Playground is optional, never blocks completion, and lives
 *    permanently in the Resources Library.
 *
 * LIF-REVIEW-001 — presentation only.
 * Pathway progress is drawn as the Seed of Life: the centre circle is the
 * Member, and the five components occupy five of the six surrounding seats.
 * Seats are chosen so each component sits in the Aspect that matches its
 * meaning — Connection, My Way in We; the Welcome Home Gathering in Us
 * Together; I Am Here in Me — and so no two adjacent seats share a hue.
 * The sixth seat is the Welcome Home seal, which closes only when the four
 * core components are complete. This is a reversible visual mapping, not a
 * change to what any component requires. The mapping lives in this one table
 * and nowhere else; see docs/LIF-REVIEW.md.
 */

const COMPONENTS = [
  {
    key: 'i-am-here',
    seat: 1,
    title: 'I Am Here',
    invitation: 'Share the unique expression, experience and brilliance you bring.',
    required: true,
    core: true,
    href: '/pathway/i-am-here',
    gatesParticipation: true
  },
  {
    key: 'what-interests-me',
    seat: 3,
    title: 'What Interests Me',
    invitation: 'Choose what you would like to explore, experience and engage with.',
    required: false,
    core: true,
    href: '/pathway/what-interests-me',
    gatesParticipation: false
  },
  {
    key: 'connection-my-way',
    seat: 2,
    title: 'Connection, My Way',
    invitation: 'Choose how you would like to be discovered, contacted and connected.',
    required: false,
    core: true,
    href: '/pathway/connection-my-way',
    gatesParticipation: false
  },
  {
    key: 'welcome-home-gathering',
    seat: 4,
    // Title is personalized with the Playground Name at render time.
    title: '{name}, You are Invited to a Welcome Home Gathering',
    invitation: 'A time to be met, welcomed and introduced to other Members.',
    required: false,
    core: true,
    href: '/pathway/welcome-home-gathering',
    gatesParticipation: false
  },
  {
    key: 'explore-the-playground',
    seat: 5,
    title: 'Explore the Playground',
    invitation: 'Take the tour now, skip it, or return to it anytime in Resources.',
    required: false,
    core: false,
    optionalLabel: 'Optional',
    href: '/resources/explore-the-playground',
    gatesParticipation: false
  }
];

/** The sixth seat is not a component. It closes when the four core steps are done. */
const SEAL_SEAT = 6;

const SEED_SEATS = seedOfLife();

function seatGeometry(seat) {
  return SEED_SEATS.find((s) => s.seat === seat);
}

/**
 * @param {Array<{key: string, complete: boolean}>} status
 * @param {{ playgroundName: string }} identity
 */
function build(status, identity) {
  const byKey = new Map((status || []).map((s) => [s.key, s]));

  const components = COMPONENTS.map((component) => {
    const state = byKey.get(component.key) || { complete: false, completedAt: null };
    const geometry = seatGeometry(component.seat);
    return {
      ...component,
      title: component.title.replace('{name}', identity.playgroundName),
      complete: Boolean(state.complete),
      completedAt: state.completedAt || null,
      geometry
    };
  });

  const core = components.filter((c) => c.core);
  const completedCore = core.filter((c) => c.complete).length;
  const allCoreComplete = completedCore === core.length;

  const gate = components.find((c) => c.gatesParticipation);
  const participationOpen = Boolean(gate && gate.complete);

  return {
    components,
    seal: {
      seat: SEAL_SEAT,
      geometry: seatGeometry(SEAL_SEAT),
      closed: allCoreComplete
    },
    centre: seatGeometry(0),
    completedCore,
    totalCore: core.length,
    // 0..1 including the seal, so the Seed of Life fills evenly as it is drawn.
    progress: allCoreComplete ? 1 : completedCore / (core.length + 1),
    allCoreComplete,
    participationOpen,
    /**
     * Shown only when a participation action was actually interrupted, so the
     * gate never reads as a nag on an ordinary visit (section 0.8).
     */
    gateComponentKey: gate ? gate.key : null
  };
}

module.exports = { COMPONENTS, SEAL_SEAT, build };
