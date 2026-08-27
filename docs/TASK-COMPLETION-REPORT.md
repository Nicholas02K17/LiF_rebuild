# Task Completion Report — Hub (My Playground)

Prepared to the shape required by AI Run Instructions v2.1 §14 and Build
Instructions v3.4 Step 11.

| | |
| --- | --- |
| **Feature** | Dashboard — My Playground (the Hub) |
| **Journey** | DB-J-002 territory: the Hub a verified Member lands on. Account creation and verification are **not** in this slice — see Blocked. |
| **Architecture** | EJS presentation layer for the existing Node.js/Express application. No second server, no duplicate backend. |
| **Starting point** | Rebuilt from scratch. Only the colour palette was carried over, from the approved LiF Hub reference at <https://nicholas02k17.github.io/hub/>. |

---

## Outcome

A Member arriving at `/` is welcomed by name, sees their Welcome Home Pathway as
a Seed of Life they are filling in, sees what they are already part of with one
direct action each, sees why each suggestion appeared, and then — last, because
welcome precedes administration — sees their summary cards.

They can:

- open any pathway component from the medallion or the panel, in any order;
- minimize and reopen the pathway, and the preference is saved;
- switch between *For me* and *Whole Playground*;
- reorder cards by drag or by Alt+arrow, hide a card, bring it back, and restore
  the default layout;
- colour the whole interface with any of the seven Aspects, with live preview,
  save and reset;
- hold the Playground still;
- minimize the side panel;
- reach every destination the Hub names — each answers with a real page.

Every one of those works without JavaScript. The browser modules only upgrade
forms that already post and links that already navigate.

---

## Changed files

Everything is new; nothing pre-existing was modified.

| Area | Files |
| --- | --- |
| Application | `src/app.js` (exports `mount(app)` for the host), `src/server.js` (local review only) |
| Config | `src/config/index.js`, `src/config/features.js` |
| Content | `src/content/aspects.js`, `src/content/terminology.en.json` |
| Middleware | `layout.js`, `requestContext.js`, `errorHandler.js` |
| Routes | `index.js`, `hub.routes.js`, `placeholder.routes.js` |
| Controllers | `hub.controller.js` |
| Services | `hub.service.js`, `pathway.service.js`, `terminology.service.js` |
| Contracts | `repositories/index.js`, `contracts/member.contract.js`, `contracts/playground.contract.js` |
| View model | `viewmodels/hub.viewModel.js` |
| Views | `layouts/base.ejs`; partials `ambient`, `seed-mark`, `overture`, `topbar`, `rail`, `aspect-wheel`, `pathway`, `pathway-medallion`, `summary-card`, and `states/{loading,empty,restricted,not-yet,error}`; pages `features/hub/{index,prototype,error}.ejs` |
| Styles | `public/css/{tokens,motion,foundations,components}.css`, `public/css/features/hub.css` |
| Browser | `public/js/{hub.page,motion,overture,ambient,scope,aspect-theme,cards,rail,reveal}.js` |
| Review data | `dev/seed/hub.dataset.js`, `dev/adapters/devRepositories.js` — outside `src/`, unreachable from it |
| Checks | `scripts/scan-prohibited-patterns.js`, `tests/unit/*`, `tests/integration/*` |
| Docs | `README.md`, `docs/LIF-REVIEW.md`, this report |

**Shared elements created for reuse by other features:** the terminology
service, the Aspect and Seed of Life module, the feature-availability module,
the layout middleware, the state partials, the entire token and motion system,
and the two repository contracts.

---

## Requirement evidence

| Requirement | Where | Evidence |
| --- | --- | --- |
| Welcome and purpose precede administration and statistics (Dashboard §0.4, §0.5) | `views/features/hub/index.ejs` | Test: *the Hub renders and leads with welcome, not with counts* — asserts document order |
| Cards are invitations and doorways, not KPI tiles (§0.6) | `partials/summary-card.ejs` | Test: *every count line carries a plain-language label and its own deep link* |
| Card opens all sections; a line opens that category (§0.6) | `hub.service.js` `decorateSummary` | Test above, plus *a card count deep-links into the same page focused on that category* |
| New since last visit is a category, never a sort (§0.6) | `hub.service.js` `orderSummaries` | Test: *"new since last visit" is a category, never a sort order* |
| Hidden cards keep the feature in navigation; Restore Default always available (§0.6, Shared §7) | `viewmodels/hub.viewModel.js` `navigationFor` | Test: *a hidden card never removes the feature…* |
| Pathway: any order, no shame, only I Am Here gates participation (§0.8, §6) | `services/pathway.service.js` | Tests: *components may be completed in any order*, *only I Am Here gates participation* |
| Optional tour never blocks completion, lives in Resources (§11, §19.7) | `pathway.service.js`, `routes/placeholder.routes.js` | Test: *the optional tour never blocks pathway completion* |
| Every state says what happened, what is safe, what next (§0.11) | `partials/states/*` | Test: *every non-ideal state renders with a next action and without alarm* |
| Administrator availability without a code change; no dead ends (§19.6) | `config/features.js` | Tests: *an administrator-hidden feature disappears completely*, *a coming-soon feature is shown, labelled, and not actionable* |
| Permissions enforced server-side, not by hiding controls (Run §5.4) | `hub.controller.js` | Test: *theme selection turned off by an administrator is refused server-side* |
| Private existence never inferable (Shared §5) | `middleware/errorHandler.js`, dev adapter | Tests: *a 404 and a 403 read identically*, *a Guest sees no member-scoped counts* |
| Centralized terminology keys, never hard-coded text (§19.2) | `services/terminology.service.js` | Test: *no template leaks an unresolved terminology key* |
| Central colour and font tokens only (Brand §4) | `public/css/tokens.css` | `scan:prohibited` fails on any hex outside that file |
| Aspect themes: preview, save, reset; never touch logo, Aspect or status colours (Brand §4) | `tokens.css` `[data-aspect-theme]`, `aspect-theme.js` | Verified in-browser: accent, nav and rail re-tint; pathway markers, logo and status colours unchanged |
| Gentle purposeful motion; reduced motion respected (Brand §5) | `public/css/motion.css`, `public/js/motion.js` | Every duration multiplies by `--motion-scale`; OS preference and the Member's Stillness control both collapse it |
| Scope is not a permission control (§0.4) | `partials`, `hub.service.js` | Test: *scope is a lens, not a permission* |

---

## Backend and data

Nothing was connected, because nothing was supplied. Instead of inventing a
backend, the slice defines the boundary it needs and refuses to boot without one
in production:

- `src/repositories/contracts/` declares two named interfaces with their
  authoritative entities, stable IDs and permission rules.
- `src/repositories/index.js` validates any bound implementation against those
  contracts and throws if a method is missing.
- `src/config/index.js` throws at boot if `LIF_DATA_ADAPTER=dev` is seen with
  `NODE_ENV=production`.
- `src/middleware/requestContext.js` throws in production unless the host binds
  `lif.resolveViewer`, so no default identity can ever ship.
- The dev adapter still filters by viewer *before* counting, so the presentation
  layer was never written against data a real viewer would not receive.

Test-data cleanup: every fixture record carries `datasetId: 'lif-dev-hub'`, and
the fixtures live outside `src/` entirely — a production bundle of `src/` cannot
reach them. There is nothing to clean up from a real database because nothing
was written to one.

---

## Testing

```
npm run check
```

- `scan-prohibited-patterns.js` — 52 files, **clean**. Verified non-vacuous: a
  deliberately planted file with `innerHTML`, an HTML string, a hard-coded hex
  and `window.app =` produced four findings; removing it returned to clean.
- `node --test` — **25 tests, 25 passing**, 11 integration and 14 unit.

Manual, in Chrome via the DevTools protocol:

- Overture captured frame by frame and re-tuned after the first pass ended with
  solid discs covering the lattice.
- The Aspect wheel driven end to end: the theme saved server-side, the page
  reloaded, the caption and pressed state came from the record, and the pathway
  markers, logo and status colours were confirmed unchanged.
- Layout measured at 430px: `scrollWidth` equals the viewport, no overflow.
- Desktop 1440, tablet and mobile 430 reviewed for every state.

---

## Two defects the checks caught, and their fixes

1. **Dead links.** *Every rendered destination answers with a real page* failed
   on `/resources/explore-the-playground`, then on
   `/gatherings/morning-circle-by-the-water`. The Hub was pointing at records
   that did not answer. Fixed by giving every destination a labelled prototype
   route — a Member following an invitation from their Hub must never land on a
   404 that reads as though something was taken from them.

2. **A theme cache outliving its record.** After a server restart the browser
   still painted the saved Aspect while the server rendered the standard theme —
   the accent and the pressed state disagreed. Fixed in `aspect-theme.js`: the
   record is reconciled against the cache on every load, and the server wins.

---

## Provisional decisions

Four, all recorded in [`docs/LIF-REVIEW.md`](LIF-REVIEW.md) with their exact
tweak locations. None is approved, and none touches privacy, consent,
permissions, payments, recipients, visibility, data integrity or anything
irreversible.

- **LIF-REVIEW-001** — pathway progress drawn as the Seed of Life.
- **LIF-REVIEW-002** — Member-facing wording not supplied by an approved source.
- **LIF-REVIEW-003** — the default card order.
- **LIF-REVIEW-004** — the in-Playground Stillness control.

---

## Blocked

Stopped for a decision rather than guessed. Full detail in `LIF-REVIEW.md`.

| # | Blocked | Needs |
| --- | --- | --- |
| B-1 | Guest view of the Hub | A decision on whether `/` has a Guest form or requires membership |
| B-2 | Real authentication, session and identity | The backend repository, which was not in this package |
| B-3 | Authoritative counts and "new since last visit" freshness | The per-feature summary contracts |
| B-4 | Aspect theme following the Member across devices | A field on the real Member record |
| B-5 | The Notifications card | The notification service contract |

Also out of scope by design, each owned by its own specification and Journey ID:
the Gatherings, Groups, Connections, Calendar, Map, Resources, Opportunities,
Organizations and Commons pages, and the five pathway component forms. Each has
a labelled `PROTOTYPE — REQUIRES LiF APPROVAL` destination that states which
document owns it.

---

## Deployment

- **Feature flags:** `src/config/features.js`. Organizations and Commons ship as
  `coming-soon`; everything else `active`. `hidden` removes a feature from
  navigation, cards and routes together.
- **Release:** the host application binds two repositories and a viewer
  resolver, then calls `mount(app)`. No file in `src/` changes.
- **Rollback:** do not call `mount(app)`. Nothing outside this directory is
  touched, and no migration exists to reverse.
- **Monitoring:** server-side failures are logged with path and stack and never
  reach the Member; the Member sees the §0.10 error wording with their work
  intact and a way back.

---

## Approvals still required

Per §13, none of these has been given:

1. **Technical review** — architecture and code.
2. **Backend and data review (Ayan)** — the two repository contracts, the
   viewer-resolver seam, and the permission rules asserted in the tests.
3. **LiF experience review** — the Welcome Home hierarchy, the Seed of Life
   pathway representation (LIF-REVIEW-001), all drafted wording
   (LIF-REVIEW-002), and the motion system.
