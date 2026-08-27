/**
 * ambient.js — the living background.
 *
 * Two effects, both tiny:
 *   1. the Seed lattices lean a few pixels toward the pointer, which reads as
 *      depth rather than as movement;
 *   2. the whole field settles further back as the page scrolls, so the
 *      content always sits in front of something quieter.
 *
 * Both are pure CSS custom property writes on one element, batched into a
 * single animation frame. Nothing here builds markup or touches layout.
 */

import { prefersStillness } from './motion.js';

const MAX_LEAN_PX = 14;

export function initAmbient() {
  const field = document.querySelector('[data-parallax]');
  if (!field || prefersStillness()) return;

  // A coarse pointer has no hover to follow, so the lean is pointless there.
  const fine = window.matchMedia('(pointer: fine)').matches;

  let queued = false;
  let leanX = 0;
  let leanY = 0;

  function apply() {
    queued = false;
    field.style.setProperty('--parallax-x', leanX.toFixed(2));
    field.style.setProperty('--parallax-y', leanY.toFixed(2));
  }

  function request() {
    if (queued) return;
    queued = true;
    window.requestAnimationFrame(apply);
  }

  if (fine) {
    window.addEventListener(
      'pointermove',
      (event) => {
        const nx = event.clientX / window.innerWidth - 0.5;
        const ny = event.clientY / window.innerHeight - 0.5;
        leanX = nx * MAX_LEAN_PX * 2;
        leanY = ny * MAX_LEAN_PX * 2;
        request();
      },
      { passive: true }
    );
  }

  // Scroll depth. Capped so a long page never fades the field away entirely.
  let scrollQueued = false;
  window.addEventListener(
    'scroll',
    () => {
      if (scrollQueued) return;
      scrollQueued = true;
      window.requestAnimationFrame(() => {
        scrollQueued = false;
        const depth = Math.min(window.scrollY / 900, 1);
        field.style.opacity = String(1 - depth * 0.45);
      });
    },
    { passive: true }
  );
}

/**
 * The top bar only draws its dividing line once the Member has actually left
 * the top of the page — a small orientation cue, not decoration.
 */
export function initTopbarState() {
  const topbar = document.querySelector('[data-topbar]');
  if (!topbar) return;

  const sentinel = document.createElement('div');
  sentinel.setAttribute('aria-hidden', 'true');
  sentinel.style.position = 'absolute';
  sentinel.style.top = '0';
  sentinel.style.height = '1px';
  sentinel.style.width = '1px';
  document.body.prepend(sentinel);

  const observer = new IntersectionObserver(
    ([entry]) => {
      topbar.dataset.scrolled = String(!entry.isIntersecting);
    },
    { threshold: 0 }
  );

  observer.observe(sentinel);
}
