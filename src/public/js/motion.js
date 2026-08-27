/**
 * motion.js — one place that answers "is the Playground allowed to move?"
 *
 * Two sources agree here: the operating system's reduced-motion preference and
 * the Member's own Stillness control. Either one saying stop means stop.
 * Nothing else in the browser modules reads either source directly.
 */

const STORAGE_KEY = 'lif.motion';
const root = document.documentElement;

const systemQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

function stored() {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function persist(value) {
  try {
    if (value) window.localStorage.setItem(STORAGE_KEY, value);
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* storage unavailable — the setting simply does not persist */
  }
}

export function prefersStillness() {
  const choice = stored();
  if (choice === 'still') return true;
  if (choice === 'full') return false;
  return systemQuery.matches;
}

export function setStillness(still) {
  const value = still ? 'still' : 'full';
  root.setAttribute('data-motion', value);
  persist(value);
}

/**
 * Wires the Stillness checkbox. The checkbox reflects the effective state, so a
 * Member whose device already asks for reduced motion sees it already on.
 */
export function initMotionControl() {
  const toggle = document.querySelector('[data-motion-toggle]');
  if (!toggle) return;

  toggle.checked = prefersStillness();

  toggle.addEventListener('change', () => {
    setStillness(toggle.checked);
  });

  // If the device preference changes mid-session and the Member has not made
  // their own choice, follow it.
  systemQuery.addEventListener('change', (event) => {
    if (stored()) return;
    toggle.checked = event.matches;
  });
}

/** Run `fn` only when movement is welcome. Returns whether it ran. */
export function whenMoving(fn) {
  if (prefersStillness()) return false;
  fn();
  return true;
}
