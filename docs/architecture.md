# Keli — Architecture Sketch (elaboration of the approved plan)

## Context
The implementation plan for `keli` (stack, data model, ranking algorithm, recipe import, auth, build sequence) was already designed and approved — see `/home/rupak/.claude/plans/my-partner-wants-to-reflective-mountain.md`. This note doesn't change any of those decisions; it just draws out the system architecture in more visual detail — the pieces, how they talk to each other, and what a request looks like end-to-end for the two core flows (ranking an entry, importing a recipe) — so the shape of the system is clear before M0 scaffolding starts.

## System components

```
                         ┌─────────────────────────────┐
                         │   Browser (phone/desktop)    │
                         │   Next.js client + PWA        │
                         │   installable to home screen   │
                         └───────────────┬───────────────┘
                                         │ HTTPS
                                         ▼
                         ┌─────────────────────────────┐
                         │           Vercel              │
                         │  ┌─────────────────────────┐  │
                         │  │ Next.js App Router        │  │
                         │  │  - Server Components       │  │  (pages: journal,
                         │  │    (render pages using     │  │   rank, compare,
                         │  │     Prisma directly)       │  │   recipes, login)
                         │  │  - Route Handlers (API)    │  │
                         │  │    /api/recipes/import      │  │
                         │  │    /api/auth/[...nextauth] │  │
                         │  │  - Middleware               │  │  (session gate:
                         │  │    (auth check on every    │  │   redirect to /login
                         │  │     request except /login) │  │   if no valid cookie)
                         │  └───────────┬─────────────┘  │
                         └──────────────┼─────────────────┘
                                        │ Prisma Client (TCP, pooled)
                                        ▼
                         ┌─────────────────────────────┐
                         │   Neon (serverless Postgres)  │
                         │   User / Subcategory / Entry / │
                         │   Comparison / Recipe / Photo / │
                         │   Accomplishment tables          │
                         └─────────────────────────────┘

                         ┌─────────────────────────────┐
                         │  Recipe websites (external)   │
                         │  fetched server-side only,     │
                         │  never called from the browser  │
                         └─────────────────────────────┘
                                        ▲
                                        │ fetch() + cheerio parse
                                        │ (only from the import route handler)
                                        │
                         (Vercel route handler reaches out here,
                          not the client — avoids CORS + hides
                          scraping logic from the browser)

                         ┌─────────────────────────────┐
                         │        Vercel Blob            │
                         │  photo storage, keyed by URL   │
                         │  referenced from Photo rows     │
                         └───────────────▲─────────────┘
                                         │ direct upload
                                         │ (signed token issued by
                                         │  /api/photos/upload, then
                                         │  browser uploads bytes
                                         │  straight to Blob)
                         ┌───────────────┴───────────────┐
                         │   Browser (phone/desktop)      │
                         └─────────────────────────────┘
```

**Why this shape:** Server Components let pages query Postgres directly during render (no separate "API layer" needed for normal reads — less code, faster pages). Route Handlers exist only where something can't be a plain page render: the recipe-import fetch (needs to happen server-side, not in the browser) and the NextAuth callback. Middleware is the single choke point for "are you logged in" — every route except `/login` passes through it.

## Flow 1 — Adding and ranking an entry
This is the core mechanic end-to-end:

1. **Browser** → user taps "Add" on `entries/new`, fills in title/domain/subcategory/notes, optionally attaches a photo, submits.
   - **Photo attachment happens inline here, not as a separate step:** as soon as a photo is picked, the client uploads it straight to Vercel Blob in the background (same signed-token pattern as Flow 3) and holds the returned URL in form state — this can happen before the entry itself is ever saved, since Blob uploads don't require an `entryId`.
2. **Server Component/Action** creates the `Entry` row with a placeholder `rankPosition`, then — in the same action, using the Blob URL(s) already sitting in form state — creates any `Photo` row(s) linked to the new `entryId`. Only after that does it call `lib/ranking.ts` to find where the entry belongs.
3. **`lib/ranking.ts`** loads the subcategory's existing entries (sorted by `rankPosition`) from Postgres via Prisma, and instead of guessing, redirects the user into the duel flow.
4. **Browser** → `compare/[entryId]` page renders one duel at a time: "which was better, X or Y?" — this is the binary-search step from the approved plan, so it takes `~log2(n)` screens, not one per existing item.
5. Each tap posts the answer → a Server Action writes a `Comparison` row and narrows the search range (`lo`/`hi`) → either shows the next duel or, once resolved, computes the final `rankPosition` (midpoint of the two neighbors it landed between) and updates the `Entry`.
6. **Browser** → redirected to `rank/[subcategoryId]`, which is a Server Component doing `ORDER BY rankPosition` and rendering positions 1..n — the raw `rankPosition` float never leaves the server; the page computes and sends only the display rank. The entry's photo(s), if any, show on its card here and on its detail page.

Net effect: attaching a photo feels like one step to the user (fill form, pick a photo, save), even though it's really "upload bytes to Blob" + "create Entry" + "create Photo" happening in that order before the duel screens ever appear.

## Flow 2 — Importing a recipe from a URL
1. **Browser** → user pastes a URL on `recipes/new`, submits to `POST /api/recipes/import`.
2. **Route Handler** (`app/api/recipes/import/route.ts`) — this is the one place in the system that talks to the outside internet — fetches the page HTML server-side with a browser-like User-Agent.
3. **`lib/recipeParser.ts`** runs entirely inside that same server process: extracts JSON-LD via `cheerio`, normalizes the `Recipe` fields, falls back to microdata, falls back to a "couldn't import" response if neither is found.
4. On success, the Route Handler writes a `Recipe` row (including the raw JSON-LD for future reprocessing) and returns it to the browser, which shows the pre-filled recipe for a final look/edit before saving.
5. On failure, the browser drops into the manual recipe form instead — no dead end.

## Flow 3 — Photo upload
The same upload mechanism used inline during entry creation (Flow 1, step 1) also works standalone — e.g. adding a photo to an entry or accomplishment after the fact:
1. **Browser** → on an entry or accomplishment form, user picks/takes a photo; the client requests a short-lived signed upload token from `POST /api/photos/upload`.
2. **Route Handler** verifies the session (via the same middleware-protected auth) and returns a signed Vercel Blob upload token — it does not touch the image bytes itself.
3. **Browser** uploads the file directly to **Vercel Blob** using that token (`@vercel/blob/client`) — large binary transfer never passes through a Next.js serverless function, avoiding payload-size limits.
4. On success, Blob returns a public URL; the **browser** sends that URL back to a Server Action, which writes a `Photo` row linking it to the current `entryId` or `accomplishmentId`.
5. Pages showing that entry/accomplishment (Server Components) just `include` its `Photo` rows in the Prisma query and render the URLs — no extra round trip needed.

## Flow 4 — Auth
1. **Browser** → `login` page posts email + password to NextAuth's Credentials provider (via `/api/auth/[...nextauth]`).
2. **Server** looks up the `User` row, runs `bcrypt.compare` against `passwordHash`.
3. On success, NextAuth issues a signed **httpOnly** session cookie (JWT strategy — no session table). On failure, the form re-shows an error.
4. Every subsequent request carries that cookie; **Middleware** checks it before letting the request reach any page or route handler other than `/login` and the NextAuth handler itself, redirecting to `/login` if it's missing/invalid.
5. There's no separate per-user data partitioning — once authenticated, both accounts read/write the same shared tables (by design: one shared journal, not two silos).

## Deployment topology
- **Source of truth:** `git@github.com:rupakstephen/keli.git`, `main` branch.
- **CI/CD:** pushing to `main` triggers a Vercel build automatically (git integration, no separate pipeline to configure) — build runs `next build`, `prisma generate`, deploys serverless functions + static assets to Vercel's edge network.
- **Database:** Neon Postgres, a separate managed service Vercel's functions connect to over a pooled connection string (stored as a Vercel environment variable) — not something Vercel hosts itself.
- **Environments:** a single production environment is enough at 2-user scale (no need for staging); Vercel's preview deployments (one per PR/branch push) double as a free testing environment if changes ever need a dry run before hitting `main`.

## Critical files
- `prisma/schema.prisma`
- `src/lib/ranking.ts`
- `src/app/compare/[entryId]/page.tsx`
- `src/lib/recipeParser.ts`
- `src/lib/auth.ts`
- `src/middleware.ts` *(the auth gate described above; not called out explicitly in the original plan's file list)*
- `src/app/api/photos/upload/route.ts` *(issues signed Vercel Blob upload tokens — see Flow 3)*

## Verification
See `implementation-plan.md`'s verification section (steps 12-13 cover photos and accomplishments specifically) — this document only clarifies the architecture, it doesn't change what needs to be tested.
