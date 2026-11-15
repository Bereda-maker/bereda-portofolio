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

`app/(site)/page.tsx` composes the homepage and person structured data. `app/(site)/projects/[slug-or-id]/page.tsx` renders case studies. `app/(site)/journey/page.tsx` explains delivery. `components/sections` owns Hero, Work, Capabilities, Proof, About, and Contact. `components/SiteChrome.tsx` and `components/ThemeToggle.tsx` own navigation, CV access, and theme state. `data/content.ts` owns the verified project records. `public/images/placeholder.png` owns real assets copied from the products or their live production bundle. `public/bereda-wako-cv.pdf` is the one-page downloadable CV.

The site remains a Next.js App Router application and can deploy through the existing Vercel project. The public showcase does not depend on the placeholder project database. The existing contact API remains the first delivery path; mailto is retained as a transparent fallback.


## Books feature implementation
Reuse the existing Next.js App Router, Drizzle `books` and `categories` tables, and the portfolio admin session/same-origin guards. Add server-validated CRUD API routes and an admin workspace for title, author, category, description, optional public cover URL, optional external book URL, and draft/published status. The public `/books` route reads only published records and provides readable empty/database-unavailable states. Book metadata remains in the existing schema; optional display URLs are stored in `books.metadata`, so no database migration is needed. Preserve the existing admin visual system. This scope provides catalog publishing only: it does not claim checkout, payment verification, protected digital-file delivery, or uploads are configured; those require a chosen provider, credentials, and separate implementation.


## Videos and written-content implementation
Reuse the existing `videos` table for title, slug, description, duration, publication status, and a validated provider/source identifier. Admin input accepts YouTube, Vimeo, or direct MP4/WebM HTTPS URLs; only known embed hosts or direct media URLs are rendered, with no upload provider required. Build protected create/list/update/delete API routes using the existing admin session and same-origin guard. For small portfolio articles, store each `portfolio-content:<slug>` entry as a validated JSON value in the existing unique-key `site_settings` table rather than adding a migration; keep that namespace isolated from unrelated settings and document it as a small-site content store. Add admin editors at `/admin/videos` and `/admin/content`, public published-only views at `/videos`, `/content`, and `/content/:slug`. Keep the sitemap to static public collection routes so builds never require `DATABASE_URL`; the public content index links to published article details. Reuse the existing admin theme and editorial public styles. Empty content remains empty until the owner supplies real videos and writing; drafts are never exposed. This MVP does not include file uploads, arbitrary iframe embeds, revisions, or approval workflows.


## Experience imagery and detail views
Keep the experience source of truth in `EXPERIENCE` within `data/content.ts`; add stable slugs, per-entry image/alt text, verified detail bullets, and only the relevant links already supported by the CV and project records. Store four distinct editorial illustrations under `public/images/placeholder.png` so the visuals are role-relevant without suggesting they are actual employer or campus photographs. Update `components/sections/About.tsx` to show an image-led, responsive card for every entry and a clear “View details” link. Add a static `/experience/[slug]` page that reads the same data, renders the matching image and full verified context, and links the startup-builder entry to existing case studies. Use the current navy/blue/gold editorial visual system; do not add dates, quantified outcomes, or responsibilities absent from the verified content. Add the dynamic route pattern to the route manifest and each known slug to the static sitemap; no database or new dependency is needed.

## Your Life AI implementation
Add one protected `/admin/life-ai` workspace and one `Your Life AI` sidebar item; do not split the experience into separate assistants. Reuse the existing admin shell/theme and server-side admin session. Persist owner-scoped conversations and messages in dedicated Postgres tables, with a small consent-controlled context settings table. Expose protected conversation CRUD and chat endpoints with Zod validation, same-origin checks for mutations, bounded history, rate limiting, and server-only provider credentials. Route chat through the existing provider abstraction, support the configured OpenAI-compatible or Anthropic provider, record usage status, and keep private message content out of ordinary logs. The initial context layer is read-only and approval-first: planning/calendar context is opt-in, journal/financial/relationship categories default off, and the assistant must label assumptions and never execute actions. The client provides searchable conversation history, suggested prompts, markdown/code rendering, copy, clear-with-confirmation, multiline input, responsive mobile layout, loading/error states, and an explicit context settings panel. Add the route manifest entry and a forward-only migration; no public visitor route is created.

### Your Life AI design
The workspace uses the existing dark dashboard design system as a calm “private studio”: a focused conversation column, a quiet history rail, blue action accents, gold attention states, and generous readable message spacing. The single assistant identity is reinforced by a soft gradient brain mark, a compact context-consent strip, and prompt cards grouped by life area without creating separate agents. Motion is limited to message entrance and loading shimmer, with reduced-motion support. Copy is grounded and non-clinical: “Bring me the real shape of your week.” and “I’ll make suggestions, not assumptions.”


## Hackathons management implementation plan

### Findings from the repository inspection

The application is a Next.js 14 App Router project with a password-protected single-admin dashboard. `app/admin/(protected)/layout.tsx`, `lib/auth.ts`, and `lib/same-origin.ts` already provide the session and CSRF boundaries to reuse. The admin shell and navigation live in `components/admin/AdminShell.tsx` and `components/admin/nav.ts`; styling is defined by `app/admin/admin.css` with Tailwind utility classes used inside existing workspaces.

The data layer is Drizzle/Postgres (`lib/schema.ts`, `lib/db.ts`, and forward-only SQL files in `drizzle/`). The existing `opportunities` domain is an evidence-first job and outreach workflow backed by candidate profiles, source evidence, match scores, research runs, drafts, and tracked applications. It is useful infrastructure, but its fields and statuses do not represent hackathon dates, prizes, team rules, or eligibility evidence, so hackathons will use dedicated tables rather than overloading job records.

AI calls already go through the server-only `lib/services/providers.ts` abstraction. Your Life AI is implemented as a protected streaming chat at `app/api/admin/life-ai/chat/route.ts`, with deterministic server-side resource tools and persisted conversations. Hackathon actions will follow the same pattern: server-side provider calls, structured Zod validation, bounded requests, persisted evidence, and no claims beyond retrieved source material.

No repository changes have been made for the feature yet, and no GitHub push will be performed without explicit instruction.

### Proposed architecture

1. **Domain schema and persistence**
   - Add a forward-only migration and Drizzle declarations for `hackathon_profiles`, `hackathon_startup_profiles`, `hackathons`, `hackathon_evidence`, `hackathon_matches`, and `saved_hackathons`.
   - Store the owner profile as a single admin-owned record with verified skills, proficiency/interest weights, experience level, location/accessibility preferences, and editable matching preferences.
   - Store the five requested startup profiles as editable seeded records: Deborah School, TenaSew, EthioVista, Negus Gebeya, and Personal / General.
   - Store normalized opportunity fields separately from evidence: organizer, themes, format, location, country eligibility, deadline, event dates, prize/cost, team requirements, official URL, registration URL, verification timestamp, and an explicit verification state for unavailable fields.
   - Enforce uniqueness on a normalized canonical URL/source identity so repeated discovery cannot create duplicate saved opportunities. Use a separate saved-record uniqueness constraint for `(owner, hackathon)`.
   - Store tracking status, notes, application details, project idea, team information, and user-entered deadlines in the saved-hackathon record. Use the requested statuses exactly: Saved, Interested, Preparing, Applied, Accepted, Participating, Completed, Rejected, Expired.

2. **Discovery and evidence-first AI service**
   - Add `lib/services/hackathon-discovery.ts` and a source registry that distinguishes verified feeds/APIs from manual browse-only sources. The initial automated path will accept approved public source URLs/feeds and an optional configured search integration; it will never scrape sources whose terms or robots policy prohibit automated reuse.
   - Normalize and deduplicate source records before persistence. Preserve the original official URL and registration URL, capture a bounded excerpt, source title/publisher, and retrieval timestamp.
   - Use the existing AI provider only to extract and explain facts present in retrieved text. The structured extraction contract will use null/unknown values for missing fields and will reject malformed or unsupported URLs. Every rendered field will retain an evidence/verification state so “not listed” and “not verified” remain visible.
   - Treat Ethiopia eligibility as a three-state result (`allowed`, `not_allowed`, `unknown`) backed by source evidence; do not infer permission from an online format alone.
   - Calculate a deterministic 0–100 score in a dedicated scorer with visible components for technical alignment, startup/project relevance, eligibility, experience/difficulty, accessibility, and interests. AI may produce a concise explanation, but it cannot replace the bounded scoring inputs.

3. **Protected API surface**
   - Add authenticated, same-origin-protected route handlers under `/api/admin/hackathons` for profile/startup-profile CRUD, discovery, list/detail, save/unsave, status updates, notes/tracking updates, and recommendations.
   - Validate all URL, date, enum, string-length, array, and numeric inputs with Zod. Keep provider keys and fetches server-side. Add rate limiting and usage logging consistent with the existing AI routes.
   - Add secure assistant actions that query the persisted hackathon tables for saved deadlines, comparisons, application preparation, and project-idea requests. Assistant responses must distinguish retrieved facts, user-entered notes, and suggestions; consequential actions remain approval-first.

4. **Admin interface**
   - Add a Trophy icon navigation item labelled `Hackathons`, with nested route sections for Discover Hackathons, Saved Hackathons, Applications & Tracking, and AI Recommendations. Keep the existing shell and responsive behavior.
   - Build a `HackathonsWorkspace` and focused child components rather than one oversized component. Reuse `AdminPageHeader`, `EmptyAdminState`, form classes, notices, buttons, and loading/error patterns already used by the Opportunities workspace.
   - Discovery controls will select one startup profile or all five, apply filters such as online/hybrid/in-person, free/paid, deadline window, and Ethiopia eligibility, then show source and verification warnings.
   - Cards will show organizer, themes, selected profile, transparent score breakdown, eligibility/accessibility, deadlines, dates, prizes/costs, team requirements, official links, and last verified timestamp. Actions: save, view details, open registration source.
   - Saved/tracking views will provide the requested status pipeline, notes, application fields, project ideas, team data, deadline reminders, and empty/failure states. Profile preferences will be editable without changing verified professional source data.

5. **Your Life AI integration**
   - Extend the existing deterministic tool-planning layer with hackathon intents rather than creating a second assistant. The server will detect or plan only bounded actions such as `discover_hackathons`, `list_saved_hackathons`, `compare_hackathons`, `prepare_application`, and `suggest_project_idea`.
   - Tool results will be passed to the model as structured, source-backed context. The assistant will not invent links, dates, prizes, eligibility, or registration details and will say when the database or source evidence is unavailable.
   - Persist only the existing conversation/messages plus usage metadata; hackathon mutations will occur through explicit protected API actions, not arbitrary model-generated SQL or client-side database access.

6. **Notifications and calendar reuse**
   - First inspect the existing notification/calendar capabilities at implementation time. Reuse `calendar_tasks`/calendar planning if it supports reminders without inventing an email provider. If no suitable reminder execution path exists, expose upcoming-deadline views and document the remaining provider/scheduled-task configuration instead of claiming notifications are active.

### Main files expected to change

- `lib/schema.ts` and a new `drizzle/00xx_hackathons.sql` migration for the dedicated schema.
- New domain/service modules under `lib/hackathons.ts`, `lib/services/hackathon-discovery.ts`, `lib/services/hackathon-scoring.ts`, and source/validation helpers.
- New protected pages under `app/admin/(protected)/hackathons/` and API routes under `app/api/admin/hackathons/`.
- `components/admin/nav.ts` plus new `components/admin/HackathonsWorkspace.tsx` and focused profile, discovery, saved, tracking, and recommendation components.
- `app/admin/admin.css` only where existing tokens/components are insufficient; prefer existing utility classes and theme variables.
- `app/api/admin/life-ai/chat/route.ts`, `lib/life-ai-tool-plan.ts`, and related schemas for secure assistant integration.
- `.env.example`, `README.md`, `TODO.md`, and `public/manus-routes.json` for configuration, operating notes, acceptance status, and route discovery.

### External integrations and configuration boundaries

The feature requires a server-side AI provider already supported by `AI_PROVIDER`, `AI_API_KEY`, `AI_BASE_URL`, and `AI_MODEL`. Automated hackathon discovery additionally needs either an approved public source/feed set implemented in the source registry or a configured search integration whose terms permit server-side retrieval; source URLs alone are not treated as proof. No API key will be exposed to the browser. Calendar/reminder integration will remain explicitly marked as unavailable until an existing configured provider or scheduled execution path is confirmed.

### Delivery and validation

Implementation will preserve the current admin-only session and same-origin protections, add forward-only migrations, and include unit tests for normalization/deduplication, Ethiopia eligibility states, score component calculations, status transitions, and structured AI extraction rejection. After implementation, run the existing tests plus TypeScript, migration generation/checks, and production build. The final report will list modified files, migration details, integrations required, commands/results, and any remaining configuration. Changes will remain local until explicitly asked to push to GitHub.


## Opportunities redesign implementation

The protected Opportunities workspace remains backed by the existing profile, opportunity, evidence, match, draft, tracker, and tracked-application APIs. The client now presents a tabbed career command center with Overview, Discover, Pipeline, Intelligence, Application Studio, Outreach, Goals & Analytics, Candidate Profile, and Settings surfaces. All overview and analytics values are derived from the records loaded by the existing page loader; unavailable evidence is labeled rather than inferred. Existing research, discovery, scoring, approval/rejection, draft, copy/delete, application, tracker, profile-save, and delete actions are preserved.

### Opportunities design

Chosen movement: **evidence-led AI operations desk**. It uses compact Linear/Vercel-like density, navy surfaces, blue action accents, green readiness states, and gold attention states. Principles: show the source beside the claim, keep human approval visible, make the next action obvious, and preserve readable responsive behavior. The layout uses a command header, horizontal accessible tabs, metric rail, two-column briefing surfaces, responsive opportunity cards, Kanban-style status columns, and a selected-record detail panel. Motion is limited to small state transitions and includes a reduced-motion fallback. Candidate profile and settings stay deliberately operational; no unsupported provider controls or secret values are exposed.
