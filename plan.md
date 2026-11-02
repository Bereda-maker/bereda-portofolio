# Portfolio redesign plan

## Goal
Turn the portfolio into an evidence-led product engineering site that makes the next client conversation obvious. Use only verified products and live/source links: Deborah, Negus Gebeya, TenaSew, and EthioVista. Do not fabricate a GitHub link for EthioVista because its source repository was not included in the connected GitHub account.

## Implementation

- Keep the existing Next.js App Router and component structure.
- Make `data/content.ts` the authoritative public content model with live URL, source URL, real image, contribution, workflow, architecture, integrations, verification, and next-step notes.
- Keep public project loading static so old database seed placeholders cannot override verified showcase content.
- Add a rich dynamic project route at `/projects/:slug-or-id` with case-study sections and evidence links.
- Add a one-page PDF CV at `public/bereda-wako-cv.pdf` and expose it in the header, hero, About section, and footer.
- Add a client-side persisted light/dark theme toggle with system preference fallback.
- Refresh the visual system with CSS variables, an editorial grid, image-led cards, warm paper/forest/gold light mode, and low-glare charcoal/green dark mode.
- Refresh only the homepage hero toward the supplied reference direction: preserve the existing navbar, use a dark green editorial panel with gold/mint accents, a personalized headline, the existing portrait, and verified proof-oriented metrics rather than copying the reference literally.
- Keep the contact endpoint and transparent mailto fallback, but remove fixed price bands; ask for stage and scope instead.
- Expand `/journey` into MVP scoping, architecture, integration, deployment, maintenance, and deliverables guidance.

## Design

Three options were considered: editorial product journal (0.05), dark dashboard casebook (0.06), and warm brutalist studio (0.04). Chosen: **editorial product journal**.

The movement is a quiet editorial casebook with large typography, evidence cards, and product imagery. The principles are to make the workflow legible, show proof next to the claim, keep hierarchy calm, and use motion only to orient. Warm paper and forest green signal grounded craft in light mode; charcoal, muted green, and soft gold preserve warmth in dark mode. Long-form narrative sections use asymmetric splits and wide image-led project cards rather than dense dashboard tiles. Gold status dots, rounded image cards, and direct live/source/evidence links are the signature elements.

The interaction philosophy is simple: every card has a useful action and every external claim has a path to inspect it. The single-settle hero entrance and subtle image scale have reduced-motion fallbacks. Bricolage Grotesque handles headings and controls; Newsreader handles body copy. Brand voice is clear, practical, and honest: “Complete products, real workflows.” and “A good handoff is part of the build.”
The homepage hero now acts as a compact proof surface: “Hi, I’m Bereda Wako” introduces the person, a regenerated transparent laptop portrait uses the supplied face, and the bottom rail uses only verified portfolio signals (04 showcased products, end-to-end ownership, and linked QA evidence). The image stage uses responsive aspect ratios instead of a restrictive fixed height so the full profile remains visible from 320px mobile through desktop. The hero is full-bleed without an outer border or card margin, and the existing navbar remains unchanged.

## Structure and serving

`app/(site)/page.tsx` composes the homepage and person structured data. `app/(site)/projects/[slug-or-id]/page.tsx` renders case studies. `app/(site)/journey/page.tsx` explains delivery. `components/sections` owns Hero, Work, Capabilities, Proof, About, and Contact. `components/SiteChrome.tsx` and `components/ThemeToggle.tsx` own navigation, CV access, and theme state. `data/content.ts` owns the verified project records. `public/images/projects` owns real assets copied from the products or their live production bundle. `public/bereda-wako-cv.pdf` is the one-page downloadable CV.

The site remains a Next.js App Router application and can deploy through the existing Vercel project. The public showcase does not depend on the placeholder project database. The existing contact API remains the first delivery path; mailto is retained as a transparent fallback.


## Books feature implementation
Reuse the existing Next.js App Router, Drizzle `books` and `categories` tables, and the portfolio admin session/same-origin guards. Add server-validated CRUD API routes and an admin workspace for title, author, category, description, optional public cover URL, optional external book URL, and draft/published status. The public `/books` route reads only published records and provides readable empty/database-unavailable states. Book metadata remains in the existing schema; optional display URLs are stored in `books.metadata`, so no database migration is needed. Preserve the existing admin visual system. This scope provides catalog publishing only: it does not claim checkout, payment verification, protected digital-file delivery, or uploads are configured; those require a chosen provider, credentials, and separate implementation.


## Videos and written-content implementation
Reuse the existing `videos` table for title, slug, description, duration, publication status, and a validated provider/source identifier. Admin input accepts YouTube, Vimeo, or direct MP4/WebM HTTPS URLs; only known embed hosts or direct media URLs are rendered, with no upload provider required. Build protected create/list/update/delete API routes using the existing admin session and same-origin guard. For small portfolio articles, store each `portfolio-content:<slug>` entry as a validated JSON value in the existing unique-key `site_settings` table rather than adding a migration; keep that namespace isolated from unrelated settings and document it as a small-site content store. Add admin editors at `/admin/videos` and `/admin/content`, public published-only views at `/videos`, `/content`, and `/content/:slug`. Keep the sitemap to static public collection routes so builds never require `DATABASE_URL`; the public content index links to published article details. Reuse the existing admin theme and editorial public styles. Empty content remains empty until the owner supplies real videos and writing; drafts are never exposed. This MVP does not include file uploads, arbitrary iframe embeds, revisions, or approval workflows.


## Experience imagery and detail views
Keep the experience source of truth in `EXPERIENCE` within `data/content.ts`; add stable slugs, per-entry image/alt text, verified detail bullets, and only the relevant links already supported by the CV and project records. Store four distinct editorial illustrations under `public/images/experience` so the visuals are role-relevant without suggesting they are actual employer or campus photographs. Update `components/sections/About.tsx` to show an image-led, responsive card for every entry and a clear “View details” link. Add a static `/experience/[slug]` page that reads the same data, renders the matching image and full verified context, and links the startup-builder entry to existing case studies. Use the current navy/blue/gold editorial visual system; do not add dates, quantified outcomes, or responsibilities absent from the verified content. Add the dynamic route pattern to the route manifest and each known slug to the static sitemap; no database or new dependency is needed.
