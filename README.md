# keli

A private, shared ranking journal for two people. Log home-cooked meals, movies, games and trips, and rank them against each other by head-to-head comparison. No scores are ever shown, only best-to-worst position within a list, and lists never mix (horror is never ranked against comedy). There is no signup, no social feed and no discovery: two seeded accounts share one dataset.

Also in the app: a recipe box (paste a URL to import, or write your own), photos on any entry, and a freeform accomplishments list with live-computed stats.

## Stack

Next.js (App Router, TypeScript, Tailwind) · Prisma + Neon Postgres · Auth.js credentials login · Vercel Blob for photos · deployed on Vercel. Installable on a phone as a PWA.

> This is Next.js 16 with breaking changes from older versions (for example `proxy.ts` replaces `middleware.ts`). Read the matching guide in `node_modules/next/dist/docs/` before changing framework-level code.

## Run locally

```bash
npm install --ignore-scripts   # skips the prisma postinstall, which needs DATABASE_URL
cp .env.example .env.local     # fill in the values below
npx prisma generate
npx prisma migrate deploy      # apply migrations to your Neon database
npm run db:seed                # create the 2 accounts (once)
npm run dev                    # http://localhost:3000
```

| Variable | Used for |
| --- | --- |
| `DATABASE_URL` | Neon connection string |
| `AUTH_SECRET` | Session signing (`npx auth secret`) |
| `BLOB_READ_WRITE_TOKEN` | Photo uploads. Appears after you create and connect a Blob store in the Vercel project (Storage tab) |
| `SEED_USER_{1,2}_{EMAIL,NAME,PASSWORD}` | Read once by `npm run db:seed` |

Other commands: `npm test` (accomplishment input, photo targets, stats strip and backup logic; ranking and the recipe parser have no tests yet), `npm run lint`, `npm run build`.

## Project layout

```
prisma/            schema, migrations, seed
src/app/(app)/     authenticated pages: journal, rank, entries, compare, recipes, accomplishments
src/app/api/       auth, photo upload tokens, recipe import
src/app/manifest.ts, src/app/pwa-icon/   PWA manifest and generated icons
src/lib/           ranking.ts (binary-insertion ranking), recipeParser.ts, auth, db
src/proxy.ts       auth gate; everything except /login, auth routes and PWA assets needs a session
scripts/           nightly backup (see below)
docs/              architecture, implementation plan, discovery notes
```

`docs/implementation-plan.md` has the design decisions and the full milestone history (M0 to M6).

## Backups

A nightly cron job in the Nextcloud LXC (101 on `pve`) runs `scripts/backup.sh`: a `pg_dump` of Neon plus a sync of new Vercel Blob photos into Nextcloud's data directory, with an optional rsync of the result to a second machine. `setup-m6-backup.sh` is an interactive wizard that provisions it. The dump needs a `pg_dump` at least as new as Neon's Postgres major version.

## Deploy

Hosted on Vercel (`vercel` for a preview, `vercel --prod` for production). The project needs `DATABASE_URL`, `AUTH_SECRET` and `BLOB_READ_WRITE_TOKEN` set for all environments.
