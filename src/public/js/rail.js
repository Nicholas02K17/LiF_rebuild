/**
 * rail.js — minimizing the side panel, and the pathway panel toggle.
 *
 * Shared Foundation v1.4 section 7: the sidebar can be minimized or temporarily
 * hidden and always has an obvious recovery control. The toggle button is that
 * control in both directions, and it keeps its accessible name and state.
 */

const RAIL_KEY = 'lif.rail';

function stored() {
  try {
    return window.localStorage.getItem(RAIL_KEY);
  } catch {
    return null;
  }
}

function persist(value) {
  try {
    window.localStorage.setItem(RAIL_KEY, value);
  } catch {
    /* nothing to do */
  }
}

export function initRail() {
  const body = document.querySelector('.shell__body');
  const toggle = document.querySelector('[data-rail-toggle]');
  if (!body || !toggle) return;

  function apply(state) {
    body.dataset.rail = state;
    const open = state === 'open';
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Minimize the side panel' : 'Open the side panel');
    persist(state);
  }

  apply(stored() === 'shut' ? 'shut' : 'open');

  toggle.addEventListener('click', () => {
    apply(body.dataset.rail === 'open' ? 'shut' : 'open');
  });
}

/**
 * The pathway minimize control. It is a real form post, so the preference is
 * saved server-side and survives a new device. Here it is upgraded to toggle in
 * place, then told the server quietly.
 */
export function initPathwayToggle() {
  const panel = document.querySelector('[data-pathway]');
  const form = document.querySelector('[data-pathway-toggle]');
  if (!panel || !form) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const input = form.querySelector('input[name="pathwayMinimized"]');
    const button = form.querySelector('button');
    const willMinimize = input.value === 'true';

    panel.dataset.minimized = String(willMinimize);
    input.value = willMinimize ? 'false' : 'true';
    button.setAttribute('aria-expanded', String(!willMinimize));
    button.textContent = willMinimize ? 'Reopen your Welcome Home Pathway' : 'Minimize pathway';

    fetch(form.getAttribute('action'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body: new URLSearchParams({ pathwayMinimized: String(willMinimize) })
    }).catch(() => {
      // The preference did not save; the panel still behaves as asked for this
      // visit, and the server copy is simply unchanged.
    });
  });
}
