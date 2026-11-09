#import "report-theme.typ": report-theme

#let ink = rgb("#1c1f1b")
#let muted = rgb("#5c6459")
#let forest = rgb("#185c44")
#let gold = rgb("#d9a32d")
#let rule = rgb("#cfc9bc")
#let panel = rgb("#f0ece4")

#show: report-theme.with(
  title: "Bereda Wako — CV",
  author: "Bereda Wako",
  rhythm: "longform",
  body-size: 9.2pt,
  paragraph-spacing: 3.8pt,
  running-header: true,
)
#set page(margin: (top: 1.35cm, bottom: 1.25cm, x: 1.55cm))
#set text(font: ("Noto Sans", "DejaVu Sans"), size: 9.2pt, fill: ink, lang: "en", region: "us")
#set par(justify: false, leading: .98em, spacing: 3.8pt, first-line-indent: 0pt)
#set heading(numbering: none)

#let section(title) = {
  v(0.68em)
  block(width: 100%, above: 0pt, below: 0.4em)[
    #text(font: "Noto Sans", size: 8.2pt, weight: "bold", fill: forest, tracking: 0.08em)[#upper(title)]
    #line(length: 100%, stroke: 0.65pt + rule)
  ]
}
#let pill(label) = box(fill: panel, radius: 3pt, inset: (x: 5pt, y: 3pt))[#text(size: 7.7pt, fill: forest)[#label]]
#let bullet(body) = [#h(0.65em) #text(fill: forest)[•] #body]
#let role(title, org, meta: none, body) = {
  grid(columns: (1fr, auto), gutter: 8pt,
    [#text(font: "Noto Sans", weight: "bold", size: 10pt)[#title] #h(0.3em) #text(fill: gold)[—] #h(0.3em) #text(fill: forest, weight: "bold")[#org]],
    if meta != none { align(right)[#text(size: 8pt, fill: muted)[#meta]] } else { [] },
  )
  body
}

#grid(columns: (1fr, auto), gutter: 12pt,
  [
    #text(font: "Libertinus Serif", size: 27pt, weight: "bold", fill: forest)[Bereda Wako] \
    #text(size: 10pt, fill: muted)[Full-stack product engineer · Product builder]
  ],
  align(right)[
    #text(size: 8pt, fill: muted)[Ethiopia · Remote] \
    #link("mailto:beriwako56@gmail.com")[beriwako56\@gmail.com] \
    #link("https://github.com/Bereda-maker")[github.com/Bereda-maker] \
    #link("https://bereda-dev.vercel.app")[bereda-dev.vercel.app]
  ],
)
#line(length: 100%, stroke: 1.4pt + gold)

#section("Profile")
#text(size: 10.2pt)[Full-stack product engineer and founder who turns ambiguous workflows into useful, maintainable web products. I work across product definition, responsive interfaces, typed APIs, data models, authentication, integrations, QA, deployment, and handoff. My portfolio spans education, commerce, wellness, travel, and personal productivity products built for real users and practical operating contexts.]

#section("Core strengths")
#grid(columns: (1fr, 1fr, 1fr), gutter: 10pt,
  [#text(weight: "bold", fill: forest)[Product delivery] \ Product discovery, MVP definition, user journeys, responsive UI, content systems, and admin workflows.],
  [#text(weight: "bold", fill: forest)[Engineering] \ TypeScript, React, Next.js, APIs, PostgreSQL, Drizzle ORM, Hono, authentication, and integrations.],
  [#text(weight: "bold", fill: forest)[Shipping] \ Automated checks, release evidence, deployment configuration, production boundaries, and maintenance handoff.],
)

#section("Experience")
#role("Full-stack product engineer", "Independent product work", meta: "2023 — Present · Ethiopia / Remote", [
  #bullet[Shipped product workflows across education, commerce, wellness, and travel, including onboarding, authentication, search, content, practice, payments, messaging, progress, and administration.] \
  #bullet[Own the path from user problem and data model to typed API, responsive React interface, integration boundary, automated checks, deployment notes, and handoff.] \
  #bullet[Document evidence and limitations so a live demo, repository, and release-readiness note are clear about what is verified and what still needs staging or provider validation.]
])
#v(0.45em)
#role("CEO and startup builder", "EthioVista · Deborah · TenaSew · Negus Gebeya", meta: "Ethiopia-rooted products", [
  Lead products across travel, education, wellness, and commerce. Shape each venture from a local problem and user workflow through architecture, launch, iteration, and practical product communication.
])
#v(0.45em)
#role("Web Development Instructor", "Ethio Computer School", meta: "Teaching · Digital skills", [
  Taught web development through practical, project-led learning. Delivered instruction focused on building real projects rather than studying theory in isolation. #link("https://www.ethiocomputer.school/courses/web-development")[Course page] · #link("https://player.vimeo.com/video/1229693804?h=387686400")[Course VSL]
])
#v(0.45em)
#role("Marketing Manager", "Gezahegn and Elfinesh Hotel & Resort", meta: "Hospitality · Marketing", [
  Built experience in brand positioning, customer communication, and connecting a hospitality organization with its audience and service needs.
])

#section("Education & distinction")
#role("Bachelor of Science in Computer Science", "Hawassa University", meta: "Ethiopia", [
  Technical foundation in software engineering, systems thinking, product development, and data-oriented problem solving.
])
#v(0.45em)
#role("Gold medalist — Diploma Practical Theology", "Holistic Bible College", meta: "Across Ethiopia", [
  Recognized as a gold medalist in Diploma Practical Theology across all of Ethiopia.
])

#pagebreak()

#text(font: "Libertinus Serif", size: 20pt, weight: "bold", fill: forest)[Selected work & technical toolkit]
#text(size: 9.2pt, fill: muted)[Live product surfaces, documented engineering decisions, and evidence-led delivery.]

#section("Selected products")
#role("Deborah", "Grade 12 Education SaaS", meta: "web-cdry.vercel.app", [
  Learning and exam-preparation platform with notes, search, bookmarks, topic practice, timed exams, server scoring, progress, recommendations, achievements, AI study support, provider authentication, payments, and admin workflows. #link("https://github.com/Bereda-maker/dibo")[Repository] · #link("https://github.com/Bereda-maker/dibo/blob/main/docs/RELEASE_READINESS_REPORT.md")[Release evidence]
])
#v(0.42em)
#role("Negus Gebeya", "Ethiopian marketplace", meta: "negus-kappa.vercel.app", [
  Marketplace workflow for listings, seller profiles and trust signals, search, favorites, messaging, orders, Chapa checkout, seller earnings, AI-assisted merchandising, and live-selling route families. #link("https://github.com/Bereda-maker/negus-gebeya-frontend")[Frontend] · #link("https://github.com/Bereda-maker/negus-gebeya-backend")[Backend]
])
#v(0.42em)
#role("TenaSew", "Wellness platform", meta: "tenasew.vercel.app", [
  Wellness experience with content routes, preference-aware onboarding, habits, completions, progress, English/Amharic paths, authenticated sessions, and bounded non-diagnostic AI guidance. #link("https://github.com/Bereda-maker/TenaSew")[Repository]
])
#v(0.42em)
#role("EthioVista", "Ethiopia travel platform", meta: "ethio-vista.com", [
  Travel discovery experience covering destinations, stays, experiences, transport, guides, trip planning, service journeys, and an AI assistant marked as in development.
])

#section("Technical toolkit")
#grid(columns: (1fr, 1fr), gutter: 12pt,
  [
    #text(weight: "bold", fill: forest)[Frontend & product] \
    #v(0.25em)
    #pill("TypeScript") #h(0.25em) #pill("React") #h(0.25em) #pill("Next.js") \
    #v(0.25em)
    #pill("Tailwind CSS") #h(0.25em) #pill("Framer Motion") #h(0.25em) #pill("Responsive UI")
  ],
  [
    #text(weight: "bold", fill: forest)[Backend & delivery] \
    #v(0.25em)
    #pill("Node.js") #h(0.25em) #pill("Hono") #h(0.25em) #pill("PostgreSQL") \
    #v(0.25em)
    #pill("Drizzle ORM") #h(0.25em) #pill("MongoDB") #h(0.25em) #pill("Docker") \
    #v(0.25em)
    #text(size: 8pt, fill: muted)[Also: Python, FastAPI, Go, Bun, Redis, PHP, Laravel, Java, Spring Boot, C\#]
  ],
)

#section("Evidence & working style")
#grid(columns: (1fr, 1fr), gutter: 12pt,
  [
    #bullet[#link("https://github.com/Bereda-maker/dibo/blob/main/docs/RELEASE_READINESS_REPORT.md")[Deborah release-readiness report]] \
    #bullet[#link("https://github.com/Bereda-maker/dibo/blob/main/docs/QA_TEST_PLAN.md")[Deborah QA test plan]] \
    #bullet[#link("https://github.com/Bereda-maker/TenaSew/tree/main/docs")[TenaSew architecture and deployment notes]]
  ],
  [
    #text(weight: "bold", fill: forest)[What I bring] \
    #text(size: 8.7pt)[Clear product thinking, practical engineering, honest evidence, and a handoff path that helps a team continue without hidden dependencies.] \
    #v(0.25em)
    #text(weight: "bold", fill: forest)[Open to] \
    #text(size: 8.7pt)[Product engineering, MVP definition, platform work, and full-stack collaborations.] \
    #v(0.25em)
    #link("mailto:beriwako56@gmail.com")[beriwako56\@gmail.com] · #link("https://bereda-dev.vercel.app")[Portfolio]
  ],
)
