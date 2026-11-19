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

# Learning & Growth Management (2026-11)

## Implementation and structure

Add a separate protected `/admin/learning` workspace to this Next.js App Router application. Reuse the admin shell, `getSession`/`isAdminRequest`, same-origin write protections, PostgreSQL/Drizzle, and the existing server AI provider. Keep Learning separate from Experiences, Hackathons, Opportunities and Life AI. The workspace exposes Overview, All Learning, Calendar, My Reflections, Skills Growth, Certificates and Analytics routes.

Add normalized tables for learning experiences, participation status history, reflections, reusable skills, experience-skill relationships and labeled attachment references. The repository has no general authenticated binary-upload API; supporting materials therefore use validated external/document URL references until storage upload infrastructure is explicitly available. Add schema definitions in `lib/schema.ts`, additive SQL migration `drizzle/0020_learning.sql`, protected and Zod-validated API handlers in `app/api/admin/learning`, route pages in `app/admin/(protected)/learning`, a focused workspace in `components/admin/LearningWorkspace.tsx`, and feature styling in `app/admin/learning.css`. Update navigation and `public/manus-routes.json`.

Follow existing admin controls and responsive conventions with the requested Learning colors as feature-scoped accents and Fraunces/Inter font stacks. All analytics derive only from saved records; no fabricated or seeded statistics. Calendar uses recorded event dates. Optional AI analyses only user-entered content, prohibits inventing achievements or personal facts, and labels all generated text as editable suggestions separate from reflection fields.


# Personal Finance & Stewardship Management — proposed implementation plan

## Repository audit and scope

The current application is Next.js 14 App Router with protected admin routes, a single-admin session (`getSession().isAdmin`), Drizzle/Postgres, same-origin checks on mutations, an existing `media_assets` table, and an AI/storage provider abstraction. No personal finance tracker or finance transactions/income tables exist. The `life_ai_context_settings.finances` flag is only a consent toggle for Life AI context and will not be reused as a ledger. Add a separate protected Personal Finance area; do not connect to banks, execute investments, infer balances, or seed example transactions.

## Financial model and calculation integrity

- Store each amount as an integer count of its ISO currency's minor units (wire values use decimal-safe integer strings where DB precision exceeds JavaScript's safe range); never calculate money with binary floating-point.
- Keep currencies separate in all totals, charts, allocation budgets and reports. Default the owner's primary currency to ETB while permitting income/transactions in another validated currency. Validate codes against ICU's supported currency values (with ISO four-decimal fund currencies explicitly added) and use Intl currency fraction-digit metadata rather than assuming every currency has two decimal places.
- Preserve the two-stage allocation plan as versioned data: Stage 1 gives 10% of a received income to `GIVING`; Stage 2 distributes only the resulting 90% across the remaining categories at 30/30/15/10/10/5 percent. Persist the plan version and exact per-category minor-unit amounts for every allocation run. Use deterministic largest-remainder rounding with stable tie order so all category allocations plus giving reconcile exactly to the received amount, including tiny amounts.
- Only `RECEIVED` income is eligible. Create the income transition, linked income ledger entry, allocation run and category splits in one database transaction with unique idempotency constraints. Expected/cancelled income creates no available balance. Reprocessing is a no-op. Received-income edits/cancellations retain prior allocation snapshots and record an explicit new revision/adjustment rather than duplicating rows or silently overwriting history. Allocation-plan edits require a confirmed effective date and only affect future received income.
- Track expense, giving, transfer, savings contribution, investment contribution and income events separately. Transfers and contributions move category/account balances but are not new income or expense. Budgets compare planned category allocations with appropriate actual outflows; savings/investment balances derive from their own contribution/withdrawal ledger. Never combine different currencies into a single amount.

## Application architecture

- Add dedicated Drizzle tables and one forward-only migration for finance settings/plan versions, categories/subcategories, income records, versioned allocation runs and splits, transaction ledger, savings goals/contributions, investment records/contributions, and attachment references. Seed only the seven owner-approved default categories and percentages—no personal amounts or sample transactions.
- Add a server-side `lib/finance/` domain layer for exact money parsing/formatting, allocation arithmetic, plan validation, monthly-period boundaries, and ledger/balance reducers. API handlers call this layer; the browser never performs authoritative allocation or balance calculations.
- Add protected, Zod-validated and same-origin-guarded routes for settings/plans, income CRUD/status, transactions, budgets/category adjustments, goals, investments, reports/export and AI insights. Use database constraints and transactions for idempotency and relationships. Treat adjustment explanations and effective dates as required audit information.
- Add `/admin/finance` with Overview, Income, Allocation, Transactions, Budgets, Savings & Investments, Reports and Settings views; use the existing protected admin layout/navigation, responsive controls, cards, and empty/loading/error states. All KPIs/charts come from persisted records and selected currency/month.
- Integrate the existing `aiProvider` only for explicitly requested financial analysis using actual records; keep insights labeled as educational suggestions, prohibit invented balances/transactions and investment-return promises, and provide an explicit consent/data-scope setting. Do not expose provider credentials.
- Use the existing media/storage pathway for optional attachments when configured. Current `storageProvider` is unconfigured in this checkout; absent a configured durable upload path, support secure HTTPS or `/manus-storage/` attachment references and clearly state upload configuration is required instead of claiming uploads work.
- Implement monthly, quarterly and annual report views; offer CSV exports from real filtered ledger data and browser print-to-PDF, with no generated financial sample values.

## Project structure

`lib/schema.ts` and `drizzle/0022_personal_finance.sql` own normalized persistent records; `lib/finance/money.ts`, `summary.ts`, `report.ts`, `validation.ts`, `persistence.ts` and `api.ts` own deterministic money, summary, report, validation, transaction and access rules; `app/api/admin/finance/**` exposes guarded finance operations; `app/admin/(protected)/finance/**` provides the eight route views; `components/admin/PersonalFinanceWorkspace.tsx` and `app/admin/finance.css` implement the responsive admin UI; `components/admin/nav.ts` and `public/manus-routes.json` register the feature; focused tests cover allocation/reconciliation, currency precision, request validation, summary/report accounting and historical category visibility. Existing Learning, Life AI, opportunities, and other admin areas remain independent.

## Design proposal for confirmation

Use a quiet “stewardship ledger” rather than a generic bank dashboard: editorial header and clear amount hierarchy, simple category allocation bars, a chronological transaction ledger, and restrained status cues. Preserve the existing admin shell/surface tokens and navy/blue/gold as the dominant palette, honoring the later request to keep this visually close to the existing admin. Use the brief's #1B4332, #2D6A4F, #D4A437, #C1693C and #FAF6EC only as restrained stewardship/category/status accents, with contrast-safe light/dark theme tokens. Keep the existing portfolio typography stacks (Newsreader/Bricolage fallbacks) rather than introducing a competing global typeface. Avoid decorative chart overload; use simple charts with transparent labels and no invented data. Desktop refinement: remove the inherited narrow admin-content cap only on Finance routes, place all eight finance destinations in a compact responsive local nav, give the KPI row the full content width, and arrange overview panels on a clear 12-column ledger canvas; collapse cleanly to a one-column reading order on small screens.

## Material constraints

This repository has no configured finance database credentials available for safe live writes and no configured file-upload provider in the current checkout. Implementation can add migrations and automated code/schema tests, but must not run the migration against the shared database or create fake financial records. Attachment references can be supported now; durable upload requires storage configuration. AI finance analysis is unavailable until the existing AI provider is configured, but its route/UI can report that honestly.


# Meals & Nutrition Management — proposed implementation plan

## Repository audit and boundaries

The repository is a Next.js App Router admin application with a single-admin signed session, same-origin mutation checks, PostgreSQL/Drizzle and additive SQL migrations. Personal Finance is a separate protected feature with its own ledger and migration. The existing storage provider is an unconfigured stub; the existing AI provider is server-side. Meals & Nutrition will have its own schema, APIs, routes, navigation entry and calculations. It will not reuse or alter finance allocations, or write finance transactions in the background.

## Data model and deterministic calculations

Add a forward-only `drizzle/0023_meals_nutrition.sql` migration and matching Drizzle tables/types for food catalog entries, independently versioned nutrient profiles, inventory lots/purchases, inventory adjustment/consumption ledger, private body profile, daily budget requests, meal plans and plan-item nutrition/cost snapshots, consumed-meal records, favorites, weight/measurement history, settings and optional Finance cross-links. Keep all profile, inventory, planning and meal-history APIs admin-only and validate every input server-side. Keep personal health/profile values out of ordinary logs and public routes. Add no sample foods, personal measurements, or fabricated nutrition data.

Use a separate `lib/meals/` domain layer. Represent monetary values as integer minor units with explicit currency precision; represent nutrition and servings with decimal-safe fixed-scale integer arithmetic and explicit units. Store the reference basis for each nutrient profile (per 100 g, per 100 ml, or named serving) and individual nutrient units. Preserve unknown/null distinctly from a measured zero. Do not infer a mass-to-volume or piece-to-weight conversion unless the user/source supplies a valid conversion, density or edible-weight value. Keep weight and piece count as separate inventory dimensions. Scale nutrients from the recorded edible quantity and preserve raw/cooked preparation, yield and edible-portion assumptions.

Track purchases as lots so remaining quantity and expiration are calculable. Record consumption and manual inventory adjustments as append-only events; updates must not erase historical meal or nutrition snapshots. Recommendations may use existing inventory only when it is available, unexpired and sufficient. Foods that could be purchased are shown in a separate candidate list and are never represented as owned stock.

The daily recommendation process is deterministic and explainable: first filter allergies/restrictions, expired/unavailable/insufficient stock, preparation and dietary preferences; then enumerate a bounded set of serving combinations for the requested number of meals; calculate their cost/nutrients from confirmed inputs; select affordable/diverse options using documented tie-breakers; and return lower-cost alternatives and any target shortfalls. A proposed plan does not reserve or deduct stock. The user explicitly accepts it, then separately confirms meals actually eaten; only confirmed consumption deducts inventory and becomes actual nutrition/spending. Replacements and serving edits immediately recompute from the same deterministic engine. Preserve the selected food/nutrition/cost snapshot even if the catalog is later edited.

## Personalization and health safeguards

BMI is informational only and must not diagnose, classify a person’s overall health, or determine a calorie target. For adults, display its screening limitations. Do not use adult BMI cutoffs for a minor; if an appropriate age-specific growth reference is not validated and implemented, show no BMI interpretation for minors. NASEM describes EER as a predictive estimate that varies by age, sex, height, weight, activity and life stage and includes prediction error; any adult target must identify the chosen equation, assumptions, units and uncertainty, and must not be presented as a prescription. Never infer macro targets without a named, validated framework.

For minors, pregnancy/breastfeeding, reported eating-disorder history or relevant medical conditions, do not provide prescriptive calorie/weight-loss targets or therapeutic diet recommendations. Keep food facts and general, nonrestrictive planning clearly distinguished from clinical guidance and direct users with individualized needs to a qualified clinician or registered dietitian. Do not promise weight change or label a plan nutritionally complete. Do not use a questionnaire or BMI to diagnose or rule out an eating disorder. Require explicit consent before sending any health/profile, allergy, food or meal-history information to AI; send only necessary data, keep requests out of ordinary logs, and label AI outputs as estimates rather than medical advice. The AI may explain calculated facts or alternatives, but it cannot invent, source, validate or calculate authoritative nutrient values or override deterministic safety filters.

## Food-data and upload choices

Manual entry is the guaranteed first-release path, including manual nutrition corrections, named reference serving, source, source date/version and a per-value provenance/confidence state. The official Ethiopian Food Composition Table 2025 is the preferred local reference; however public materials reviewed confirm a PDF and searchable tool, not a stable API, machine-readable schema or commercial reuse license. The app may link users to it and let them enter cited values; it will not bulk copy/import that table unless its data terms and permission are verified. Optional USDA FoodData Central lookup may be added behind a server-only API key and user confirmation. Imported entries retain FDC ID/data type, units/basis, serving weights, release/source date and attribution; missing values stay unknown and branded-label data are not presented as analytical measurements. Do not activate USDA calls without a configured key. Defer Open Food Facts ingestion pending ODbL/share-alike and database-reuse review. Label values and OCR/scanning remain manual-only until durable storage and a reviewable OCR capability are configured; never save an OCR guess as confirmed nutrition without user review.

## Finance and external integrations

Daily food budgets and spending analytics are Meals records, independent of Personal Finance. Personal Finance comparison/recording is opt-in and off by default. Create a unique link/idempotency relation between a confirmed meal-purchase event and its finance transaction. A transaction is created only after the user explicitly chooses “Record this purchase in Personal Finance”; no plan, inventory deduction or consumed meal silently triggers a ledger write. Repeated clicks/retries must return the linked transaction rather than duplicate it, and any edit/delete of a linked record must preserve finance transaction-history requirements. Do not send two copies of one actual purchase to the Finance ledger.

## Routes, views and design

Add a separate protected `/admin/meals` area with Overview, My Foods, Daily Meal Planner, Nutrition Tracking, Body Profile, Meal History, Food Spending and Settings views; register all page routes in `public/manus-routes.json` and add a standalone `Meals & Nutrition` item with a Utensils icon in the admin navigation. Implement domain APIs under `app/api/admin/meals/**`, shared validators and calculation utilities in `lib/meals/**`, the main client workspace in `components/admin/MealsNutritionWorkspace.tsx`, and styling in `app/admin/meals.css`. Keep each feature view responsive, with a simple date/budget/meal-count entry as the planner’s primary action. Use a desktop three-part hierarchy (compact section navigation, clear daily budget/plan workspace, supporting inventory/nutrition details), with mobile stacked flow and no unnecessary chart panels. Use the portfolio’s existing navy/blue/gold admin surface as the dominant theme; apply requested deep green `#1B4332`, forest `#2D6A4F`, gold `#D4A437`, terracotta `#C1693C`, warm cream `#FAF6EC` as restrained category/status accents. Use the existing Newsreader/Bricolage stacks with Fraunces/Inter only where already available or safely fall back; do not add competing site-wide typography.

## Project structure

`drizzle/0023_meals_nutrition.sql` and `lib/schema.ts` own normalized records and relational integrity. `lib/meals/` owns decimal-safe nutrition/cost calculations, serving/unit conversion, target estimation, inventory consumption and deterministic meal selection. `app/api/admin/meals/**` owns protected CRUD, daily planning, consumption, progress and exports. `app/admin/(protected)/meals/**` owns the eight views. `components/admin/MealsNutritionWorkspace.tsx` and `app/admin/meals.css` own the responsive UI. `components/admin/nav.ts` and `public/manus-routes.json` register the module. Focused unit/validation tests cover serving calculations, units, costs, stock/expiry, allergies/restrictions, budget limits, profile safeguards, substitutions, immutable historical snapshots and Finance idempotency. The migration is code-reviewed and tested, not applied to a shared database during development.

## Evidence used for safety and sources

NASEM’s 2023 Energy DRI describes EER as a predictive estimate with age/sex/height/weight/activity/life-stage inputs and uncertainty [1]. EFSA likewise reports equation uncertainty and population/life-stage assumptions [2]. NIDDK explicitly scopes its Body Weight Planner to adults 18+ and excludes pregnancy/breastfeeding [3]. WHO uses age-specific growth references for children and adolescents rather than adult BMI categories [4]; WHO also describes BMI as a population measure with limitations [5].

USDA FoodData Central documents its data types, API key, quota, units and provenance [6]. The Ethiopian Food Composition Table 2025 is listed by FAO and EPHI, but its public catalog/announcement does not establish a reusable API or commercial data license [7]. Open Food Facts documents community-data quality limitations, API limits and ODbL/licensing obligations [8].

[1]: https://www.ncbi.nlm.nih.gov/books/NBK591034/ "Dietary Reference Intakes for Energy, National Academies Press"
[2]: https://www.efsa.europa.eu/en/efsajournal/pub/3005 "Scientific Opinion on Dietary Reference Values for Energy, EFSA"
[3]: https://www.niddk.nih.gov/health-information/weight-management/body-weight-planner "Body Weight Planner, NIDDK"
[4]: https://www.who.int/tools/growth-reference-data-for-5to19-years/indicators/bmi-for-age "BMI-for-age, WHO Growth Reference 5–19 years"
[5]: https://www.who.int/news-room/fact-sheets/detail/obesity-and-overweight "Obesity and overweight, WHO"
[6]: https://fdc.nal.usda.gov/api-guide "FoodData Central API Guide, USDA"
[7]: https://www.fao.org/food-composition/tables-and-databases/detail/ethiopian-food-comporition-table/en "Ethiopian Food Composition Table 2025, FAO"
[8]: https://openfoodfacts.github.io/openfoodfacts-server/api/ "Open Food Facts API documentation"


### Adult energy-estimate implementation detail

The optional daily energy comparison uses the exact 2023 NASEM adult EER equations in Table S-3 only for ages 19+, with the user's selected female/male equation, one of the named PAL categories, height in centimetres and latest dated weight in kilograms. It requires explicit No for pregnancy/lactation and eating-disorder concern; a reported medical condition suppresses the estimate. No equation or activity category is inferred from an unspecified or ambiguous value. The EER is described as a weight-stability population estimate, is not adjusted for gain/loss goals, and its difference from recorded intake is never described as a deficit, surplus, adequacy finding or prescription. The UI reports the source's sample-average model SE figures with their context, explicitly not as a personalized interval; it states that individual uncertainty is large and intake-to-EER comparison alone does not establish adequacy. Macro/micronutrient targets remain unset unless a separate validated framework is implemented.

Sources used for this implementation detail: NASEM Table S-3, https://www.ncbi.nlm.nih.gov/books/NBK591034/table/tab_S_3/?report=objectonly; NASEM chapter 5 prediction-error and assessment discussion, https://www.nationalacademies.org/read/26818/chapter/7; Health Canada DRI equation table, https://www.canada.ca/en/health-canada/services/food-nutrition/healthy-eating/dietary-reference-intakes/tables/equations-estimate-energy-requirement.html; NIDDK adult/pregnancy scope, https://www.niddk.nih.gov/health-information/weight-management/body-weight-planner.
