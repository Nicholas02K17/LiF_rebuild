/**
 * scope.js — For me / Whole Playground.
 *
 * Two jobs:
 *   1. keep the travelling thumb under whichever option is pressed;
 *   2. record where the Member pressed, so the next page opens as a lens out of
 *      that exact point rather than replacing the screen.
 *
 * The options are ordinary links to ordinary URLs. Everything here is polish on
 * top of a navigation that already works — including with JavaScript off.
 *
 * Dashboard Unified v1.2 section 0.4: this control must never look like a
 * permission or privacy switch. It is presented as a lens over the same place,
 * which is exactly what it is — neither option changes what the Member is
 * permitted to see.
 */

import { prefersStillness } from './motion.js';

function positionThumb(container) {
  const thumb = container.querySelector('[data-scope-thumb]');
  const active = container.querySelector('[data-scope-option][aria-pressed="true"]');
  if (!thumb || !active) return;

  const parent = thumb.parentElement;
  const parentBox = parent.getBoundingClientRect();
  const activeBox = active.getBoundingClientRect();

  thumb.style.width = `${activeBox.width}px`;
  thumb.style.transform = `translateX(${activeBox.left - parentBox.left - 3}px)`;
}

export function initScope() {
  const container = document.querySelector('[data-scope]');
  if (!container) return;

  positionThumb(container);

  // Fonts land after first paint; reposition once they do rather than guessing.
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => positionThumb(container));
  }

  const observer = new ResizeObserver(() => positionThumb(container));
  observer.observe(container);

  container.querySelectorAll('[data-scope-option]').forEach((option) => {
    option.addEventListener('click', (event) => {
      if (prefersStillness()) return;

      // Percentages, because the next document is a different size.
      const box = option.getBoundingClientRect();
      const x = ((box.left + box.width / 2) / window.innerWidth) * 100;
      const y = ((box.top + box.height / 2) / window.innerHeight) * 100;

      try {
        window.sessionStorage.setItem('lif.lens', `${x.toFixed(1)},${y.toFixed(1)}`);
      } catch {
        /* no storage: the page still navigates, just without the lens */
      }

      // Deliberately not preventing default — the navigation is the point.
      void event;
    });
  });
}
