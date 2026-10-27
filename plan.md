# Bereda Personal Developer Platform — Implementation Plan

## Current architecture

The repository is a Next.js 14 App Router application using TypeScript, Tailwind CSS, Framer Motion, Lucide icons, Drizzle ORM, and PostgreSQL. The public homepage is composed from reusable section components. A protected `/admin` area already supports password authentication, project CRUD, and contact-message management. Public projects load from Postgres with a static fallback when the database is unavailable. Contact submissions are validated, rate-limited, and persisted when Postgres is configured.

## Current working functionality

- Responsive public portfolio homepage with animated hero, about, services, projects, and contact sections.
- Project data loaded from Postgres with static fallback content.
- Password-protected admin area with session cookies.
- Admin project create, edit, and delete workflows.
- Admin contact-message read, unread, and delete workflows.
- Contact form validation, rate limiting, and persistence.
- Production build succeeds without a configured database by using safe fallback behavior.

## Missing from the specification

Books and protected digital delivery, customer accounts, verified payments, mentorship accounting, appointment availability, Google Calendar/Meet integration, video publishing, AI opportunity research, AI content drafting, newsletter consent, media storage, granular roles, audit logs, analytics, and their automated tests are not implemented yet. These require additional schema, storage, payment, email, calendar, and AI provider decisions; no external integration will be represented as connected until credentials and server-side verification are configured.

## Design direction

**Selected movement:** editorial field notes meets quiet technical confidence.

**Core principles:** personal before promotional; evidence before claims; generous space; motion that explains rather than decorates.

**Color philosophy:** forest green and charcoal establish trust and technical depth; warm cream keeps long-form reading comfortable; gold is reserved for actions, status, and moments of emphasis. The palette should feel distinctly personal and grounded, with subtle Ethiopian-inspired warmth rather than decorative cultural motifs.

**Layout paradigm:** asymmetric editorial compositions, tall narrative blocks, and project stories that alternate between text and media instead of a centered marketing grid.

**Signature elements:** numbered field-note labels, a small gold status marker, and project cards that read like build logs.

**Interaction philosophy:** every animation should reveal context, hierarchy, or progress. Avoid motion that delays access to content. Respect `prefers-reduced-motion`.

**Brand essence:** Bereda builds useful digital products, documents the journey, shares practical knowledge, and creates opportunities through technology. Personality: thoughtful, ambitious, generous.

**Brand voice:** direct, reflective, and specific. Example lines: “I build the parts that make ideas real.” and “The stack is the toolkit; curiosity is the operating system.”

## Implementation sequence

1. Foundation: consolidate tokens, metadata, navigation, accessibility, settings, and shared page primitives while preserving the working portfolio/admin flows.
2. Portfolio and media: add project detail routes, case-study fields, media records, galleries, and video metadata with admin editing.
3. Publishing: add books, categories, protected previews, payment-provider abstraction, verified webhooks, purchases, and customer access.
4. Mentorship and appointments: add student profiles, minute-level allowance ledger, pricing, availability, conflict-safe reservations, and calendar integration interfaces.
5. AI workspace: add candidate profile, traceable opportunity records, matching, editable drafts, provider abstraction, human approval, and daily limits.
6. Launch hardening: SEO, sitemap, privacy-conscious analytics, automated business-rule tests, security review, and deployment documentation.

## External configuration boundaries

The core portfolio must work without paid AI or payment credentials. Book checkout, protected file storage, email delivery, Google Calendar/Meet, and AI research require explicit environment variables and provider configuration. Until then, implement interfaces, validation, manual review states, and clear setup documentation rather than claiming live integration.
