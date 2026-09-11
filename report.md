# Refactor Audit Report

_Date: 2026-07-18 · Baseline: commits 697c99d + 67a7930 · Spec: ARCHITECTURE.md_

This report is the task list for the refactor. Every item below was found by
auditing the codebase against ARCHITECTURE.md. Delete this file when the
refactor is complete (Phase F).

## Context

The previous session's refactor (modules/ → actions/components/schema) fixed
the build-time DB failure but introduced a new class of problems: "use server"
was added to every backend file so barrel exports would work, which turned
internal helper modules into publicly callable endpoints. Trust was further
eroded by 5 concurrent agents producing two giant commits with no human review.

## ✅ Verified clean

- Zero client components calling actions during render (`use(action())`)
- Zero `@/modules/` references
- DB client imports outside `actions/`+`lib/`: exactly one (`app/sitemap.ts`)

## 🔴 P0 — Security: unguarded public endpoints

Every exported async function in a `"use server"` file is a publicly callable
POST endpoint. **48 of 76** `"use server"` files contain zero guard references.
Spot-verified worst cases:

| File | Exposure |
|---|---|
| `actions/events/withdrawals.ts` | `createEventWithdrawal({ eventId, organizerId, amount, destinationPhone })` — money movement, organizer ID supplied by caller, no guard. Also exports webhook-only helpers (`confirmEventWithdrawalSuccess`, `failEventWithdrawal`) as endpoints. |
| `actions/admin/user-management.ts` | Full user list with emails/stats — no `requireAdmin` |
| `actions/admin/event-management.ts`, `error-log.ts`, `invites.ts`, `platform-stats.ts`, `*-queries.ts` | Admin data/mutations, no guards |
| `actions/billing/promotions.ts`, `checkout-intent.ts` | Billing operations, no guards |
| `actions/guests/create-guest.ts`, `update-guest.ts`, `delete-guest.ts`, `bulk-operations.ts` | Guest mutations, no guards |
| `actions/rsvp/submit-public-rsvp.ts` | Public BY DESIGN — verify token validation during Phase C, don't redesign |

**Root cause:** two tiers were merged. Entry actions (called from components —
must guard) and internal modules (called by actions/webhooks/Inngest — must NOT
be endpoints) both carry `"use server"`.

**Fix (already amended into ARCHITECTURE.md):**

```
actions/{domain}/*.ts   → "use server" ENTRY POINTS ONLY.
                          guard → zod-validate → call services → return ActionResult
lib/services/           → internal backend modules (payment providers, email
                          templates, notification channels, query helpers).
                          Plain modules — components never import them.
```

The 58 misplaced non-action files currently in `actions/` (email templates,
intouch/pesapal providers, types, validation, constants) relocate to
`lib/services/` or `types/`.

## 🟡 P1 — Structure debt

| Item | Count | Resolution |
|---|---|---|
| Barrels (`index.ts` re-exports) | 37 | Delete all; direct imports |
| God files (>250 lines) | 25 | Split by concern. Worst: `GuestList` 683, `SettingsClient` 671, `intouch` 652, `EventDetailClient` 618, `DashboardPaymentForm` 605 |
| `loading.tsx` leftovers | 6 | Replace with section skeletons (Phase E) |
| `force-dynamic` | 2 | test-payments page (remove in Phase E); sitemap (EXEMPT — metadata route) |
| Pages awaiting data | 4 admin list pages + `app/(dashboard)/new/page.tsx` (inline event-creation logic) | Thin wrappers (Phase E) |
| Admin route nesting | `app/(admin)/admin/(dashboard)/` | Flatten to `app/(admin)/admin/`, delete passthrough layout (Phase E) |

## 🟢 P2 — Small items

- `app/sitemap.ts` — replace direct db import with an action call
- `app/(site)/[locale]/checkout/page.tsx` — `claimPromotionAction` awaited in render (side effect in GET); verify intent
- `app/api/events/route.ts` — internal data served over an API route (guarded correctly, but violates the actions-only rule). DECIDE: documented public API, or fold into actions
- `app/api/health/route.ts` — 503 response includes the raw db error message; strip to a sanitized status (info-leak hardening)
- `app/api/events/[eventId]/export/route.ts` — `(context as Params)` cast violates the type rules; narrow properly. Route itself is a legit file-download exception
- Checkout pending UX — when Pesapal returns `pending` the user lands on `/checkout?status=pending`; verify the page polls a status action and flips to success when the IPN lands (event payments have `actions/rsvp/check-payment-status.ts`; billing checkout may have nothing)
- Verify `confirmPaymentSuccess` / `failPayment` are idempotent — if the IPN finalizes a payment before the browser returns, the callback runs them a second time (no double subscription grant, no duplicate confirmation email)
- `schema/` → `types/` migration; fold old `types/` leftovers
- `user.username!` at `actions/events/dashboard.ts:304,399` — verify nullability, then guard or type
- `as` casts in `actions/events/mutations.ts`, `dashboard.ts` — narrow with zod
- ~13 dead imports each in `actions/events/dashboard.ts` + `mutations.ts`
- Duplicated guest serializer (`dashboard.ts:222-228` vs `373-377`) — extract shared
- Sequential queries in `getDashboardEventGuests` → `Promise.all`
- `schema/guests.ts` byte-identical to `actions/guests/types.ts` — single source
- 3 stat-card implementations → one in `components/layout/`
- `actions/admin/health-check.ts` — plain module (no `"use server"`, exports sync
  fns + types) sitting under `actions/`, which fails the check:arch "file under
  actions/ missing use server" rule. Not a security hole (not an endpoint).
  Relocate to `lib/services/admin/health-check.ts`, move its 6 types to
  `types/admin.ts` (SerializedHealthCheckResult/…ServiceCheckResult are derived
  from `serializeHealthResult` — redefine structurally), repoint the 4 health
  components + `app/api/health/route.ts` + health.ts/errors.ts/overview.ts.
- 7 pre-existing lint errors (baseline HEAD, not from the refactor) — notably
  `components/providers/PWAInstallProvider.tsx`: `(navigator as any).standalone`
  cast → narrow properly; setState synchronously in effect → derive during
  render or guard. Fix after the Phase C security pass.
- Duplicate types `ResolvedEntitlements` / `SubscriptionRow` / `PaymentRow` live
  in BOTH `types/billing.ts` and `actions/billing/types.ts` — consolidate to
  `types/`, repoint imports, delete the leftover (part of the "fold old types/
  leftovers" item above)

## Phase plan (gates between every phase)

- **Phase B — `types/` migration.** `schema/` + old `types/` → `types/{domain}.ts`
  + `types/result.ts` (`ActionResult<T>`). Repoint imports, delete `schema/`.
  _Gate: typecheck green._
- **Phase C — Security split.** Order: **money first** (billing, rsvp,
  withdrawals) → admin → events/guests/auth → notifications/marketing/
  public-profile. Per domain: separate entry actions from internal modules;
  internal → `lib/services/`; every entry action gets guard (or explicit
  `// PUBLIC ACTION` marker) + zod input validation + `ActionResult<T>` return;
  fix P2 items as files are touched. _Gate: typecheck + lint + build green._
- **Phase D — Code hygiene (components/ + lib/).** Split god files; extract
  shared cards/frames/headers to `components/layout/`; per-section skeletons.
  **lib/ cleanup:** lib/ root has ~28 loose files (utils/ has only 4) — move
  single-domain helpers to their domain folder (guest-csv/-excel/-status,
  csv-guest-parser → guests; analytics-excel/-date-range, calendar,
  event-status → events; whatsapp → notifications; activities → admin;
  verify consumers first), merge duplicates (lib/email.ts 318L → lib/email/;
  csv-export.ts → lib/export/; uploadthing*.ts → lib/storage/), inline/delete
  dead weight (validation.ts 7L, brand.ts 4L), simplify survivors (drop
  unused exports/options, no behavior change). lib/ root ends with only
  env.ts + utils.ts loose. _Gate: typecheck + lint + build._
- **Phase E — Pages + routes.** Flatten admin group; thin pages everywhere;
  per-section Suspense behind auth; public pages awaited SSR with `cache()`
  dedupe; remove `loading.tsx`/`force-dynamic` leftovers; fix sitemap.
  _Gate: typecheck + build + `DATABASE_URL="postgres://invalid:5432/none" bun run build` passes._
- **Phase F — Lock-in.** `bun run check:arch` script wired into package.json;
  final ARCHITECTURE.md compliance sweep; delete this report; clean commit
  history. _Then: manual QA → deploy._

## Definition of done

`typecheck`, `lint`, `build` green · `check:arch` passes · fake-DATABASE_URL
build passes · every P0/P1 above resolved · app manually QA'd → deploy.
