# Bereda — Portfolio (Next.js 14 · TypeScript · Tailwind · Framer Motion · Lucide · Drizzle · Postgres)

A single-admin portfolio site: a public site backed by Postgres, plus a
password-protected `/admin` dashboard for editing projects and reading
contact messages — one repo, one Next.js app, deployed on Railway.

## Personalising the public site

The homepage copy lives in `components/sections/*.tsx` and `data/content.ts`. Before sharing the site widely:

- Replace `public/images/placeholder.svg` (set in `SITE.portrait`) with a real, natural photo of yourself.
- Set `SITE.linkedin` in `data/content.ts`; the LinkedIn links stay hidden while it is empty.
- Add real `demo` and `repo` URLs to each project (`"#"` means "not published yet" and the link is hidden). Keep `PROJECTS` plain JSON, because `scripts/seed.mjs` parses it.
- Edit `TECH_GROUPS` so the tool lists match how you actually work.
- Set `NEXT_PUBLIC_SITE_URL` on your host so canonical, sitemap and social-preview URLs use your real domain.
- The `/admin` area keeps its own dark theme in `app/admin/admin.css`.

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
| `GOOGLE_CLIENT_ID` | Google OAuth client ID for the calendar connection. |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret; server-only. |
| `GOOGLE_REDIRECT_URI` | Exact callback URL, such as `https://bereda-dev.vercel.app/api/calendar/google/callback`. |
| `GOOGLE_CALENDAR_ID` | Calendar to use for bookings, normally `primary`. |

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
- `/admin/books` — create, edit, and delete book catalog records with author,
  category, description, optional public cover/book-page URLs, and draft or
  published status. Published records appear on `/books`; drafts stay private.
  This catalog does not provide checkout, payment verification, file uploads,
  or protected digital downloads. The `books` and `categories` tables are in
  the existing Drizzle schema; apply pending migrations with `npm run db:migrate`
  if the admin API reports that those tables are missing.
- `/admin/videos` — manage video records using HTTPS YouTube, Vimeo, or direct
  MP4/WebM sources. `/videos` embeds published records only. Uploads and media
  storage are not configured.
- `/admin/content` — create, edit, and delete written entries with title, slug,
  category, summary, body, and draft/published status. Entries use namespaced
  JSON values in the existing `site_settings` table; `/content` and
  `/content/:slug` show only published content.
- `/admin/messages` — newest-first list of contact form submissions.
  Unread messages have a magenta left border; click a row to expand it;
  mark read/unread, delete, or mark everything read at once.
- `/admin/opportunities` — approval-first AI Opportunity & Outreach Agent.
  Save your candidate profile, paste a public opportunity or recruiting URL,
  review source evidence, inspect fit scores and gaps, approve or reject a
  match, and generate a personalized draft. The app never submits an
  application or sends outreach automatically.
- Session: a signed, `httpOnly` cookie (`portfolio_admin`, iron-session,
  7-day expiry). `middleware.ts` redirects any signed-out visit to
  `/admin/*` (except `/admin/login` itself) to the login page — it does not
  touch the public site, the API routes, or static assets.
- Every admin mutation (login, logout, and all `POST`/`PATCH`/`DELETE`
  calls under `/api/admin/*`) checks the session **and** that the request's
  `Origin` matches the site's own host, as a CSRF guard.

### Client appointment scheduler

- `/admin/appointments` connects Google Calendar, configures meeting types and
  weekly availability, and lists upcoming reservations.
- `/book` is the public booking page. Visitors choose a meeting type, date,
  available slot, name, email, and notes.
- Availability is checked server-side against weekly windows, existing
  appointments, blocked times, and Google Calendar free/busy data.
- A confirmed booking creates a Google Calendar event, sends the visitor an
  invitation through Google Calendar, and requests a Google Meet link.
- Register the exact `GOOGLE_REDIRECT_URI` under **Authorized redirect URIs**
  in Google Cloud Console. The integration uses the private Calendar scope
  `https://www.googleapis.com/auth/calendar` and keeps refresh tokens server-side.

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

`public/images/placeholder.svg` — transparent hero cutout. `public/images/placeholder.svg*.jpg`
— section background photos. `public/video/projects-bg.mp4` — Projects
section background video. `data/icons.ts` — brand icon paths (Simple Icons,
CC0).

## Backend foundation and integrations
The Drizzle schema also includes books/categories, videos, mentorship profiles/sessions/usage, appointments and availability, opportunities/companies/applications, newsletter subscribers, audit logs, site settings, and media assets. The additive migration in `drizzle/` does not recreate the existing `projects` or `messages` tables.

Typed domain helpers live under `lib/services/` for mentorship pricing/usage ledger entries, appointment conflict validation, and opportunity match scoring. Payment, storage, email, calendar, and AI provider abstractions intentionally return `setup_required` until the corresponding provider and credentials are configured; no credentials or sample records are included.

### AI Opportunity & Outreach Agent configuration

Apply the generated migration with `npm run db:migrate`, then configure an
OpenAI-compatible provider in the deployment environment:

```bash
AI_PROVIDER=openai
AI_API_KEY=your-server-side-key
AI_BASE_URL=https://api.openai.com/v1
AI_MODEL=gpt-4o-mini
```

Anthropic is also supported with `AI_PROVIDER=anthropic` and the corresponding
key/model. Research fetches only the public URL supplied by the admin, stores
the source URL and excerpt as evidence, scores the opportunity against the
saved profile, and keeps every match and outreach draft in `pending`/`draft`
state until a human approves it. Provider keys are never sent to the browser.
