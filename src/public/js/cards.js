/**
 * cards.js — reordering, hiding and the Saved indicator.
 *
 * Dashboard Unified v1.2 section 0.6: Members may reorder or hide summary
 * cards. Hidden features stay in navigation, and Restore Default Layout is
 * always available.
 *
 * Everything here upgrades a form that already works. With JavaScript off,
 * Hide and Show are ordinary posts with a redirect; reordering is unavailable,
 * which is a missing convenience rather than a broken journey.
 *
 * Reordering moves real elements with the DOM API. No markup is built from
 * strings anywhere in this file, and there is no innerHTML.
 */

import { prefersStillness } from './motion.js';

const SAVE_URL = '/my-playground/layout';

function showSaved() {
  const saved = document.querySelector('[data-saved]');
  if (!saved) return;
  saved.classList.remove('is-visible');
  // Force a reflow so the ring animation restarts on a repeated save.
  void saved.offsetWidth;
  saved.classList.add('is-visible');
  window.setTimeout(() => saved.classList.remove('is-visible'), 2600);
}

function currentOrder(list) {
  return Array.from(list.querySelectorAll('[data-card]')).map((card) => card.dataset.card);
}

function post(body) {
  const params = new URLSearchParams(body);
  return fetch(SAVE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: params
  }).then((response) => {
    if (!response.ok) throw new Error(String(response.status));
    return response.json();
  });
}

/**
 * The "arriving" motion, reused. When a card is added back or moved, it blooms
 * into place rather than appearing — the same vocabulary as the first load.
 */
function bloom(element) {
  if (prefersStillness()) return;
  element.classList.remove('lif-enter');
  void element.offsetWidth;
  element.style.setProperty('--i', '0');
  element.classList.add('lif-enter');
}

function initReorder(list) {
  let dragged = null;

  list.addEventListener('dragstart', (event) => {
    const card = event.target.closest('[data-card]');
    if (!card) return;
    dragged = card;
    card.classList.add('is-lifted');
    event.dataTransfer.effectAllowed = 'move';
    // Some browsers need data set for the drag to begin at all.
    event.dataTransfer.setData('text/plain', card.dataset.card);
  });

  list.addEventListener('dragover', (event) => {
    if (!dragged) return;
    event.preventDefault();
    const over = event.target.closest('[data-card]');
    if (!over || over === dragged) return;

    list.querySelectorAll('.is-target').forEach((el) => el.classList.remove('is-target'));
    over.classList.add('is-target');

    const box = over.getBoundingClientRect();
    const after = event.clientY - box.top > box.height / 2;
    if (after) over.after(dragged);
    else over.before(dragged);
  });

  list.addEventListener('dragend', () => {
    if (!dragged) return;
    dragged.classList.remove('is-lifted');
    list.querySelectorAll('.is-target').forEach((el) => el.classList.remove('is-target'));
    bloom(dragged);
    dragged = null;

    post({ order: currentOrder(list).join(',') })
      .then(showSaved)
      .catch(() => {
        // The order did not save. Reload so what is on screen matches the
        // record, rather than leaving the Member with a layout that will vanish.
        window.location.reload();
      });
  });

  // Keyboard reordering. Cards are focusable through their own links; this puts
  // the same capability on the card itself so it is not a pointer-only feature.
  list.addEventListener('keydown', (event) => {
    if (!event.altKey) return;
    const card = event.target.closest('[data-card]');
    if (!card) return;

    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      const previous = card.previousElementSibling;
      if (!previous) return;
      event.preventDefault();
      previous.before(card);
    } else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      const next = card.nextElementSibling;
      if (!next) return;
      event.preventDefault();
      next.after(card);
    } else {
      return;
    }

    bloom(card);
    card.focus();
    post({ order: currentOrder(list).join(',') }).then(showSaved).catch(() => window.location.reload());
  });
}

function initHideShow(list) {
  document.addEventListener('submit', (event) => {
    const form = event.target;
    const isHide = form.matches('[data-card-hide]');
    const isShow = form.matches('[data-card-show]');
    if (!isHide && !isShow) return;

    event.preventDefault();

    const data = new FormData(form);
    const key = String(data.get('hideCard') || data.get('showCard') || '');
    if (!key) return;

    post(isHide ? { hideCard: key } : { showCard: key })
      .then(() => {
        // The server is the authority on layout, so re-render from it rather
        // than reconstructing the card list here.
        window.location.assign('/');
      })
      .catch(() => form.submit());

    void list;
  });
}

export function initCards() {
  const list = document.querySelector('[data-cards]');
  if (!list) return;

  list.querySelectorAll('[data-card]').forEach((card) => {
    card.setAttribute('draggable', 'true');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-roledescription', 'Reorderable card. Hold Alt and use the arrow keys to move it.');
  });

  initReorder(list);
  initHideShow(list);
}

export { showSaved };
