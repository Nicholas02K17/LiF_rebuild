'use strict';

/**
 * The seven LiF Aspects.
 *
 * Colour source of truth: the approved LiF Hub reference palette
 * (https://nicholas02k17.github.io/hub/ — css/theme.css), whose values were
 * pixel-sampled from the Seed of Life logo. Only that palette is used.
 *
 * Member-facing Aspect names come from C/C Brand, Colour and Visual Experience
 * Reference v1.1 §1. The `key` is the stable internal identifier used by the
 * reference palette; renaming the member-facing label must never require a key
 * change (Shared Foundation v1.4 §2).
 *
 * `seat` is the Seed of Life position: 0 = centre circle, 1..6 = the six
 * surrounding circles clockwise from the top. Whole Human Potential holds the
 * centre because it is where every Aspect meets.
 */

const ASPECTS = [
  { key: 'whole-human-potential', code: 'WHP', label: 'Whole Human Potential', seat: 0, hue: 'purple' },
  { key: 'presence-being',        code: 'P/B', label: 'Me',                   seat: 1, hue: 'indigo' },
  { key: 'engagement-communion',  code: 'E/C', label: 'We',                   seat: 2, hue: 'blue'   },
  { key: 'nature-nurture',        code: 'N/N', label: 'Nature',               seat: 3, hue: 'green'  },
  { key: 'community-inclusion',   code: 'C/C', label: 'Us Together',          seat: 4, hue: 'gold'   },
  { key: 'service-offerings',     code: 'S/O', label: 'Life',                 seat: 5, hue: 'orange' },
  { key: 'source-resources',      code: 'S/R', label: 'Flow',                 seat: 6, hue: 'red'    }
];

const BY_KEY = new Map(ASPECTS.map((a) => [a.key, a]));

/** Seed of Life geometry on a 0..200 viewBox, radius 46. Centre + six petals. */
const SEED_RADIUS = 46;
const SEED_CENTRE = { x: 100, y: 100 };

/** Petal centres, clockwise from top, matching `seat` 1..6. */
const SEED_SEATS = [
  { seat: 0, x: 100, y: 100 },
  { seat: 1, x: 100, y: 100 - SEED_RADIUS },
  { seat: 2, x: 100 + SEED_RADIUS * Math.sin(Math.PI / 3), y: 100 - SEED_RADIUS / 2 },
  { seat: 3, x: 100 + SEED_RADIUS * Math.sin(Math.PI / 3), y: 100 + SEED_RADIUS / 2 },
  { seat: 4, x: 100, y: 100 + SEED_RADIUS },
  { seat: 5, x: 100 - SEED_RADIUS * Math.sin(Math.PI / 3), y: 100 + SEED_RADIUS / 2 },
  { seat: 6, x: 100 - SEED_RADIUS * Math.sin(Math.PI / 3), y: 100 - SEED_RADIUS / 2 }
];

function listAspects() {
  return ASPECTS.map((a) => ({ ...a }));
}

function getAspect(key) {
  const found = BY_KEY.get(key);
  return found ? { ...found } : null;
}

/** Aspects arranged by Seed of Life seat, ready for the SVG partial. */
function seedOfLife() {
  return SEED_SEATS.map((s) => {
    const aspect = ASPECTS.find((a) => a.seat === s.seat);
    return { ...s, r: SEED_RADIUS, aspect: { ...aspect } };
  });
}

module.exports = { ASPECTS, SEED_RADIUS, SEED_CENTRE, listAspects, getAspect, seedOfLife };
