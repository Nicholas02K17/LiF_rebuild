/**
 * reveal.js — sections arrive as you reach them.
 *
 * The entrance animation on first paint covers what is already on screen. This
 * carries the same vocabulary down the page: a section blooms once, as it comes
 * into view, and then it is done. Nothing re-animates on the way back up, and
 * nothing animates while the Member is trying to read it — the threshold is
 * deliberately low so the movement finishes before the content is central.
 */

import { prefersStillness } from './motion.js';

export function initReveal() {
  if (prefersStillness()) return;
  if (!('IntersectionObserver' in window)) return;

  // Anything already in the first viewport keeps its scripted entrance.
  const candidates = Array.from(document.querySelectorAll('.stage > section'));

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const section = entry.target;
        observer.unobserve(section);

        section.querySelectorAll('.lif-enter').forEach((element, index) => {
          element.style.setProperty('--i', String(Math.min(index, 8)));
          element.classList.remove('lif-enter');
          void element.offsetWidth;
          element.classList.add('lif-enter');
        });
      });
    },
    { rootMargin: '0px 0px -12% 0px', threshold: 0.05 }
  );

  candidates.forEach((section) => {
    const box = section.getBoundingClientRect();
    if (box.top < window.innerHeight) return; // already visible; leave it alone
    observer.observe(section);
  });
}
