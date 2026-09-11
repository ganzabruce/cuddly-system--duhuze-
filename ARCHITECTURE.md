# ARCHITECTURE.md

This file is the single source of truth for how Duhuze is built. All code —
human or agent — follows it. If code disagrees with this file, the code is wrong.

Stack: Next.js 16 (App Router), React 19, Tailwind v4, Drizzle ORM on Neon
Postgres, Clerk auth, Resend email, Inngest jobs, Uploadthing, next-intl (en, fr).

## Principles

1. **Explicit but simple.** Machinery you can see beats convenience you can't.
   No implicit endpoints, types, or behavior — and no cleverness. If an
   implementation needs a paragraph to explain, it's wrong.
2. **Explicit at the boundary, derived in the interior.** Guard and validate at
   every edge (auth, zod, serialization). Derive types in the middle
   (`InferSelectModel`, `z.infer`) — never hand-mirror a source of truth.
3. **The feedback loop is explicit.** Rules are machine-checkable and fail
   loudly (`check:arch`, typecheck, gates). Standards come from tooling that
   makes the wrong thing fail — not from docs people skim.
4. **One capability, one home.** Everything exists exactly once. Doorways
   (admin / dashboard / public) are a guard + a view over shared services.
   Duplication is drift.
5. **Delete, don't wrap.** Dead code is deleted — not aliased, barrelled, or
   commented out. No re-export shims, no wrapper band-aids.
6. **Small phases, hard gates.** Work in verifiable steps; each ends with proof
   (typecheck, lint, build, grep). Trust is earned per commit.
7. **Build from the ground up.** Contracts/types → services → actions → UI.
   Each layer is verified before the next rests on it. A new feature starts at
   the contract, not at the component.

## Architecture

### The three layers

```
┌──────────────────────────────────────────────────┐
│ UI       components/   "use client"              │ renders, calls actions
├──────────────────────────────────────────────────┤
│ BACKEND  actions/      "use server"              │ the ONLY layer that talks
│                                                   │ to DB, email, payments
├──────────────────────────────────────────────────┤
│ DATA     lib/db/       Drizzle + Neon            │ tables + client
└──────────────────────────────────────────────────┘
          types/ = contracts (zod + TS) both sides share
```

**The one rule:** UI never touches the DB. Components call actions; actions
are the backend; `types/` is the shared language.

### The two tiers of the backend

Every exported async function in a `"use server"` file is a publicly callable
endpoint — so the backend is split:

- **Entry actions** (`actions/`): `"use server"`, guarded, thin. The only
  backend files components may import.
- **Services** (`lib/services/`): plain modules doing the actual work —
  queries, providers, email templates, notification channels. No
  `"use server"` (never endpoints), never imported by components (not even
  `import type`). Entry actions, webhooks, and Inngest functions call them.
- **Shared pure modules** (`lib/constants/`): constants and pure functions
  BOTH sides need — currencies, category labels, path builders, entitlement
  checks, CSV builders. Pure only: no I/O, no `lib/db`, no env secrets, no
  imports from `lib/services`. Components, `types/`, actions, and services
  may all import from here.

Entry action shape:

```
guard (or PUBLIC marker) → zod-validate input → call services → ActionResult
```

Mutations add one step: `revalidatePath()` the affected paths after the write.
The client updates from the return value — no full-page refetch.

All side effects (Resend, Inngest, Pesapal/Intouch, Uploadthing) live in
services, reached via actions or webhooks. Components never import
`lib/email`, `lib/inngest`, or provider SDKs.

## Folder map

```
app/                    → routes only
  (admin)/admin/        → admin panel. ONE layout: requireAdmin + sidebar shell
  (dashboard)/          → group layout: requireUser + i18n. Covers dashboard/ + new/
  (site)/[locale]/      → public pages (SSR, i18n)
  (auth)/               → login, signup, onboarding
  api/                  → EXTERNAL webhooks only (pesapal, intouch, uploadthing, inngest)
actions/                → ENTRY-POINT actions ONLY. Every file "use server".
  {domain}/             → admin, auth, billing, events, guests, marketing,
                          notifications, public-profile, rsvp
components/             → the UI
  ui/                   → dumb primitives (button, badge, input). Knows nothing about the app.
  layout/               → shared composed pieces: cards, stat cards, section frames,
                          page headers, empty states
  skeletons/            → loading placeholders, one per data section
  providers/            → context providers
  {domain}/             → feature components (know domain types)
types/                  → contracts: zod schemas + inferred types + ActionResult
  {domain}.ts           → events.ts, guests.ts, billing.ts, ...
  result.ts             → the ActionResult contract
lib/
  db/                   → drizzle client + table schema. Imported by actions/ and services ONLY.
  services/             → the internal backend (see two tiers above)
  constants/            → shared pure modules (see above). Importable by ALL tiers.
  inngest/ email/ storage/ utils/ env.ts
                          → utils/ = genuinely generic helpers ONLY (logger,
                            format, phone, dates, urls). No loose files in
                            lib/ root besides env.ts and utils.ts (cn).
hooks/                  → shared client hooks
i18n/ messages/         → locales (en, fr)
```

## Data flow

### Authed pages (dashboard, admin)

1. **Page = thin server component.** Fires per-section action promises
   (unawaited), renders the shell (title, tabs, nav) as static JSX, wraps each
   data section in its own `<Suspense fallback={<SectionSkeleton/>}>`.
2. **The shell paints instantly.** Skeletons wrap the smallest data leaf only —
   never a whole card. Card frame, title, icon are static.
3. **Client components receive promise props** and unwrap with `use()`.
4. **Actions are granular** — one per section (`getOverviewStats`,
   `getUpcomingEvents`), never one `getPageData` that suspends the whole page.

Hard constraints:

- A client component must **never call an action during render**
  (`use(getData())` throws in Next 16). The promise is born in the page and
  passed down. Calling actions from event handlers (clicks, filter changes,
  mutations) is fine — that happens after render.

### Public pages (site)

- Server components **await** actions and render maximum data into the initial
  HTML: event details, guest counts, RSVP state. SEO and link previews depend
  on it (a WhatsApp preview is generated from raw HTML).
- `generateMetadata` works as normal. Read actions used by both metadata and
  page are wrapped in React `cache()` — one DB hit per request, not two.
- Only genuinely secondary sections may suspend.

## Auth

Three layers, three distinct jobs:

```
proxy.ts      → coarse redirects (locale, obviously-unauthed). UX speed.
layout.tsx    → the gate per route group + chrome. May be skipped on soft nav —
                so it is NOT the security boundary.
action        → enforcement. EVERY action re-checks auth before any DB call.
                Actions are publicly callable POST endpoints — this is the lock.
```

Every entry action opens with its guard, or an explicit
`// PUBLIC ACTION — no auth by design` marker:

```ts
const user = await requireUser();     // session exists (user actions)
await verifyOwnership(eventId, user.id);  // + ownership when touching a resource
const admin = await requireAdmin();   // Clerk metadata + adminUsers table (admin actions)
// PUBLIC ACTION — no auth by design   (RSVP submit, public event data)
```

Admin status is a multi-step check (Clerk session → Clerk privateMetadata →
users table → adminUsers table). Never hand-roll it inline — always the shared
guard. `getCurrentUser` is wrapped in React `cache()`: layout + N actions in
one request = one DB hit.

## Contracts

- **Actions never throw across the boundary** (a throw becomes an opaque 500).
  Every action returns `ActionResult<T>` from `types/result.ts`:

  ```ts
  export type ActionResult<T> =
    | { ok: true; data: T }
    | { ok: false; error: string };
  ```

  Components narrow with `if (!result.ok)`. Each route group has an
  `error.tsx` for the truly unexpected.
- **Domain payload types live in `types/{domain}.ts`**; signatures read
  `Promise<ActionResult<EventDetail>>`.
- **Everything crossing server→client is JSON-safe:** `Date` → ISO string. One
  shared serializer per data shape, next to its query — never copy-pasted
  `.toISOString()` mappings.

## HTTP routes (app/api/)

External webhooks and future public API only. Internal data NEVER gets an API
route — it goes through actions.

**Webhook trust model:** a webhook is public — it must NEVER trust its request
body. The caller proves identity before any service call:

- **Shared secret** — Intouch callbacks verify HTTP Basic auth against
  `INTOUCH_CALLBACK_USERNAME/PASSWORD` (401 otherwise).
- **Server-to-server** — Pesapal callback/IPN ignore the incoming params; they
  look up the payment and query Pesapal's status API with our consumer
  key/secret for the real state.
- **SDK signature** — Uploadthing and Inngest routes are protected by their
  signing secrets, verified inside the SDK handlers.
- **Signed payload** — `api/email-qr` only renders HMAC-signed targets, so it
  can't be abused as a QR proxy.

File downloads that don't fit actions (e.g. CSV export) may be route handlers,
with the same user guard + ownership check as an action. Public-by-design
routes (e.g. `api/health`) return minimal, sanitized information.

## Code rules

- **Pages are thin.** Create promises, compose shell. Never await (public SEO
  pages excepted). No inline layout JSX beyond the shell.
- **No barrels.** Direct imports (`@/actions/events/get-events`). One file =
  one import path. A file that only re-exports gets deleted.
- **No `force-dynamic`, no `loading.tsx`.** Suspense + skeletons instead.
- **No god files.** One concern per file. ~250 lines is a smell: split.
- **No lazy types.** No `any`, no `as` casts, no non-null `!`, no `@ts-ignore`.
  Narrow with zod or type guards. Derive types from source.
- **No dead code.** Delete it, don't comment it out.
- **No loose files in `lib/` root** (only `env.ts` and `utils.ts` are exempt).
  A helper serving one domain lives in that domain's folder.

## Verification (the lock)

Before every commit, and enforced in CI/deploy:

```bash
bun run typecheck   # zero errors
bun run lint        # zero errors
bun run build       # green
bun run check:arch  # boundary checks (below)
```

`check:arch` fails if any of these are found:

- `@/lib/db` imported outside `actions/`, `lib/`, and `app/api/`
- a component importing from `lib/services` or `lib/db`
- `lib/constants/` importing from `lib/db`, `lib/services`, or `process.env`
- a `page.tsx` that awaits an action (except `app/(site)` public pages)
- a file under `actions/` missing `"use server"`
- an entry action with no guard call and no `PUBLIC ACTION` marker
- `force-dynamic`, `loading.tsx`, or `@/modules/` anywhere
- an action called during render in a `"use client"` file

**Deploy gate:** the Coolify build container has no database. Prove nothing
touches the DB at build time:

```bash
DATABASE_URL="postgres://invalid:5432/none" bun run build
```

This build MUST pass. If it fails, the failing page is executing a query at
build time — fix the page, not the environment.
