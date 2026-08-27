/**
 * hub.page.js — the page-scoped entry point for My Playground.
 *
 * Every module below is progressive enhancement over markup that already
 * works. Nothing here is the only path to an essential action, nothing builds
 * HTML from a string, and there is no global application state
 * (AI Run Instructions v2.1 sections 5.3 and 5.4).
 *
 * Each initialiser is independent and each is guarded, so one failing module
 * can never take the page down with it.
 */

import { initMotionControl } from './motion.js';
import { initOverture } from './overture.js';
import { initAmbient, initTopbarState } from './ambient.js';
import { initScope } from './scope.js';
import { initAspectWheel } from './aspect-theme.js';
import { initCards } from './cards.js';
import { initRail, initPathwayToggle } from './rail.js';
import { initReveal } from './reveal.js';

const MODULES = [
  ['motion control', initMotionControl],
  ['overture', initOverture],
  ['ambient field', initAmbient],
  ['top bar', initTopbarState],
  ['scope switch', initScope],
  ['aspect wheel', initAspectWheel],
  ['summary cards', initCards],
  ['side panel', initRail],
  ['pathway panel', initPathwayToggle],
  ['section reveal', initReveal]
];

function start() {
  for (const [name, init] of MODULES) {
    try {
      init();
    } catch (error) {
      // A broken enhancement must never break the page under it.
      console.warn(`[lif] ${name} enhancement unavailable`, error);
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start, { once: true });
} else {
  start();
}
