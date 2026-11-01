# Portfolio redesign outcomes

- [x] **Light/dark mode:** visible theme control, system preference fallback, persisted choice, and readable text/borders/cards/forms/focus states in both modes.
- [x] **Attractive, product-led imagery:** real images from Deborah, Negus Gebeya, TenaSew, and EthioVista; no placeholder showcase imagery in project cards; useful alt text.
- [x] **Verified project index:** Deborah, Negus Gebeya, TenaSew, and EthioVista each show live URL, source URL where present, status, role/contribution, stack, and case-study link. No EthioVista repository link is fabricated.
- [x] **Deborah flagship case study:** student experience, exam-preparation workflow, question bank/practice, progress loop, auth/AI/payment boundaries, architecture, contribution, and current QA evidence with live/repository/QA links.
- [x] **Negus Gebeya case study:** buyer/seller workflow, listing/media, trust, messaging, orders/payments, AI/live-selling boundaries, architecture, frontend/backend repositories, and live URL.
- [x] **TenaSew case study:** content, habits/progress, onboarding, auth/session boundary, bounded AI, architecture, deployment evidence, and pre-launch gaps.
- [x] **EthioVista case study:** public production overview for destinations, stays, experiences, services, trip planning, multilingual entry points, and AI-in-development status; missing source repository is stated.
- [x] **One-page CV:** generated and exposed at `/bereda-wako-cv.pdf` from header, hero, About, and footer.
- [x] **Relevant experience and individual contributions:** About section, card contribution lines, and case-study sections for workflow, architecture, and integrations.
- [x] **Technical writing and testing evidence:** Proof section links to Deborah release-readiness/QA documents and TenaSew architecture/deployment notes.
- [x] **Books catalog and admin:** Admin can create, update, and delete book records with author, category, description, optional public cover and external book URL, and draft/published status; public `/books` shows published books only and has clear empty/error states; admin mutations require the existing session and same-origin protections; no in-app payment or private-file delivery is presented as configured without an implemented provider. Deployed and smoke-tested on Render and Vercel; no real titles were supplied or seeded.
- [x] **Video publishing:** Admin can create, edit, and delete video records with title, description, slug, optional duration, a validated YouTube/Vimeo/direct MP4 or WebM URL, and draft/published status; public `/videos` embeds only published records and has clear empty/database-unavailable states; mutations require the existing admin session and same-origin protection; no upload or storage provider is claimed as configured.
- [x] **Written-content publishing:** Admin can create, edit, and delete articles with title, slug, category, summary, body, and draft/published status; `/content` lists and `/content/:slug` renders published entries only; drafts remain private; public pages have clear empty/database-unavailable states; mutations require the existing admin session and same-origin protection; no sample article is invented.
- [x] **Client next step:** “Tell me about your project.” plus discovery, MVP scope, deliverables, estimated-scope conversation, proposal path, and no fixed-price promise.
- [x] **Homepage hero refresh:** preserve the existing navbar; customize the hero with a dark green editorial panel, personal headline, regenerated transparent laptop portrait using the supplied face, content-driven responsive image sizing, gold/mint accents, responsive CTAs, no selected-build card, no outer border/margin space, and verified proof-oriented metrics instead of copying the reference image literally.
- [x] **Deployment confirmation:** pushed commit `49b1e43588641fc00c3a758cfb7df8f2010bf62c` to the existing GitHub remote; Render deployment is live and both public Books routes serve the new catalog.
- [ ] **EthioVista source handoff:** add a direct repository link and deeper source-based evidence when the owner supplies the missing repository.

## Latest Books release verification
- Commit `49b1e43588641fc00c3a758cfb7df8f2010bf62c` is live on Render (`dep-dbjps6bncjis73dsntl0`) and the Vercel Books route serves the same new catalog.
- `/books` returns HTTP 200 with the expected empty-catalog state on both hosts; the database-backed route reports no connection/migration error.
- `GET /api/admin/books` returns HTTP 401 without a session on both hosts, confirming the admin endpoint is not public.
- No actual book records were added; the owner can add real titles from `/admin/books`.
