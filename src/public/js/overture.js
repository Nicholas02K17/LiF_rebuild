/**
 * overture.js — the Seed of Life germination, once per browser session.
 *
 * The markup is rendered hidden and revealed here, so a Member without
 * JavaScript never meets a curtain they cannot lift. It leaves on its own, and
 * it leaves early on any key, any pointer press, any scroll, or the skip
 * button. Under stillness it never appears at all.
 *
 * Dashboard Unified v1.2 section 0.13: animation supports orientation and never
 * blocks action.
 */

import { prefersStillness } from './motion.js';

const SESSION_KEY = 'lif.overture.seen';
/* Long enough that the finished Seed is held for a beat rather than snatched
   away, short enough that nobody is made to wait for it. It also leaves on any
   key, any pointer press and any scroll, so it is never a gate. */
const HOLD_MS = 3400;

function alreadySeen() {
  try {
    return window.sessionStorage.getItem(SESSION_KEY) === '1';
  } catch {
    // No session storage: show it once for this page load rather than never.
    return false;
  }
}

function markSeen() {
  try {
    window.sessionStorage.setItem(SESSION_KEY, '1');
  } catch {
    /* nothing to do */
  }
}

export function initOverture() {
  const overture = document.querySelector('[data-overture]');
  if (!overture) return;

  if (prefersStillness() || alreadySeen()) {
    overture.remove();
    return;
  }

  markSeen();
  overture.hidden = false;

  // The page underneath must not scroll while the overture is up, but the
  // scrollbar must not disappear either or the layout shifts on dismissal.
  const previousOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';

  let closed = false;
  let holdTimer = 0;

  function close() {
    if (closed) return;
    closed = true;
    window.clearTimeout(holdTimer);

    overture.classList.add('is-closing');
    document.body.style.overflow = previousOverflow;

    const finish = () => {
      overture.remove();
      // Send focus somewhere deliberate rather than losing it with the node.
      const stage = document.getElementById('stage');
      if (stage) stage.focus({ preventScroll: true });
    };

    overture.addEventListener('animationend', finish, { once: true });
    // Belt and braces: if the animation is suppressed, still clean up.
    window.setTimeout(finish, 1400);
  }

  holdTimer = window.setTimeout(close, HOLD_MS);

  const skip = overture.querySelector('[data-overture-skip]');
  if (skip) skip.addEventListener('click', close);

  overture.addEventListener('pointerdown', close);
  window.addEventListener('keydown', close, { once: true });
  window.addEventListener('wheel', close, { once: true, passive: true });
  window.addEventListener('touchmove', close, { once: true, passive: true });
}
