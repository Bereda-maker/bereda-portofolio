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
- Keep the contact endpoint and transparent mailto fallback, but remove fixed price bands; ask for stage and scope instead.
- Expand `/journey` into MVP scoping, architecture, integration, deployment, maintenance, and deliverables guidance.

## Design

Three options were considered: editorial product journal (0.05), dark dashboard casebook (0.06), and warm brutalist studio (0.04). Chosen: **editorial product journal**.

The movement is a quiet editorial casebook with large typography, evidence cards, and product imagery. The principles are to make the workflow legible, show proof next to the claim, keep hierarchy calm, and use motion only to orient. Warm paper and forest green signal grounded craft in light mode; charcoal, muted green, and soft gold preserve warmth in dark mode. Long-form narrative sections use asymmetric splits and wide image-led project cards rather than dense dashboard tiles. Gold status dots, rounded image cards, and direct live/source/evidence links are the signature elements.

The interaction philosophy is simple: every card has a useful action and every external claim has a path to inspect it. The single-settle hero entrance and subtle image scale have reduced-motion fallbacks. Bricolage Grotesque handles headings and controls; Newsreader handles body copy. Brand voice is clear, practical, and honest: “Complete products, real workflows.” and “A good handoff is part of the build.”

## Structure and serving

`app/(site)/page.tsx` composes the homepage and person structured data. `app/(site)/projects/[slug-or-id]/page.tsx` renders case studies. `app/(site)/journey/page.tsx` explains delivery. `components/sections` owns Hero, Work, Capabilities, Proof, About, and Contact. `components/SiteChrome.tsx` and `components/ThemeToggle.tsx` own navigation, CV access, and theme state. `data/content.ts` owns the verified project records. `public/images/projects` owns real assets copied from the products or their live production bundle. `public/bereda-wako-cv.pdf` is the one-page downloadable CV.

The site remains a Next.js App Router application and can deploy through the existing Vercel project. The public showcase does not depend on the placeholder project database. The existing contact API remains the first delivery path; mailto is retained as a transparent fallback.
