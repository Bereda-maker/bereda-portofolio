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
#set page(margin: (top: 1.45cm, bottom: 1.35cm, x: 1.55cm))
#set text(font: ("Noto Sans", "DejaVu Sans"), size: 9.2pt, fill: ink, lang: "en", region: "us")
#set par(justify: false, leading: .98em, spacing: 3.8pt, first-line-indent: 0pt)
#set heading(numbering: none)

#let section(title) = {
  v(0.75em)
  block(width: 100%, above: 0pt, below: 0.4em)[
    #text(font: "Noto Sans", size: 8.2pt, weight: "bold", fill: forest, tracking: 0.08em)[#upper(title)]
    #line(length: 100%, stroke: 0.65pt + rule)
  ]
}
#let pill(label) = box(fill: panel, radius: 3pt, inset: (x: 5pt, y: 3pt))[#text(size: 7.7pt, fill: forest)[#label]]
#let bullet(body) = [#h(0.65em) #text(fill: forest)[•] #body]
#let role(title, org, meta: none, body) = {
  grid(columns: (1fr, auto), gutter: 8pt,
    [
      #text(font: "Noto Sans", weight: "bold", size: 10pt)[#title] #h(0.3em) #text(fill: gold)[—] #h(0.3em) #text(fill: forest, weight: "bold")[#org]
    ],
    if meta != none { align(right)[#text(size: 8pt, fill: muted)[#meta]] } else { [] },
  )
  body
}

#grid(columns: (1fr, auto), gutter: 12pt,
  [
    #text(font: "Libertinus Serif", size: 27pt, weight: "bold", fill: forest)[Bereda Wako] \
    #text(size: 10pt, fill: muted)[Full-stack product engineer · Founder · Educator]
  ],
  align(right)[
    #text(size: 8pt, fill: muted)[Ethiopia] \
    #link("mailto:beriwako56@gmail.com")[beriwako56\@gmail.com] \
    #link("https://github.com/Bereda-maker")[github.com/Bereda-maker] \
    #link("https://bereda-dev.vercel.app")[bereda-dev.vercel.app]
  ],
)
#line(length: 100%, stroke: 1.4pt + gold)

#section("Profile")
#text(size: 10.2pt)[Full-stack product engineer and startup builder who turns local problems into dependable web products. I work across product strategy, data models, APIs, responsive interfaces, integrations, QA evidence, deployment, and the handoff that helps a team keep moving. Based in Ethiopia and available for product, MVP, and platform work.]

#section("Experience")
#role("CEO and startup builder", "EthioVista · Deborah School · TenaSew · Negus Gebeya", meta: "Ethiopia-rooted startups", [
  Lead and build products across travel, education, wellness, and commerce. Shape each venture from local problem and user workflow through product architecture, launch, iteration, and evidence-backed delivery.
])
#v(0.45em)
#role("Web Development Instructor", "Ethio Computer School", meta: "Teaching · Digital skills", [
  Taught web development through practical, project-led learning. The official course is titled #emph[Learn Web Development Through Real Projects] at a school that describes itself as Ethiopia's leading digital skills school. #link("https://www.ethiocomputer.school/courses/web-development")[Course page] · #link("https://player.vimeo.com/video/1229693804?h=387686400")[Watch the course VSL]
])
#v(0.45em)
#role("Marketing Manager", "Gezahegn and Elfinesh Hotel & Resort", meta: "Hospitality · Marketing", [
  Worked in marketing for one of Ethiopia's largest hotel and resort operations, building experience in brand positioning, customer communication, and connecting an organization with its audience.
])
#v(0.45em)
#role("Full-stack product engineer", "Independent product work", meta: "2023 — Present · Ethiopia / Remote", [
  #bullet[Shipped product-shaped workflows across education, commerce, wellness, and travel: onboarding, auth, search, content, practice, payments, messaging, progress, and administration.] \
  #bullet[Own the boundary from user journeys and schemas to typed APIs, responsive React interfaces, integrations, automated checks, deployment notes, and maintenance handoff.]
])

#section("Education & distinction")
#role("Bachelor of Science in Computer Science", "Hawassa University", meta: "Ethiopia", [
  Computer Science degree from one of Ethiopia's leading universities, forming the technical foundation behind my product, systems, and software engineering work.
])
#v(0.45em)
#role("Gold medalist — Diploma Practical Theology", "Holistic Bible College", meta: "Across all of Ethiopia", [
  Recognized as a gold medalist in Diploma Practical Theology across all of Ethiopia.
])

#pagebreak()

#text(font: "Libertinus Serif", size: 20pt, weight: "bold", fill: forest)[Selected work & capabilities]
#text(size: 9.2pt, fill: muted)[A portfolio of live product surfaces, practical systems thinking, and evidence-led delivery.]

#section("Selected products")
#role("Deborah", "Education SaaS", meta: "web-cdry.vercel.app", [
  Grade 12 learning platform with notes, question bank, topic practice, timed exams, server scoring, progress, recommendations, achievements, AI study support, provider auth, payments, and admin workflows. #link("https://github.com/Bereda-maker/dibo")[Source repository]
])
#v(0.45em)
#role("Negus Gebeya", "Marketplace", meta: "negus-kappa.vercel.app", [
  Marketplace workflow for listings, seller trust, media uploads, search, favorites, messaging, orders, Chapa checkout, seller earnings, AI listing assistance, and live selling. #link("https://github.com/Bereda-maker/negus-gebeya-frontend")[Frontend] · #link("https://github.com/Bereda-maker/negus-gebeya-backend")[Backend]
])
#v(0.45em)
#role("TenaSew", "Wellness platform", meta: "tenasew.vercel.app", [
  Wellness content, onboarding preferences, habits, completions, progress, English/Amharic paths, and bounded non-diagnostic AI guidance. #link("https://github.com/Bereda-maker/TenaSew")[Source repository]
])
#v(0.45em)
#role("EthioVista", "Ethiopia travel platform", meta: "ethio-vista.com", [
  Live travel discovery experience covering destinations, stays, experiences, transport, guides, trip planning, multilingual entry points, and an AI assistant marked in development.
])

#section("Technical toolkit")
#grid(columns: (1fr, 1fr), gutter: 12pt,
  [
    #text(weight: "bold", fill: forest)[Product work] \
    #v(0.25em)
    #pill("TypeScript") #h(0.25em) #pill("React") #h(0.25em) #pill("Next.js") \
    #v(0.25em)
    #pill("PostgreSQL") #h(0.25em) #pill("Drizzle ORM") #h(0.25em) #pill("Hono")
  ],
  [
    #text(weight: "bold", fill: forest)[When the problem calls for it] \
    #v(0.25em)
    #pill("Python") #h(0.25em) #pill("FastAPI") #h(0.25em) #pill("Go") \
    #v(0.25em)
    #pill("MongoDB") #h(0.25em) #pill("Redis") #h(0.25em) #pill("Docker") \
    #v(0.25em)
    #text(size: 8pt, fill: muted)[PHP, Laravel, Java, Spring Boot, C\#, Bun]
  ],
)

#section("Extracurricular")
#grid(columns: (1fr, 1fr, 1fr), gutter: 10pt,
  [#text(weight: "bold", fill: forest)[Theological studies] \
   #text(size: 8pt)[Gold medalist in Diploma Practical Theology across all of Ethiopia, Holistic Bible College.]],
  [#text(weight: "bold", fill: forest)[Music] \
   #text(size: 8pt)[Vocal, piano, and guitar.]],
  [#text(weight: "bold", fill: forest)[Reading] \
   #text(size: 8pt)[A steady practice for learning, reflection, and wider perspective.]],
)

#section("Evidence and contact")
#grid(columns: (1fr, 1fr), gutter: 12pt,
  [
    #bullet[#link("https://github.com/Bereda-maker/dibo/blob/main/docs/RELEASE_READINESS_REPORT.md")[Deborah release-readiness report]] \
    #bullet[#link("https://github.com/Bereda-maker/dibo/blob/main/docs/QA_TEST_PLAN.md")[Deborah QA test plan]] \
    #bullet[#link("https://github.com/Bereda-maker/TenaSew/tree/main/docs")[TenaSew architecture and deployment notes]]
  ],
  [
    #text(weight: "bold", fill: forest)[Open to product work] \
    #text(size: 8.7pt)[For product, MVP, platform, and full-stack engineering collaborations.] \
    #v(0.25em)
    #link("mailto:beriwako56@gmail.com")[beriwako56\@gmail.com] \
    #link("https://bereda-dev.vercel.app")[bereda-dev.vercel.app]
  ],
)
