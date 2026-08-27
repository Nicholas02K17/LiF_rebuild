# LiF Playground — Hub (My Playground)

The EJS presentation layer for the Love is Foundation Playground Hub, built to be
lifted into the authoritative LiF Node.js + Express application.

```bash
npm install
npm start           # http://localhost:3000
npm run check       # prohibited-pattern scan, then the tests
```

---

## What this is, and what it deliberately is not

This is **Dashboard / DB-J-002 territory**: the Hub a Member lands on, built as a
complete vertical slice of presentation — layout, partials, view models,
controllers, routes, styles, browser modules, states and tests.

It is **not** a second server and not a backend. `src/app.js` exports
`mount(existingApp)` precisely so the host application keeps its own startup,
sessions, security headers, authorization and error handling:

```js
// in the authoritative LiF repository
const { mount } = require('./lif-hub/src/app');
const repositories = require('./lif-hub/src/repositories');

repositories.bind({ memberRepository, playgroundRepository }); // your real ones
app.set('lif.resolveViewer', (req) => ({                        // your real session
  memberId: req.session.memberId,
  isMember: Boolean(req.session.memberId),
  preferredLanguage: req.session.language
}));
mount(app);
```

Nothing in `src/` changes when you do that. Controllers, view models and
templates only ever see the two contracts in
`src/repositories/contracts/`.

**The backend repository was not supplied with this package.** That is recorded
as blocker B-2 in [`docs/LIF-REVIEW.md`](docs/LIF-REVIEW.md), along with
everything else that stopped for a decision instead of being invented.

---

## Colour

Every colour comes from one place: `src/public/css/tokens.css`, taken verbatim
from the approved LiF Hub reference palette at
<https://nicholas02k17.github.io/hub/> (`css/theme.css`), whose values were
pixel-sampled from the Seed of Life logo. No other palette is used, and no
colour is invented — tints are derived from these same values.

The seven Aspects carry two names: the internal key from the reference palette,
and the Member-facing name from Brand Reference v1.1 §1. They are held together
in `src/content/aspects.js`, so renaming one never touches the other.

| Aspect | Member-facing | Seed seat |
| --- | --- | --- |
| `whole-human-potential` (WHP) | Whole Human Potential | centre |
| `presence-being` (P/B) | Me | 1 |
| `engagement-communion` (E/C) | We | 2 |
| `nature-nurture` (N/N) | Nature | 3 |
| `community-inclusion` (C/C) | Us Together | 4 |
| `service-offerings` (S/O) | Life | 5 |
| `source-resources` (S/R) | Flow | 6 |

`scan:prohibited` fails the build on any hex code outside `tokens.css`.

---

## Motion

One motif, everywhere: **the Seed of Life**. Every movement in the Playground is
a circle being drawn, blooming from a centre, breathing, or closing into a seal —
and every one of them says one of four things:

| | Says | Where you see it |
| --- | --- | --- |
| **Arriving** | this has come in and is ready | the overture, card and section entrances, the pathway seats drawing themselves |
| **Alive** | this place is inhabited, nothing is wrong | the ambient lattice turning, the medallion breathing, the pointer parallax |
| **Becoming** | your action changed something | the Welcome Home seal closing, the Saved ring, the scope lens |
| **Orienting** | you moved, and here is where you went | card lift, the travelling scope thumb, the top bar's line, cross-page transitions |

Highlights:

- **The overture.** Once per browser session, the Seed germinates across the
  viewport — seven circles drawn in sequence, seven Aspect tints opening behind
  them, *Welcome Home* — then contracts into the brand mark. It leaves on any
  key, any pointer press, any scroll, and has a skip button. Under stillness it
  never appears.
- **The pathway medallion.** Progress is the Seed filling in. Each completed
  component draws its own circle in its own Aspect colour; the sixth circle is a
  seal that closes only when the four core components are done. Every circle is
  also a link into its component.
- **The Aspect wheel.** Theme selection *is* the Seed of Life. Hovering a circle
  previews the theme across the whole interface; choosing it saves. Accents
  only — Aspect, logo and status colours are outside the themed tokens and
  cannot be reached from it.
- **The lens.** Switching For me / Whole Playground opens the next view as a
  circle expanding out of the exact control you pressed, using cross-document
  view transitions where the browser has them.

Durations live in `tokens.css` and multiply by `--motion-scale`, so the whole
system can be slowed, quickened or stilled from one place. Two switches set it —
the OS `prefers-reduced-motion` and the Member's own *Stillness* control — and
either one saying stop means stop. Nothing is animated that a Member is trying to
read or click; ambient loops run at 220–310 seconds under 0.08 opacity.

---

## Reviewing the non-ideal states

Every state is reachable from the browser, so nobody has to read code to review
one. Development only — the flags are ignored in production.

| URL | State |
| --- | --- |
| `/` | Populated |
| `/?state=empty` | A brand-new Member: pathway untouched, every card empty |
| `/?state=loading` | Cards held in their calm progress state |
| `/?state=error` | A summary that failed, with entered work safe and a way back |
| `/?state=dense` | High counts and a long activity list |
| `/?state=restricted` | A card the Member may not open, explained without leaking |
| `/?scope=whole-playground` | The other lens |
| `/there-is-nothing-here` | The 404, which reads identically to a 403 |

---

## Layout

```
src/
  app.js                     mount(app) for the host; createApp() for review only
  server.js                  local review server — the host does not use it
  config/
    index.js                 environment; refuses the dev adapter in production
    features.js              administrator availability: active | coming-soon | hidden
  content/
    aspects.js               the seven Aspects and Seed of Life geometry
    terminology.en.json      every Member-facing string, one key each
  middleware/                layout, request context, error handling
  routes/                    URLs to controllers — no rules, no data access
  controllers/               request context in, view model out
  services/                  the business decisions
  repositories/contracts/    the named interfaces the host binds to
  viewmodels/                exactly what a template is allowed to see
  views/
    layouts/base.ejs         the shared shell
    partials/                seed-mark, ambient, topbar, rail, pathway, cards, states
    features/hub/            the Hub, the prototype destination, the error page
  public/
    css/                     tokens · motion · foundations · components · features/hub
    js/                      one module per behaviour, all progressive enhancement
dev/                         review fixtures — outside src/, unreachable from it
tests/                       unit and integration
scripts/                     the prohibited-pattern scan
docs/LIF-REVIEW.md           provisional decisions and blockers
```

---

## Rules this build holds itself to

Enforced by `npm run check`, not just claimed:

- No `innerHTML`, `outerHTML`, `insertAdjacentHTML` or `document.write`.
- No HTML built from strings in JavaScript — reordering moves real nodes.
- No `require`, service call, data access or authorization decision inside a
  template.
- No fixture reachable from `src/` except through `repositories/index.js`, and
  only under `LIF_DATA_ADAPTER=dev`. Production throws at boot.
- No colour or font outside `tokens.css`.
- No global `window` application state.
- No `TODO` left where a Member-facing surface should be — every destination the
  Hub links to answers with a labelled, reviewable prototype instead.

And held by hand:

- Every essential action works without JavaScript. Hide, show, restore layout,
  minimize the pathway and choose a theme are all real form posts with
  Post/Redirect/Get; the browser modules only upgrade them.
- Permissions are enforced server-side. Hiding a control is never the
  enforcement — `theme selection turned off by an administrator is refused
  server-side` is a test.
- A 404 and a 403 produce identical Member-facing wording, so the existence of a
  private object is never inferable.
- Counts are authorized before they are counted, and every one carries a
  plain-language label rather than standing alone as a number.
