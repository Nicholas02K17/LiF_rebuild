# LIF-REVIEW register

Provisional decisions made under the **safe reversible continuation** rule
(AI Run Instructions v2.1 §2.1).

Each entry names the conflicting or absent clause, the temporary choice, the one
place it can be changed, and the decision LiF actually needs to make. **None of
these is approved.** None touches privacy, consent, authentication,
authorization, eligibility, payment, notification recipients, visibility,
safeguarding, accessibility compliance, data relationships or anything
irreversible — those stop for a decision instead, and the ones this build hit
are listed under **Blocked** at the end.

---

## LIF-REVIEW-001 — Pathway progress drawn as the Seed of Life

**Status:** Provisional — presentation only.

**Clauses in play**
- Brand Reference v1.1 §5 — "gentle purposeful movement for transitions,
  confirmations, invitations and orientation," and "when the LiF logo or Aspects
  are represented, use their specific assigned colours."
- Dashboard Unified v1.2 §0.8 — the pathway is "an invitation to arrive, not a
  compliance checklist," components may be completed in any order, and
  incomplete status stays visible "without shame."

**Temporary choice**
Welcome Home Pathway progress is drawn as the Seed of Life. The centre circle is
the Member (their Playground Name initial). Five of the six surrounding circles
are the five pathway components; the sixth is a Welcome Home seal that closes
only when the four core components are complete. Seats were chosen so each
component sits in an Aspect that matches its meaning — I Am Here in *Me*,
Connection, My Way in *We*, the Welcome Home Gathering in *Us Together* — and so
no two adjacent seats share a hue.

**Why this rather than a progress bar**
A bar implies an order and a finish line. The Seed is complete as a shape from
the first visit and simply fills in — which is what "any order, no shame" looks
like when you draw it.

**Exact tweak location**
`src/services/pathway.service.js` — the `COMPONENTS` table's `seat` values, and
`SEAL_SEAT`. Nothing else in the codebase knows the mapping.

**Affected tests**
`tests/unit/pathway.test.js` — *every component occupies a distinct Seed of Life
seat, and none takes the seal*.

**Decision LiF needs to make**
Is the Seed of Life acceptable as a progress representation, given it also
represents the Aspects? If LiF would rather the Seed be reserved for Aspect
representation only, change the seat table and swap the medallion partial.

---

## LIF-REVIEW-002 — Member-facing wording not supplied by an approved source

**Status:** Provisional — wording only.

**Clause in play**
Dashboard Unified v1.2 §13 lists "Dashboard empty/error states — detailed copy
required after layout decision," and §0.1 says approved LiF wording is used
exactly as approved.

**Temporary choice**
Approved wording is used verbatim wherever it exists (Welcome Home; the I Am
Here and What Interests Me automatic responses; the All Interests volume
warning; the pathway component invitations). Everywhere else — section headings
such as *Where you already are* and *Because of what you told us*, empty and
error copy, the orientation line — is drafted to the §0.10 tone table and is
**not approved**.

**Exact tweak location**
`src/content/terminology.en.json`, one key per string. Section headings that are
still literal in `src/views/features/hub/index.ejs` are listed below and should
move into the same file once LiF has settled them.

**Decision LiF needs to make**
Review and approve or replace the drafted strings. No code change is required
to act on the answer.

---

## LIF-REVIEW-003 — Card ordering when the Member has never set one

**Status:** Provisional — default only.

**Clause in play**
Dashboard Unified v1.2 §0.6 says Members may reorder and hide cards and that
Restore Default Layout is always available — but does not say what the default
order *is*.

**Temporary choice**
Gatherings, Connections, Groups, Opportunities, Resources, Organizations,
Commons. It follows §0.5's hierarchy by putting the things a Member is already
part of before the things they might join.

**Exact tweak location**
`dev/seed/hub.dataset.js` (`dashboardPreference.order`) for review, and
`src/services/hub.service.js` (`restoreDefaultLayout`) for the real default. The
host application should own this value once it exists.

**Decision LiF needs to make**
Confirm the default order, and confirm whether it varies by Member state
(for example, whether a Member with no Connections should see that card lower).

---

## LIF-REVIEW-004 — The Stillness control

**Status:** Provisional — added capability.

**Clause in play**
Brand Reference v1.1 §5 requires respecting reduced-motion settings. It does not
ask for a control inside the Playground.

**Temporary choice**
The operating system preference is honoured automatically and always. In
addition, the side panel offers *Stillness — hold the Playground still*, stored
per browser. Either source saying stop means stop.

**Why**
Motion sensitivity is not always a device-level setting, and a Member should not
have to leave the Playground to quiet it.

**Exact tweak location**
`src/public/js/motion.js` and the Movement block in
`src/views/partials/rail.ejs`. Removing both leaves the OS preference working.

**Decision LiF needs to make**
Keep the in-Playground control, and if kept, whether the preference should
follow the Member across devices (it currently does not — it is browser-local,
because saving it needs a real Member preference record).

---

## Blocked — stopped for a LiF or backend decision, not implemented

These hit the **immediate-decision boundary** (§2.1) and are deliberately absent
rather than guessed at.

| # | What is blocked | Why it stopped | What is needed |
| --- | --- | --- | --- |
| B-1 | Guest view of the Hub | §4 lists what a Guest may see; it does not define whether the Hub itself has a Guest form or redirects to sign-in. Guessing would change what an unauthenticated person can see. | A decision on the Guest Hub, or confirmation that `/` requires membership. |
| B-2 | Real authentication and session | No backend repository was supplied. `src/middleware/requestContext.js` refuses to boot in production without a host-supplied viewer resolver rather than shipping a default identity. | Repository access, and the existing session/authorization middleware to bind. |
| B-3 | Authoritative counts and freshness | §0.12 requires a card count and its detail page to use the same record set, and "New since last visit" needs an authoritative freshness source. Both need the real repositories. | The backend contracts for each feature's summary read. |
| B-4 | Aspect theme persistence across devices | Brand Reference v1.1 §4 requires the saved preference to follow the Member across devices. The route and service exist; the store behind them is the dev adapter. | A `MemberIdentity.aspectThemeKey` field on the real record. |
| B-5 | Notifications card | §12.1 lists Notifications as a Dashboard content area with deep links into feature settings. Its triggers, authority and audit are undefined here. | The notification service contract. |
