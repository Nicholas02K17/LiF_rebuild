/**
 * aspect-theme.js — the Aspect wheel.
 *
 * Brand Reference v1.1 section 4 asks for preview, save and reset, and for the
 * saved preference to follow the Member across devices.
 *
 *   PREVIEW  hovering a circle, or focusing a choice, re-tints the interface
 *            immediately with no commitment. Leaving restores what was saved.
 *   SAVE     choosing posts to the server, which is the authority. The local
 *            copy exists only to prevent a flash of the standard theme on the
 *            next page — it is a cache, never the record.
 *   RESET    returns to the standard LiF theme without deleting anything else.
 *
 * The theme reaches accents only. Aspect colours, the logo and functional
 * status colours are defined outside the themed tokens and cannot be reached
 * from here.
 *
 * The form already works without any of this: the circles are decorative and
 * the buttons are ordinary submits.
 */

const STORAGE_KEY = 'lif.aspectTheme';
const root = document.documentElement;

function cache(aspectKey) {
  try {
    if (aspectKey) window.localStorage.setItem(STORAGE_KEY, aspectKey);
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* storage unavailable — the server preference still applies on reload */
  }
}

function applyTheme(aspectKey) {
  if (aspectKey) root.setAttribute('data-aspect-theme', aspectKey);
  else root.removeAttribute('data-aspect-theme');
}

export function initAspectWheel() {
  const wheel = document.querySelector('[data-aspect-wheel]');
  if (!wheel) return;

  const saved = wheel.dataset.chosen || null;
  const caption = wheel.querySelector('[data-aspect-caption]');
  const savedCaption = caption ? caption.textContent : '';

  /**
   * Reconcile the cache against the record, every load.
   *
   * The value in local storage exists only so the chosen theme is painted
   * before first paint instead of flashing the standard one. It is a cache, and
   * a cache can go stale — a reset from another device, an administrator
   * turning theme selection off, a cleared account. When it disagrees with what
   * the server just rendered, the server wins and the cache is corrected, so a
   * Member is never left looking at a theme their saved preference no longer
   * says they chose.
   */
  applyTheme(saved);
  cache(saved);

  function preview(aspectKey, label) {
    applyTheme(aspectKey);
    if (caption && label) caption.textContent = `${label} — choose to keep it.`;
  }

  function restore() {
    applyTheme(saved);
    if (caption) caption.textContent = savedCaption;
  }

  function choose(aspectKey) {
    // The visible change happens now; the server call confirms it.
    applyTheme(aspectKey);
    cache(aspectKey);

    const body = new URLSearchParams();
    body.set('aspectKey', aspectKey || '');

    fetch(wheel.getAttribute('action'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body
    })
      .then((response) => {
        if (!response.ok) throw new Error(String(response.status));
        return response.json();
      })
      .then(() => {
        // Reload so the server-rendered pressed states and caption are the
        // record, rather than something this module has patched by hand.
        window.location.assign('/');
      })
      .catch(() => {
        // The choice did not save. Put the interface back where the record
        // says it is, and say so — never leave a silent mismatch.
        applyTheme(saved);
        cache(saved);
        if (caption) caption.textContent = 'That choice did not save. Nothing else changed — try again.';
      });
  }

  // The circles: pointer preview and pointer selection. They are presentational
  // in the accessibility tree, so nothing here is the only path to anything.
  wheel.querySelectorAll('.aspect-wheel__seat').forEach((seat) => {
    const aspectKey = seat.dataset.aspectChoice;
    const label = seat.dataset.aspectLabel;

    seat.addEventListener('pointerenter', () => preview(aspectKey, label));
    seat.addEventListener('pointerleave', restore);
    seat.addEventListener('click', () => choose(aspectKey));
  });

  // The buttons: the real control. Focusing one previews it, exactly as
  // hovering a circle does, so both routes feel like the same thing.
  wheel.querySelectorAll('.aspect-wheel__choice').forEach((button) => {
    const aspectKey = button.dataset.aspectChoice || null;
    const label = button.dataset.aspectLabel || 'Standard LiF';

    button.addEventListener('focus', () => preview(aspectKey, label));
    button.addEventListener('pointerenter', () => preview(aspectKey, label));
    button.addEventListener('blur', restore);
    button.addEventListener('pointerleave', restore);

    button.addEventListener('click', (event) => {
      event.preventDefault();
      choose(aspectKey);
    });
  });

  wheel.addEventListener('pointerleave', restore);
}
