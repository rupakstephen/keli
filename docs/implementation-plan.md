# Keli — Private Shared Ranking Journal App

## Context
Your partner wants a Beli-like app, but broader: a private, shared journal for the two of you to rank and review home-cooked meals, movies, games, and travel/trips/hotels — not primarily restaurants. Her key departure from Beli: she wants the *relative-placement* mechanic (comparing new things against what you've already ranked) but never wants to see a numeric score — only a best-to-worst position. Rankings must stay scoped to comparable groups (never rank horror movies against comedy, or Indian food against Chinese). There's no social/discovery angle — it's just the two of you, no leaderboards. She also wants a "recipe box": paste a web recipe URL to import it, plus store your own recipes.

The `keli` repo (`/home/rupak/projects/keli`, remote: `git@github.com:rupakstephen/keli.git`) currently contains only `docs/discovery-questions.md` — confirmed via direct exploration to be otherwise empty, no scaffold, no dependencies chosen. A sibling project, `/home/rupak/projects/fridge-app`, was checked for reusable code and confirmed to have nothing usable: no recipe parsing, plaintext-password auth, and a fake browser-storage shim instead of a real database. **Build from scratch.**

Three decisions were confirmed directly with you:
- **Single subcategory per item** — every entry belongs to exactly one ranked list (e.g. a movie is Horror *or* Comedy, not both). Simpler and unambiguous; matches how Beli itself works.
- **Stack confirmed as-is** — Next.js + Postgres (Neon) + Prisma + NextAuth + Tailwind, deployed on Vercel as an installable, mobile-friendly responsive web app (not native).
- **Domains are a fixed set for now** — Meals, Movies, Games, Travel, hardcoded as an enum. Adding a 5th later is a small change, not worth building a domain-management UI yet.

Two follow-up decisions, confirmed after the architecture sketch:
- **Accomplishments are both manual and auto-computed** — a freeform, cross-domain list you write your own entries into (title/date/write-up), *plus* live-computed stats (counts, firsts) pulled from your existing entries — not filed under any one domain.
- **Photos are generic, not meal-only** — any entry (meal, movie, game, or travel) and any accomplishment can have photos attached, built once as a shared feature rather than meal-specific.

A third follow-up decision, after discussing self-hosting alternatives: **stay on Vercel + Neon + Vercel Blob for the live app** (self-hosting on home hardware was considered — Mac Mini, Pi5, Pi4B — but rejected for now: it trades zero-ops reliability for becoming your own sysadmin, and none of the idle hardware was fully ready to go). Instead, the "don't want our data locked behind a provider" concern is addressed with **automated backups to your own Nextcloud instance** (already running on your Pi5) rather than by self-hosting the database itself. See **Backups** below.

## Tech stack
**Next.js (App Router, TypeScript) + Prisma + Postgres via Neon + NextAuth.js (Credentials provider) + Tailwind CSS + Vercel Blob (photo storage), deployed on Vercel.**

Why: two people on different phones need one real shared backend (not local/browser storage like fridge-app used). Recipe-URL import needs a server-side fetch (CORS, no client-exposed scraping) — Next.js route handlers cover that without a separate backend service. Neon is zero-ops serverless Postgres with a free tier; Prisma gives schema + migrations + a typed client with minimal setup. Tailwind + a PWA manifest gives an installable, mobile-first experience without the ~2x build cost of a native app. Vercel Blob is the natural choice for photo storage since it's already part of the Vercel account being used for hosting — no separate provider/API keys to manage — and its free tier (1GB storage, 10GB bandwidth/month) is well beyond what two people's meal/travel photos will need.

## Data model
Core entities (Prisma schema, `prisma/schema.prisma`):

- **`User`** — `id`, `email`, `name`, `passwordHash`. Exactly 2 rows, created via a seed script — no public signup route.
- **`Domain`** — fixed enum: `MEAL | MOVIE | GAME | TRAVEL`.
- **`Subcategory`** — `id`, `domain`, `label` (e.g. "Horror", "Indian", "Beach"), unique per `(domain, label)`. User-creatable from the UI.
- **`Entry`** — the core object: doubles as both journal entry and ranked item. Fields: `domain`, `subcategoryId`, `title`, `notes` (free text, independent of rank), `experiencedAt`, `rankPosition` (float, internal sort key — **never rendered to the UI as a number**, only as relative position in a list), `metadata` (JSON, domain-specific extras), optional `recipeId`, `createdById`.
- **`Comparison`** — audit trail of each pairwise duel: `subcategoryId`, `winnerEntryId`, `loserEntryId`, `comparedById`, `comparedAt`. Not needed for sort correctness but supports "why is X above Y" and a future undo.
- **`Recipe`** — `title`, `sourceUrl` (null if manually authored), `imageUrl`, `servings`, `prepTimeMin`, `cookTimeMin`, `ingredients` (JSON string array), `instructions` (JSON string array), `rawJsonLd` (original scraped block, kept for reprocessing if normalization logic changes).
- **`Accomplishment`** — the freeform, cross-domain milestone list: `title`, `description` (the write-up), `achievedAt`, `createdById`, `createdAt`. Deliberately has no `domain`/`subcategoryId` — it's one shared list, not filed per-category.
- **`Photo`** — `url` (Vercel Blob URL), `entryId` (nullable FK to `Entry`), `accomplishmentId` (nullable FK to `Accomplishment`), `uploadedById`, `createdAt`. Exactly one of `entryId`/`accomplishmentId` is set per row (enforced in application code, not a DB constraint — fine at this scale). One photo table shared by both parents rather than duplicating an `EntryPhoto`/`AccomplishmentPhoto` table, since the shape is identical.

Enforce "never show the number" at the API layer: a `toPublicEntry()` mapper strips `rankPosition` from anything sent to the client, exposing only a computed 1-based `position` derived from list order.

### Accomplishment stats (the "auto-computed" half)
Rather than a separate stats table or background job (unnecessary at 2-user data volume), the accomplishments page runs a handful of live Prisma aggregate queries on render: total entries per domain (`count` grouped by `domain`), oldest/most-recent entry per domain (`firsts`), total comparisons made, total recipes cooked-from, total accomplishments logged. These render as a small stats strip above the manual accomplishments list. No "unlocked badge" state-tracking system for MVP — that would need its own table (`Badge`, `UnlockedBadge`) to remember what's already been shown/earned; flagged as a clean fast-follow (M6+) rather than built now, since live counters already satisfy "auto-computed" without that extra bookkeeping.

## Ranking algorithm (`src/lib/ranking.ts`)
**Explicit ordered position via binary-search insertion — not Elo.** Elo is for large populations with recurring, probabilistic matchups; here every comparison is a one-time authoritative statement ("Shrek 2 > Shrek 1") that should never be silently re-weighted later. Binary insertion guarantees the list is always structurally consistent with every comparison made, and needs no tuning.

- `rankPosition` uses **fractional/gap-based positions**: first item in a subcategory gets `1000`; inserting between neighbors takes the midpoint of their positions (or ±1000 at either end). This means inserting never requires rewriting other rows.
- Insertion: load existing entries in the target subcategory sorted by `rankPosition`. For `n=0`, place with no comparison. For `n=1`, one duel decides above/below. For `n>1`, binary search: `lo=0, hi=n`, repeatedly duel the new entry against `list[mid]`, narrow `hi=mid` (new entry wins) or `lo=mid+1` (existing wins), until `lo===hi` gives the exact insertion index. Total duels ≈ `ceil(log2(n+1))`.
- Every duel writes a `Comparison` row for provenance.
- Manual re-rank (drag or a "move" action) is supported as a fast-follow: recompute `rankPosition` as the midpoint of the new neighbors without a full re-comparison.
- Ties are out of scope for MVP — the UI always forces a pick.

## Recipe import (`src/app/api/recipes/import/route.ts`, `src/lib/recipeParser.ts`)
1. Server-side `fetch(url)` with a realistic `User-Agent` header (many recipe sites block default UAs) and a timeout.
2. Parse HTML with `cheerio`, extract `<script type="application/ld+json">` blocks, find an entry whose `@type` includes `"Recipe"` (handling both a bare object and a `@graph` array) — this is what powers Google's recipe rich snippets and is emitted by nearly every WordPress recipe plugin.
3. Normalize into the `Recipe` schema, handling known shape variance: `image` (string / array / `ImageObject`), `prepTime`/`cookTime` (ISO 8601 durations like `PT20M`), `recipeInstructions` (string, string array, `HowToStep[]`, or nested `HowToSection[]`). Store `rawJsonLd` alongside for reprocessing.
4. **Fallback** when no JSON-LD Recipe is found: try a basic microdata pass (`[itemtype*="schema.org/Recipe"]`), and if that also fails, return a clear "couldn't auto-import" response that drops the user into the manual recipe form, pre-filled with whatever generic metadata is available (page `<title>`, `og:image`).
5. Not pulling in a third-party recipe-scraper npm package — the schema variance is small enough (~80-100 lines) to own directly rather than depend on an often-unmaintained package.

## Photo uploads (`src/app/api/photos/upload/route.ts`)
Uses Vercel Blob's client-upload pattern (`@vercel/blob/client`) rather than routing image bytes through a server function body: the browser requests a short-lived signed upload token from a small route handler, then uploads the file bytes directly to Blob storage, and only the resulting URL comes back to the app to save as a `Photo` row linked to the relevant `entryId` or `accomplishmentId`. This avoids Vercel serverless function payload-size limits and keeps large binary transfer off the app server entirely. Client-side, an `<input type="file" accept="image/*" capture>` on entry/accomplishment forms lets you pick from the camera roll or take a photo directly on mobile. No image resizing/compression pipeline for MVP — Blob just stores what's uploaded; revisit only if storage or load-time becomes a real problem at 2-user scale (unlikely).

## Backups (`scripts/backup.sh`)
Vercel + Neon + Vercel Blob host the live app, but a scheduled job keeps an independent, restorable copy of everything on hardware you own — so the data is never actually trapped behind a provider, even though nothing self-hosted is on the app's critical path day-to-day.

- **Where it runs:** a cron job on the **Pi5** (already always-on, already running Nextcloud). Chosen over a GitHub Actions scheduled job specifically so the job only ever makes *outbound* connections (to Neon, to the Vercel Blob API) — nothing about backups requires exposing Nextcloud or the home network to the internet.
- **What it does, nightly:**
  1. `pg_dump` against the Neon connection string (a read-only Postgres role, not the app's main credential), gzipped. Expected size: trivially small — low single-digit MB even after a couple years of heavy use, since the schema is almost entirely short text rows; the only moderately-sized rows are `Recipe.rawJsonLd`.
  2. A Blob sync step: list objects via the Vercel Blob API, download any new/changed photos since the last run. This is the part that actually matters for size (phone photos run ~2-5MB each) and the part a `pg_dump` alone would silently miss, since photo bytes live in Blob, not Postgres — only the `Photo` table's *URLs* would be in the dump otherwise.
  3. Both land in a folder inside the Pi5's Nextcloud data directory, so they show up as regular versioned files — no separate storage system to run.
- **Why Nextcloud, not a raw folder on disk:** it's already running, already durable, and gives file versioning/sync for free — no reason to stand up a second thing to do a job Nextcloud already does.
- Not built until after M0 (there's nothing to back up yet), and doesn't block any feature milestone — it's an operational task, not app code, so it can slot in whenever convenient once Neon/Blob exist.

## Auth
Exactly 2 users sharing one dataset — deliberately minimal, and specifically avoiding fridge-app's mistakes (plaintext passwords, fake OAuth, client-only storage).
- No public signup route. Both accounts created once via `prisma/seed.ts`, storing `passwordHash` with `bcryptjs` (10+ salt rounds).
- NextAuth.js Credentials provider: verifies `bcrypt.compare` against `passwordHash`, issues a signed httpOnly session cookie (JWT strategy — no sessions table needed at this scale).
- No self-service password reset (no email infra) — an acceptable simplification for 2 known users; reset via the seed script if needed.
- Every authenticated user can read/write the whole shared dataset (no per-row ownership) — auth just gates "logged in or not," via `src/proxy.ts` redirecting unauthenticated requests to `/login` (Next.js 16 renamed the old `middleware.ts` convention to `proxy.ts`; same role, checked against every request except `/login`).

## Project structure
```
keli/
  prisma/schema.prisma, seed.ts
  src/
    app/
      login/page.tsx
      (app)/                              # authenticated route group, mobile bottom-nav
        journal/page.tsx                  # feed of entries, filterable by domain
        rank/[subcategoryId]/page.tsx     # best-to-worst list, no numbers shown
        entries/new/page.tsx              # add entry -> triggers comparison flow
        entries/[id]/page.tsx             # notes, recipe link, manual re-rank
        compare/[entryId]/page.tsx        # pairwise duel screen
        subcategories/page.tsx            # create/manage subcategories per domain
        recipes/page.tsx, recipes/new/page.tsx, recipes/[id]/page.tsx
        accomplishments/page.tsx          # stats strip + manual accomplishment list
        accomplishments/new/page.tsx
      api/recipes/import/route.ts
      api/photos/upload/route.ts          # issues signed Vercel Blob upload tokens
      api/auth/[...nextauth]/route.ts
    proxy.ts                                # auth gate (Next.js 16 renamed from middleware.ts)
    lib/db.ts, auth.ts, ranking.ts, recipeParser.ts
    components/CompareDuel.tsx, RankedList.tsx, EntryCard.tsx, RecipeForm.tsx,
               PhotoUploader.tsx, AccomplishmentCard.tsx, StatsStrip.tsx
  public/manifest.json                    # PWA install support
```

## Build sequence
- **M0 — Scaffold:** `create-next-app` (TS/App Router/Tailwind), Prisma + Neon wired up, NextAuth with the 2 seeded users, empty authenticated shell deployed to Vercel. Prove DB ↔ app ↔ hosting ↔ two phones before writing feature code.
- **M1 — Journal skeleton:** `User`/`Subcategory`/`Entry`/`Comparison` schema; subcategory CRUD; create/list entries with notes/date/domain (no ranking yet).
- **M2 — Ranking engine (core mechanic):** `lib/ranking.ts`, the duel UI, wire entry creation into binary-insertion, render `rank/[subcategoryId]` as a plain best-to-worst list.
- **M3 — Polish:** entry detail/edit, manual re-rank, domain tabs, mobile bottom-nav, empty states. All 3 must-haves (ranking, private journal, scoped comparisons) complete after this milestone.
- **M4 — Recipe box:** `Recipe` model + manual form first, then `api/recipes/import` (cheerio + JSON-LD + fallback), then optional `recipeId` link on Meal entries.
- **M5 — Photos & accomplishments:** `Photo` model + Vercel Blob client-upload flow, wired into entry and accomplishment forms; `Accomplishment` model + manual create/list UI; live-computed stats strip.
- **M6 — Backups:** `scripts/backup.sh` (pg_dump + Blob sync), read-only Neon role for it to run as, cron entry on the Pi5, destination folder in Nextcloud. Confirm a restore actually works before considering it done.
- **M7 — Stretch (not required):** PWA install polish, search/filter, rankPosition rebalancing job, tie support, badge/unlock-state system for accomplishments.

## Verification
Run through this on two real devices logged in as the two seeded users, to confirm shared-backend behavior (not per-device local storage):
1. Auth: log in as each user; confirm wrong password rejected; confirm no signup route exists.
2. Shared data: User A creates a subcategory; confirm it appears on User B's device after refresh.
3. Core ranking: add two Comedy movies (e.g. Shrek, Shrek 2), do one duel, confirm correct ordering and that **no numeric score appears anywhere in the UI**. Add a 3rd and confirm it lands in the mathematically correct slot via `ceil(log2(n+1))` duels.
4. Scoping: add a Horror movie and confirm the duel screen only ever offers other Horror entries, never Comedy — repeat with two different cuisines under Meals.
5. Notes edits don't affect rank position.
6. Manual re-rank persists after refresh.
7. Recipe import happy path: paste a real JSON-LD recipe URL, confirm title/ingredients/steps match, confirm `rawJsonLd` stored.
8. Recipe import fallback: paste a URL with no structured data, confirm a clear failure message and a path into the manual form (no crash).
9. Recipe ↔ entry link: attach a recipe to a Meal entry; confirm it also stands alone in the recipe box.
10. Mobile usability: repeat steps 3-4 on an actual phone browser, confirm duel UI is comfortably tappable one-handed.
11. Confirm both phones reach the real deployed Vercel URL, not just localhost.
12. Photos: attach a photo to a meal entry from a phone camera roll, confirm it appears on the entry and persists after refresh; repeat for a non-meal entry (e.g. a movie) and for an accomplishment, confirming the generic upload works everywhere, not just meals.
13. Accomplishments: create a manual accomplishment with a write-up and confirm it appears on the shared list for both users; confirm the stats strip reflects real counts (e.g. add a 3rd movie and confirm the movie count increments).
14. Backup restore: run `scripts/backup.sh` manually, confirm both the gzipped dump and any new photos land in Nextcloud, then actually restore the dump into a scratch Postgres instance and diff a few rows against Neon — a backup that's never been restored isn't verified.

### Critical files
- `prisma/schema.prisma`
- `src/lib/ranking.ts`
- `src/app/compare/[entryId]/page.tsx`
- `src/lib/recipeParser.ts`
- `src/lib/auth.ts`
- `src/proxy.ts`
- `src/app/api/photos/upload/route.ts`
- `scripts/backup.sh`
