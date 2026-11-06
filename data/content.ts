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


export type Testimonial = {
  name: string;
  role: string;
  company: string;
  description: string;
  quote: string;
  story: string;
  image: string;
  imageAlt: string;
  accent: string;
  contact: { label: string; href: string };
  phone: string;
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
  portrait: '/images/about-portrait.webp',
};

export type NavigationItem = { label: string; href?: string; items?: { label: string; href: string }[] };

export const NAV: NavigationItem[] = [
  { label: 'Home', href: '/#top' },
  { label: 'Works', items: [
    { label: 'All work', href: '/#work' },
    { label: 'Flagship product · Deborah', href: '/projects/deborah-education-saas' },
    { label: 'Commercial · Negus Gebeya', href: '/projects/negus-gebeya-marketplace' },
    { label: 'Health & wellness · TenaSew', href: '/projects/tenasew-wellness-platform' },
    { label: 'Travel · EthioVista', href: '/projects/ethiovista-ethiopia-travel-platform' },
    { label: 'Portfolio · fifth completed work', href: '/projects/bereda-wako-portfolio-platform' },
  ] },
  { label: 'About', href: '/#about' },
  { label: 'Experience', items: [
    { label: 'Experience overview', href: '/#experience' },
    { label: 'Teaching', href: '/#experience-teaching' },
    { label: 'Marketing & hospitality', href: '/#experience-marketing' },
    { label: 'Education', href: '/#experience-education' },
    { label: 'Startup leadership', href: '/#experience-startup' },
  ] },
  { label: 'Testimony', href: '/#testimony' },
  { label: 'Extracurricular', href: '/#extracurricular' },
  { label: 'Books', href: '/books' },
  { label: 'Media', items: [
    { label: 'Writing', href: '/content' },
    { label: 'Video', href: '/videos' },
  ] },
  { label: 'Contact', href: '/#contact' },
  { label: 'Appointment', href: '/book' },
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
    slug: 'web-development-instructor',
    role: 'Web Development Instructor',
    place: 'Ethio Computer School',
    type: 'Teaching · Digital skills',
    image: '/images/experience/teaching.webp',
    imageAlt: 'Editorial illustration of an instructor and learners building a web page together.',
    text: 'Taught web development through practical, project-led learning at a school that describes itself as Ethiopia’s leading digital skills school. The course focuses on building real projects rather than only studying theory.',
    details: [
      'Delivered web-development instruction through practical, project-led learning.',
      'The published course is titled “Learn Web Development Through Real Projects.”',
    ],
    links: [
      { label: 'Course page', href: 'https://www.ethiocomputer.school/courses/web-development' },
      { label: 'Watch the course VSL', href: 'https://player.vimeo.com/video/1229693804?h=387686400' },
    ],
  },
  {
    slug: 'marketing-manager-gezahegn-and-elfinesh',
    role: 'Marketing Manager',
    place: 'Gezahegn and Elfinesh Hotel & Resort',
    type: 'Hospitality · Marketing',
    image: '/images/experience/hospitality.webp',
    imageAlt: 'Bereda Wako at a desk alongside real Gezahegn & Elfinesh Hotel & Resort pool, garden, and sign photographs.',
    text: 'Worked in marketing for one of Ethiopia’s largest hotel and resort operations, building experience in positioning a hospitality brand, communicating value, and connecting an organization with its audience.',
    details: [
      'Worked on brand positioning and customer communication in hospitality.',
      'Built experience connecting the hotel and resort’s offering with its audience.',
    ],
    links: [],
  },
  {
    slug: 'hawassa-university-computer-science',
    role: 'Bachelor of Science in Computer Science',
    place: 'Hawassa University',
    type: 'Education · Computer science',
    image: '/images/experience/computer-science.webp',
    imageAlt: 'Bereda Wako studying at a library desk beneath a Hawassa University sign.',
    text: 'Earned a Computer Science degree from Hawassa University, one of Ethiopia’s leading universities, building the technical foundation behind my product, systems, and software engineering work.',
    details: [
      'Earned a Bachelor of Science in Computer Science at Hawassa University.',
      'This education forms the technical foundation for product, systems, and software engineering work.',
    ],
    links: [],
  },
  {
    slug: 'founder-startup-builder',
    role: 'CEO and Startup Builder',
    place: 'EthioVista · Deborah School · TenaSew · Negus Gebeya',
    type: 'Leadership · Ethiopia-rooted startups',
    image: '/images/experience/startup-builder.webp',
    imageAlt: 'Senior software-engineer workstation with the Deborah, Negus Gebeya, TenaSew, and EthioVista websites on four monitors; the engineer is seen from behind.',
    text: 'Lead and build Ethiopia-rooted startups across travel, education, wellness, and commerce. Each product starts with a local problem, a clear user workflow, and a practical path from idea to live experience.',
    details: [
      'Lead and build products across travel, education, wellness, and commerce.',
      'Shape each venture from a local problem and user workflow through architecture, launch, and iteration.',
    ],
    relatedProjectSlugs: [
      'ethiovista-ethiopia-travel-platform',
      'deborah-education-saas',
      'tenasew-wellness-platform',
      'negus-gebeya-marketplace',
    ],
    links: [],
  },
];

export const EXTRACURRICULAR = [
  {
    title: 'Theological studies',
    label: 'Study · Faith · Discipline',
    image: '/images/extracurricular-theology.png',
    alt: 'Bereda Wako receiving a graduation medal during a Holistic Bible College theological studies ceremony',
    text: 'Gold medalist in Diploma Practical Theology across all of Ethiopia from Holistic Bible College.',
  },
  {
    title: 'Music',
    label: 'Vocal · Piano · Guitar',
    image: '/images/extracurricular-music.png',
    alt: 'Bereda Wako playing piano in a warm music studio with a microphone and acoustic guitar',
    text: 'I make space for music through vocal performance, piano, and guitar — a creative counterweight to technical work.',
  },
  {
    title: 'Reading',
    label: 'Curiosity · Reflection · Growth',
    image: '/images/extracurricular-reading.png',
    alt: 'Bereda Wako reading an open book in a warm study nook with books and a reading lamp',
    text: 'Reading keeps the questions open: a steady habit for learning, reflection, and seeing problems from a wider angle.',
  },
];


export const TESTIMONIALS: Testimonial[] = [
  {
    name: 'Getabalew Tadiwos', role: 'CEO & Founder', company: 'Ethio Computer School', description: 'CEO and Founder of Ethio Computer School, collaborating with Bereda on practical web development education and digital skills.',
    quote: 'Bereda demonstrates a strong willingness to learn, share knowledge, and contribute to technology education.',
    story: 'I have had the opportunity to work with Bereda Wako through Ethio Computer School, where we collaborate in delivering web development education. Throughout our collaboration, I have observed his technical knowledge, passion for technology, and commitment to helping others develop practical digital skills.\n\nBereda demonstrates a strong willingness to learn, share knowledge, and contribute to technology education. His ability to approach web development from both a practical and educational perspective makes him a valuable collaborator.\n\nI appreciate his dedication, initiative, and enthusiasm for continuous professional growth. I believe he has great potential to grow as a software developer and make meaningful contributions to the technology industry.\n\nI am pleased to recommend him to organizations, collaborators, and professionals seeking someone with a genuine passion for software development and technology education.',
    image: '/images/testimonials/getabalew-tadiwos.webp', imageAlt: 'Getabalew Tadiwos, CEO and Founder of Ethio Computer School', accent: '#f0bd48', contact: { label: 'Open contact form', href: '#contact' }, phone: '+251 911 410 963',
  },
  {
    name: 'Mintesnot Fisseha', role: 'CEO & Founder', company: 'ye-buna.com · 95k+ users', description: 'CEO and Founder of ye-buna.com, one of Ethiopia’s largest platforms with more than 95,000 users.',
    quote: 'Bereda demonstrated a thoughtful approach to understanding project requirements, addressing technical challenges, and translating ideas into functional solutions.',
    story: 'I had the opportunity to work professionally with Bereda Wako on the Gezahegn & Elfinesh Hotel & Resort project. During our collaboration, I observed his interest in software development, technical abilities, and commitment to delivering practical digital solutions.\n\nBereda demonstrated a thoughtful approach to understanding project requirements, addressing technical challenges, and translating ideas into functional solutions. His willingness to explore new technologies, solve problems, and continuously improve his development skills made him a valuable collaborator.\n\nI appreciate his dedication, technical curiosity, and enthusiasm for building technology-driven solutions that address real business needs. I believe he has strong potential to continue growing as a software developer and contribute meaningfully to the technology industry.\n\nI am pleased to recommend Bereda to organizations, businesses, and professionals looking for a motivated and growth-oriented technology professional.',
    image: '/images/testimonials/mintesnot-fisseha.webp', imageAlt: 'Mintesnot Fisseha, CEO and Founder of ye-buna.com', accent: '#7da3ff', contact: { label: 'Open contact form', href: '#contact' }, phone: '+251 934 751 319',
  },
  {
    name: 'Sosh Furi', role: 'CEO & Software Engineer', company: 'Vintage Technologies PLC', description: 'CEO and Software Engineer at Vintage Technologies PLC, focused on recognizing practical software innovation and emerging technology talent.',
    quote: 'Bereda distinguished himself by successfully completing the Vintage Challenge and placing among the top five participants with Negus Gebeya.',
    story: 'I had the opportunity to recognize Bereda Wako\'s work through the Vintage Challenge – Round 1: Used Goods Web Marketplace. Among the participants, Bereda distinguished himself by successfully completing the challenge and achieving a position among the top five participants with his software product, Negus Gebeya.\n\nHis work demonstrated creativity, innovative thinking, and the ability to transform a practical business concept into a software solution. His participation reflected an interest in solving real-world problems through technology and developing solutions that create practical value.\n\nI appreciate his initiative, commitment to innovation, and enthusiasm for software development. His achievement in the challenge demonstrates promising potential as an emerging software developer and technology innovator.\n\nI wish him continued success in his professional journey and future contributions to the technology industry.',
    image: '/images/testimonials/sosh.jpg', imageAlt: 'Sosh Furi, CEO and Software Engineer at Vintage Technologies PLC', accent: '#d98675', contact: { label: 'Open contact form', href: '#contact' }, phone: '+251 916 772 303',
  },
  {
    name: 'Biniam G/Mariyam', role: 'General Manager', company: 'Gezahegn & Elfinesh Hotel and Resort', description: 'General Manager at Gezahegn & Elfinesh Hotel and Resort, focused on connecting thoughtful hospitality with practical digital service improvements.',
    quote: 'Bereda demonstrated a strong understanding of our hospitality needs and the importance of using technology to improve guest experiences.',
    story: 'I had the opportunity to supervise Bereda Wako during his work on a digital solution for Gezahegn & Elfineh Hotel and Resort. One of the key initiatives he led was introducing a digital menu experience designed specifically for doctors visiting Hawassa through Operation Smile\'s international medical missions.\n\nBereda demonstrated a strong understanding of our hospitality needs and the importance of using technology to improve guest experiences. He took the initiative to translate a practical business requirement into a digital solution that made accessing menu information more convenient for our international medical visitors.\n\nThe feedback and positive reactions from the visiting doctors were particularly encouraging and demonstrated the value of incorporating digital solutions into the hospitality experience.\n\nI appreciated Bereda\'s initiative, creativity, and ability to connect technology with real business needs. His contribution showed how thoughtful digital solutions can improve service delivery and create meaningful experiences for guests.\n\nI wish him continued success in his professional journey as a software developer and technology innovator.',
    image: '/images/testimonials/biniam.jpg', imageAlt: 'Biniam G/Mariyam, General Manager at Gezahegn and Elfinesh Hotel and Resort', accent: '#8ec6a5', contact: { label: 'Open contact form', href: '#contact' }, phone: '+251 923 994 191',
  },
  {
    name: 'Temesgen Endale', role: 'Instructor & TBIC Leader', company: 'Hawassa University', description: 'Instructor and TBIC leader at Hawassa University, mentoring innovation, entrepreneurship, and technology-driven solutions.',
    quote: 'His interest in building practical solutions and exploring entrepreneurial opportunities demonstrates promising potential as both a software developer and an emerging technology entrepreneur.',
    story: 'I have had the opportunity to mentor Bereda Wako through his EthioVista projects, where I observed his interest in innovation, entrepreneurial thinking, and the application of technology to address practical challenges.\n\nThroughout our mentorship, Bereda demonstrated enthusiasm for exploring new ideas, developing technology-driven solutions, and thinking beyond conventional software development. His approach reflects a growing understanding of how innovation, technology, and business opportunities can come together to create meaningful products and services.\n\nI appreciate his curiosity, initiative, and willingness to learn and refine his ideas. His interest in building practical solutions and exploring entrepreneurial opportunities demonstrates promising potential as both a software developer and an emerging technology entrepreneur.\n\nI believe Bereda has the mindset and determination to continue developing innovative solutions and contribute positively to the growing technology ecosystem.',
    image: '/images/testimonials/temesgen.jpg', imageAlt: 'Temesgen Endale, Instructor and TBIC Leader at Hawassa University', accent: '#c49bdb', contact: { label: 'Open contact form', href: '#contact' }, phone: '+251 916 140 498',
  },
  {
    name: 'Deborah Melkamu', role: 'Startup Collaborator', company: 'EthioVista', description: 'Startup collaborator who worked with Bereda on EthioVista, helping shape an Ethiopia-rooted travel product with clarity and momentum.',
    quote: 'He is the person you want in the room when an idea needs both momentum and a point of view.',
    story: 'Bereda brings energy to early-stage work without skipping the hard thinking. He can zoom out to clarify the opportunity, zoom in to ship the next step, and keep a team moving with honest, useful feedback.',
    image: '', imageAlt: 'No portrait provided for Deborah Melkamu', accent: '#e58b54', contact: { label: 'Start a conversation', href: '#contact' }, phone: '+251 945 620 552',
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
  {
    "title": "Bereda Wako — Portfolio Platform",
    "category": "Personal portfolio",
    "description": "A full-stack portfolio that presents verified product case studies alongside a custom admin workspace for content, appointments, mentorship records, AI-assisted opportunity discovery, and audit activity.",
    "stack": ["Next.js", "TypeScript", "PostgreSQL", "Drizzle ORM"],
    "demo": "https://bereda-dev.vercel.app",
    "repo": "https://github.com/Bereda-maker/bereda-portofolio",
    "image": "/images/hero-laptop-final.png",
    "alt": "Bereda Wako portrait with a laptop, used as the portfolio platform project image",
    "status": "Completed",
    "role": "Product design and end-to-end implementation of the public portfolio, case-study system, admin dashboard, and deployment workflows",
    "featured": true,
    "caseStudy": {
      "eyebrow": "05 / portfolio platform",
      "tagline": "A portfolio that demonstrates the product work behind the profile.",
      "context": "This portfolio combines a public-facing product-engineering profile with five detailed case studies and an authenticated operational workspace.",
      "problem": "A portfolio needs to do more than list technologies. It should make the product context, workflows, implementation boundaries, and evidence easy to explore while giving its owner practical tools to maintain the site.",
      "contribution": "I designed and implemented the public experience, responsive navigation, project case studies, content surfaces, admin workflows, and production deployment. The same project includes this fifth case study as a record of the portfolio platform itself.",
      "workflow": "Visitors move from the home page into work categories, open an individual case study, inspect product evidence, and continue to writing, books, video, contact, or appointment booking. The admin area manages site content and selected operational workflows behind authentication.",
      "architecture": "The project uses the Next.js App Router and TypeScript for the web experience and route handlers, with Drizzle ORM and PostgreSQL-backed records for the supported administrative workflows. Public case-study content is maintained as verified typed project records.",
      "integrations": "The site includes Vercel deployment, email contact, appointment and Google Calendar integration surfaces, an AI provider-backed opportunity discovery flow, and linked external project repositories and evidence.",
      "verification": "The repository production build passes. Deployed changes are tracked through GitHub commits and Vercel deployment checks. Integrations are described at the scope implemented; this page does not imply that external services are configured beyond their visible status.",
      "evidence": [
        { "label": "Live portfolio", "href": "https://bereda-dev.vercel.app" },
        { "label": "Source repository", "href": "https://github.com/Bereda-maker/bereda-portofolio" }
      ],
      "features": ["Responsive portfolio with grouped dropdown navigation", "Five project case studies with evidence and live links", "Authenticated content and project administration", "Appointment, mentorship, and audit activity workspaces", "Profile-matched AI opportunity discovery across approved feeds", "Production deployments connected to GitHub and Vercel"],
      "next": "The next improvement is to keep the project evidence, external integration status, and operational audit coverage current as the portfolio and its admin tools evolve."
    }
  },
];

export const STACK_ICON: Record<string, string> = {
  TypeScript: 'typescript', 'Next.js': 'nextdotjs', React: 'react', 'React + Vite': 'react', Hono: 'hono', 'Hono + Bun': 'hono', PostgreSQL: 'postgresql', SQLite: 'sqlite', 'Drizzle ORM': 'drizzle', Python: 'python', FastAPI: 'fastapi', Redis: 'redis', PHP: 'php', Laravel: 'laravel', MySQL: 'mysql', Go: 'go', Java: 'openjdk', 'Spring Boot': 'springboot', MongoDB: 'mongodb', 'C#': 'dotnet', 'ASP.NET Core': 'dotnet', Bun: 'bun', 'HTTP-only sessions': 'lock', 'REST API': 'globe',
};
