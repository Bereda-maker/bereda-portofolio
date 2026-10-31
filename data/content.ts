export type CaseStudy = {
  eyebrow: string;
  tagline: string;
  context: string;
  problem: string;
  contribution: string;
  workflow: string;
  architecture: string;
  integrations: string;
  verification: string;
  evidence: { label: string; href: string }[];
  features: string[];
  next: string;
};

export type Project = {
  title: string;
  category: string;
  description: string;
  stack: string[];
  demo: string;
  repo: string;
  image: string;
  walkthrough?: string;
  alt: string;
  status: string;
  role: string;
  featured?: boolean;
  caseStudy?: CaseStudy;
};

export const SITE = {
  name: 'Bereda Wako',
  role: 'Full-stack product engineer',
  location: 'Ethiopia',
  email: 'beriwako56@gmail.com',
  github: 'https://github.com/Bereda-maker',
  linkedin: '',
  cv: '/bereda-wako-cv.pdf',
  portrait: '/images/about-professional.png',
};

export const NAV = [
  { label: 'Work', href: '/#work' },
  { label: 'How I work', href: '/journey' },
  { label: 'About', href: '/#about' },
  { label: 'Contact', href: '/#contact' },
];

export const TECH: [string, string][] = [
  ['TypeScript', 'typescript'], ['Next.js', 'nextdotjs'], ['React', 'react'], ['Python', 'python'], ['FastAPI', 'fastapi'], ['PHP', 'php'], ['Laravel', 'laravel'], ['Go', 'go'], ['Java', 'openjdk'], ['Spring Boot', 'springboot'], ['C#', 'dotnet'], ['ASP.NET Core', 'dotnet'], ['PostgreSQL', 'postgresql'], ['MySQL', 'mysql'], ['MongoDB', 'mongodb'], ['Redis', 'redis'], ['Hono', 'hono'], ['Bun', 'bun'], ['SQLite', 'sqlite'], ['Drizzle ORM', 'drizzle'], ['Docker', 'docker'],
];

export const TECH_GROUPS: { label: string; items: string[] }[] = [
  { label: 'Product work', items: ['TypeScript', 'React', 'Next.js', 'PostgreSQL', 'Drizzle ORM'] },
  { label: 'When the problem calls for it', items: ['Python', 'FastAPI', 'Go', 'Bun', 'Hono', 'PHP', 'Laravel', 'Java', 'Spring Boot', 'C#', 'MongoDB', 'Redis', 'Docker'] },
];

export const SERVICES: { name: string; text: string }[] = [
  { name: 'MVP definition', text: 'Turn a product idea into a small, testable first release with a clear next step for its users.' },
  { name: 'Frontend and product UI', text: 'Responsive interfaces that make the main workflow obvious on the first visit.' },
  { name: 'Backends and integrations', text: 'Typed APIs, auth, payments, messaging, AI, and third-party services with useful failure states.' },
  { name: 'Data and deployment', text: 'Practical schemas, migrations, environments, monitoring, and a handover path that does not depend on me.' },
];

export const EXPERIENCE = [
  {
    role: 'Web Development Instructor',
    place: 'Ethio Computer School',
    type: 'Teaching · Digital skills',
    text: 'Taught web development through practical, project-led learning at a school that describes itself as Ethiopia’s leading digital skills school. The course focuses on building real projects rather than only studying theory.',
    links: [
      { label: 'Course page', href: 'https://www.ethiocomputer.school/courses/web-development' },
      { label: 'Watch the course VSL', href: 'https://player.vimeo.com/video/1229693804?h=387686400' },
    ],
  },
  {
    role: 'Marketing Manager',
    place: 'Gezahegn and Elfinesh Hotel & Resort',
    type: 'Hospitality · Marketing',
    text: 'Worked in marketing for one of Ethiopia’s largest hotel and resort operations, building experience in positioning a hospitality brand, communicating value, and connecting an organization with its audience.',
    links: [],
  },
  {
    role: 'Bachelor of Science in Computer Science',
    place: 'Hawassa University',
    type: 'Education · Computer science',
    text: 'Earned a Computer Science degree from Hawassa University, one of Ethiopia’s leading universities, building the technical foundation behind my product, systems, and software engineering work.',
    links: [],
  },
  {
    role: 'CEO and Startup Builder',
    place: 'EthioVista · Deborah School · TenaSew · Negus Gebeya',
    type: 'Leadership · Ethiopia-rooted startups',
    text: 'Lead and build Ethiopia-rooted startups across travel, education, wellness, and commerce. Each product starts with a local problem, a clear user workflow, and a practical path from idea to live experience.',
    links: [],
  },
];

export const PROJECTS: Project[] = [
  {
    "title": "Deborah — Education SaaS",
    "category": "Flagship product",
    "description": "A Grade 12 study platform that connects structured notes, practice questions, timed exams, progress analytics, and academic AI support.",
    "stack": ["Next.js", "TypeScript", "Bun", "Hono", "PostgreSQL", "Drizzle ORM"],
    "demo": "https://web-cdry.vercel.app",
    "repo": "https://github.com/Bereda-maker/dibo",
    "image": "/images/projects/deborah-live-hero.jpg",
    "walkthrough": "/video/walkthroughs/deborah.mp4",
    "alt": "Deborah study goal screen and exam result card",
    "status": "Live product",
    "role": "Product architecture, web experience, API workflows, auth, learning logic, QA documentation",
    "featured": true,
    "caseStudy": {
      "eyebrow": "01 / flagship product",
      "tagline": "Make a large syllabus feel like a next step.",
      "context": "Deborah is an Ethiopian Grade 12 learning and exam-preparation platform. The public product explains a connected loop: assess, learn, practice, test, reflect, and improve.",
      "problem": "Students need more than a content library. They need focused practice, a repeatable exam workflow, and a way to understand where effort should go next.",
      "contribution": "I worked across the product boundary: the Next.js experience, Hono API layers, shared validation and types, learning services, server-authoritative exam rules, authentication surfaces, admin workflows, and the release evidence that makes the boundaries explicit.",
      "workflow": "A student signs in with a supported provider, completes a profile, reviews notes, practices by topic or weak area, starts a timed exam, receives a server-scored result, reviews mistakes, and uses progress signals to choose the next study action.",
      "architecture": "The repository is a Bun workspace with a Next.js App Router web app, a Bun + Hono REST API, shared Zod validation and types, a Drizzle/PostgreSQL data layer, and pure core logic for scoring, recommendations, readiness, and entitlements.",
      "integrations": "Provider-based sign-in, server-side AI access, manual payment and receipt verification through a provider abstraction, same-origin API proxying, and deployment-friendly environment boundaries are documented in the repository.",
      "verification": "The checked-in release-readiness report records 151 Bun tests, 15 Chromium smoke tests, TypeScript checks, a production build, and the remaining staging/provider/device gaps. I link the evidence instead of presenting local QA as a production sign-off.",
      "evidence": [
        { "label": "Release-readiness report", "href": "https://github.com/Bereda-maker/dibo/blob/main/docs/RELEASE_READINESS_REPORT.md" },
        { "label": "QA test plan", "href": "https://github.com/Bereda-maker/dibo/blob/main/docs/QA_TEST_PLAN.md" },
        { "label": "Repository architecture", "href": "https://github.com/Bereda-maker/dibo#architecture" }
      ],
      "features": ["Student onboarding and provider sign-in", "Notes, search, bookmarks, and review-later flow", "Practice by topic, weak area, previous mistakes, or random selection", "Server-timed exams with autosave, recovery, scoring, results, and review", "Progress charts, recommendations, achievements, and an AI study assistant", "Admin curriculum, question bank, exam, payment, and contact workflows"],
      "next": "Before calling it fully production-ready, I would run the live staging browser pass, provider sandbox flows, managed Postgres checks, and the device/accessibility review already called out in the repository."
    }
  },
  {
    "title": "Negus Gebeya — Marketplace",
    "category": "Commerce platform",
    "description": "A premium Ethiopian marketplace for listings, verified sellers, trust scores, AI-assisted merchandising, payments, messaging, and live selling.",
    "stack": ["Next.js", "TypeScript", "Bun", "Hono", "MongoDB", "Cloudinary"],
    "demo": "https://negus-kappa.vercel.app",
    "repo": "https://github.com/Bereda-maker/negus-gebeya-frontend",
    "image": "/images/projects/negus-live-hero.jpg",
    "walkthrough": "/video/walkthroughs/negus-gebeya.mp4",
    "alt": "Negus Gebeya marketplace category imagery and product brand mark",
    "status": "Live deployment",
    "role": "Full product build across frontend and backend; marketplace, auth, payments, real-time, and admin surfaces",
    "featured": true,
    "caseStudy": {
      "eyebrow": "02 / marketplace",
      "tagline": "Build trust into the transaction, not around it.",
      "context": "Negus Gebeya is an online marketplace for Ethiopia, spanning electronics, vehicles, fashion, home goods, and more.",
      "problem": "A marketplace has to make discovery, seller confidence, communication, and checkout work together. A listing page alone is not the product.",
      "contribution": "I built the product surface and the backend boundary: listing creation and editing, search and filters, seller profiles, favorites, notifications, messaging, orders, payments, admin moderation, and the integration seams for AI and live selling.",
      "workflow": "A buyer discovers or searches listings, reviews the seller and trust signals, saves or messages the seller, places an order through the payment flow, and follows the order state. A seller can create listings with media, manage orders, and use assisted listing tools.",
      "architecture": "The backend README describes a Bun + Hono + TypeScript API backed by MongoDB/Mongoose, with Cloudinary for media, JWT sessions, Zod validation, WebSockets for messaging, and an RTMP media server for live streams.",
      "integrations": "Chapa checkout, Cloudinary media, WebSocket messaging, live-stream infrastructure, and AI-assisted listing workflows are treated as explicit service boundaries rather than hidden UI promises.",
      "verification": "The public frontend repository is delivered as a source archive and the public backend repository documents the route families, features, stack, and structure. The live URL is included so the product can be discussed as a workflow, not just a screenshot.",
      "evidence": [
        { "label": "Frontend repository", "href": "https://github.com/Bereda-maker/negus-gebeya-frontend" },
        { "label": "Backend architecture and API map", "href": "https://github.com/Bereda-maker/negus-gebeya-backend" },
        { "label": "Live product", "href": "https://negus-kappa.vercel.app" }
      ],
      "features": ["Auth with cookie or bearer JWT sessions", "Listings with multi-image and video uploads", "Seller profiles, trust scores, ratings, and verification workflow", "Favorites, notifications, direct real-time messaging, and reporting", "Chapa checkout, order tracking, seller earnings, and withdrawals", "AI listing assistant and live-selling route families"],
      "next": "For a client delivery, I would make the payment, media, and streaming environments explicit in the deployment runbook and run a staged buyer-to-seller transaction pass before production launch."
    }
  },
  {
    "title": "TenaSew — Wellness platform",
    "category": "Health and wellbeing",
    "description": "An Ethiopia-rooted wellness product with a practical content library, habits and progress, body-confidence guidance, bilingual navigation, and bounded AI support.",
    "stack": ["Next.js", "TypeScript", "PostgreSQL", "HTTP-only sessions"],
    "demo": "https://tenasew.vercel.app",
    "repo": "https://github.com/Bereda-maker/TenaSew",
    "image": "/images/projects/tenasew-live-hero.jpg",
    "walkthrough": "/video/walkthroughs/tenasew.mp4",
    "alt": "TenaSew wellness hero image and habit progress visual",
    "status": "Live product",
    "role": "Product experience, content model, auth/session boundary, personalized flows, and deployment documentation",
    "featured": true,
    "caseStudy": {
      "eyebrow": "03 / wellbeing",
      "tagline": "Useful guidance without shame, pressure, or medical overreach.",
      "context": "TenaSew brings wellness education, self-confidence, movement, nutrition, skin and hair care, and rest into a calm, local-feeling experience.",
      "problem": "Wellness products can become noisy or prescriptive. TenaSew needs to make a small action feel approachable while being clear about what the product is not.",
      "contribution": "I shaped the responsive product experience, content routes, onboarding and preference flow, authenticated habit and progress surfaces, bilingual presentation, and the safety boundaries around educational AI.",
      "workflow": "A user chooses a support area, explores a short guide, tries a small action, saves progress through authenticated routes, and can ask the bounded assistant for educational context without turning the product into a diagnostic service.",
      "architecture": "The repository uses Next.js App Router with server-only PostgreSQL access, feature-oriented route handlers, HTTP-only session cookies, and an explicit data model for profiles, preferences, habits, completions, feedback, and audit records.",
      "integrations": "The deployment docs call out the database, app URL, AI provider configuration, and production security work as separate setup boundaries so a configured environment variable is not mistaken for a completed control.",
      "verification": "The repository includes smoke tests, typecheck/build commands, architecture notes, deployment guidance, and explicit pre-launch gaps around rate limits, recovery, CSRF, RLS, backups, and professional verification.",
      "evidence": [
        { "label": "Architecture notes", "href": "https://github.com/Bereda-maker/TenaSew/blob/main/docs/ARCHITECTURE.md" },
        { "label": "Deployment guide", "href": "https://github.com/Bereda-maker/TenaSew/blob/main/docs/DEPLOYMENT.md" },
        { "label": "Live product", "href": "https://tenasew.vercel.app" }
      ],
      "features": ["Wellness content library with topic routes", "Preference-aware onboarding and habit tracking", "Progress and personalized recommendation surfaces", "English / Amharic presentation paths", "Educational AI with explicit non-diagnostic boundaries", "HTTP-only sessions and server-side database access"],
      "next": "For a production handover, I would close the documented security and operations checklist before collecting sensitive health-adjacent data at scale."
    }
  },
  {
    "title": "EthioVista — Ethiopia travel platform",
    "category": "Travel product",
    "description": "A live travel discovery experience for Ethiopia with destinations, stays, experiences, service journeys, trip planning, and an AI assistant marked as in development.",
    "stack": ["React", "Vite", "JavaScript", "REST API"],
    "demo": "https://ethio-vista.com",
    "repo": "",
    "image": "/images/projects/ethiovista-live-hero.jpg",
    "walkthrough": "/video/walkthroughs/ethiovista.mp4",
    "alt": "EthioVista destination imagery from the live travel site",
    "status": "Live site",
    "role": "Product and web experience; source repository was not provided in the connected GitHub account",
    "featured": true,
    "caseStudy": {
      "eyebrow": "04 / travel experience",
      "tagline": "Make Ethiopia easier to explore with context and confidence.",
      "context": "EthioVista is a public travel experience covering destinations, unique stays, experiences, heritage, transport, guides, and trip planning.",
      "problem": "Travel discovery has to connect inspiration with practical next actions: where to go, where to stay, how to move, and what kind of experience to expect.",
      "contribution": "I contributed to the product experience and web presentation. This case study is intentionally limited to the live public surface because the source repository is not included in the connected GitHub account.",
      "workflow": "A visitor explores destination reels, moves into stays or experiences, reviews service categories, and starts a trip-planning path. The site also surfaces contact and support routes and marks the AI assistant as in development.",
      "architecture": "The live site is a Vite-style static web app with public asset bundles and an API origin referenced by the client. The implementation boundary should be verified from the source repository before making deeper architecture claims.",
      "integrations": "The public experience exposes service routes, multilingual interface options, contact details, and an AI assistant entry point whose status is clearly labeled as in development.",
      "verification": "This project is verified from the public production URL and its visible workflow. No GitHub repository link is fabricated; the source field is shown as unavailable until the owner supplies it.",
      "evidence": [
        { "label": "Live product", "href": "https://ethio-vista.com" },
        { "label": "Plan a journey", "href": "https://ethio-vista.com/plan-my-journey" },
        { "label": "Services", "href": "https://ethio-vista.com/services/all" }
      ],
      "features": ["Destination and heritage discovery", "Destination reels across Ethiopian regions", "Stays, transport, guides, and welcome services", "Trip-planning path with practical service categories", "Multilingual assistant entry point", "AI status clearly marked as in development"],
      "next": "The next useful handoff is the source repository or deployment workspace so the architecture, testing, and maintenance story can be documented at the same level as the other case studies."
    }
  },
];

export const STACK_ICON: Record<string, string> = {
  TypeScript: 'typescript', 'Next.js': 'nextdotjs', React: 'react', 'React + Vite': 'react', Hono: 'hono', 'Hono + Bun': 'hono', PostgreSQL: 'postgresql', SQLite: 'sqlite', 'Drizzle ORM': 'drizzle', Python: 'python', FastAPI: 'fastapi', Redis: 'redis', PHP: 'php', Laravel: 'laravel', MySQL: 'mysql', Go: 'go', Java: 'openjdk', 'Spring Boot': 'springboot', MongoDB: 'mongodb', 'C#': 'dotnet', 'ASP.NET Core': 'dotnet', Bun: 'bun', 'HTTP-only sessions': 'lock', 'REST API': 'globe',
};
