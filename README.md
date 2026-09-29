# Bereda — Portfolio (Next.js 14 · TypeScript · Tailwind · Framer Motion · Lucide · Drizzle · Postgres)

A single-admin portfolio site: a public site backed by Postgres, plus a
password-protected `/admin` dashboard for editing projects and reading
contact messages — one repo, one Next.js app, deployed on Railway.

## Local setup

```bash
npm install
cp .env.example .env.local   # fill in the three values below
npm run db:generate          # writes SQL into ./drizzle from lib/schema.ts
npm run db:migrate           # applies it to DATABASE_URL
npm run db:seed              # idempotent: inserts data/content.ts's projects if missing
npm run dev                  # http://localhost:3000
```

### Environment variables (`.env.local`)

| Variable | What it is |
|---|---|
| `DATABASE_URL` | Postgres connection string. |
| `SESSION_SECRET` | Random string, 32+ characters, used to encrypt the admin session cookie. Generate with `openssl rand -base64 32`. |
| `ADMIN_PASSWORD_HASH` | bcrypt hash of your admin password — never the plain password. Generate with: `node -e "console.log(require('bcryptjs').hashSync('your-password', 12))"` |

## What's in the database vs. the code

- `data/content.ts` still holds the site's static copy (name, services,
  hero text) and is the **source for the initial seed** of projects.
- Once seeded, the public site's Projects section reads from Postgres
  (`lib/projects.ts`), revalidated every 60 seconds (`app/(site)/page.tsx`).
  If the database is ever unreachable, it falls back to `data/content.ts`
  so the public site never crashes.
- Editing a project afterwards is done from `/admin/projects`, not by
  editing `data/content.ts` again (re-running `db:seed` only adds titles
  that don't already exist — it won't overwrite your edits).

## Admin dashboard

- `/admin/login` — single password field, checked against
  `ADMIN_PASSWORD_HASH` with bcrypt.
- `/admin` — project/message counts, unread count, 5 most recent messages.
- `/admin/projects` — table of all projects; add, edit, delete. Stack tags
  are entered as a comma-separated list in the form and stored as an array.
- `/admin/messages` — newest-first list of contact form submissions.
  Unread messages have a magenta left border; click a row to expand it;
  mark read/unread, delete, or mark everything read at once.
- Session: a signed, `httpOnly` cookie (`portfolio_admin`, iron-session,
  7-day expiry). `middleware.ts` redirects any signed-out visit to
  `/admin/*` (except `/admin/login` itself) to the login page — it does not
  touch the public site, the API routes, or static assets.
- Every admin mutation (login, logout, and all `POST`/`PATCH`/`DELETE`
  calls under `/api/admin/*`) checks the session **and** that the request's
  `Origin` matches the site's own host, as a CSRF guard.

## Contact form

`POST /api/contact` validates input with Zod, rate-limits to 3 submissions
per IP per 10 minutes (in-memory — fine for a single Railway instance, not
shared across replicas), and inserts into the `messages` table. The "I
need…" chips and budget picked in the form are folded into the stored
message text, since the `messages` table only has one free-text column.

## Database scripts

| Command | What it does |
|---|---|
| `npm run db:generate` | Diff `lib/schema.ts` against `./drizzle` and write new migration SQL. Run this after changing the schema. |
| `npm run db:migrate` | Apply any pending migrations in `./drizzle` to `DATABASE_URL`. Safe to re-run. |
| `npm run db:seed` | Idempotently insert `data/content.ts`'s `PROJECTS` into the `projects` table by title. |
| `npm run db:studio` | Open Drizzle Studio against `DATABASE_URL` to browse/edit rows directly. |

`scripts/migrate.mjs` and `scripts/seed.mjs` are plain Node (`.mjs`), not
TypeScript — they talk to Postgres directly with `postgres`/`drizzle-orm`
rather than importing `lib/schema.ts`, so no `ts-node`/`tsx` dependency is
needed to run them.

## Deploying to Railway

1. **Create the Postgres database.** In your Railway project, add a
   Postgres plugin. Railway injects `DATABASE_URL` into services you
   connect it to — reference it rather than hardcoding a URL.
2. **Connect this repo as a service**, with the Postgres plugin attached so
   it can see `DATABASE_URL`.
3. **Set the other two environment variables** on the service: generate
   `SESSION_SECRET` and `ADMIN_PASSWORD_HASH` the same way as in local
   setup, and add them in the Railway dashboard (Variables tab) — never
   commit them.
4. **`railway.json`** is already in the repo and runs
   `npm run db:migrate` as a `preDeployCommand` before every deploy, so
   schema changes ship automatically. It does **not** run `db:seed` — that
   stays a one-off you trigger yourself (`railway run npm run db:seed`),
   since it's meant to seed once, not on every deploy.
5. **First deploy:** after it goes live, run the seed once:
   ```bash
   railway run npm run db:seed
   ```
6. **Set your admin password:** if you haven't already, generate
   `ADMIN_PASSWORD_HASH` locally and set it as a Railway variable, then
   visit `https://<your-app>/admin/login`.

## Project screenshots

Put images in `public/projects/` and pass `image="/projects/x.png"` to
`<PictureSlot />` in `components/sections/Projects.tsx`, or upload them from
`/admin/projects` once that's wired to file storage (not included yet —
currently the public site's picture slots are a client-only preview, not
persisted).

## Other assets

`public/images/hero.png` — transparent hero cutout. `public/images/frame-*.jpg`
— section background photos. `public/video/projects-bg.mp4` — Projects
section background video. `data/icons.ts` — brand icon paths (Simple Icons,
CC0).
