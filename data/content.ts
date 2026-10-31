export const SITE = {
  name: 'Bereda Wako',
  role: 'Full-stack developer',
  location: 'Ethiopia',
  email: 'hello@bereda.dev',
  github: 'https://github.com/Bereda-maker',
  linkedin: '', // add your LinkedIn URL here; the link stays hidden while this is empty
  portrait: '/images/hero.png', // swap for a real, natural photo of you (see README note)
};
export const NAV = [{ label: 'Work', href: '/#work' }, { label: 'About', href: '/#about' }, { label: 'Contact', href: '/#contact' }];
export const TECH: [string, string][] = [["TypeScript", "typescript"], ["Next.js", "nextdotjs"], ["React", "react"], ["Python", "python"], ["FastAPI", "fastapi"], ["PHP", "php"], ["Laravel", "laravel"], ["Go", "go"], ["Java", "openjdk"], ["Spring Boot", "springboot"], ["C#", "dotnet"], ["ASP.NET Core", "dotnet"], ["PostgreSQL", "postgresql"], ["MySQL", "mysql"], ["MongoDB", "mongodb"], ["Redis", "redis"], ["Hono", "hono"], ["Bun", "bun"], ["SQLite", "sqlite"], ["Drizzle ORM", "drizzle"], ["Docker", "docker"]];
// Edit these two lists so they match how you actually work day to day.
export const TECH_GROUPS: { label: string; items: string[] }[] = [
  { label: 'Most of my work', items: ['TypeScript', 'React', 'Next.js', 'PostgreSQL', 'Drizzle ORM'] },
  { label: 'Also used', items: ['Python', 'FastAPI', 'Go', 'PHP', 'Laravel', 'Java', 'Spring Boot', 'C#', 'ASP.NET Core', 'MySQL', 'MongoDB', 'Redis', 'Docker'] },
];
export const SERVICES: { name: string; text: string }[] = [
 {
  "name": "Web interfaces",
  "text": "Responsive, accessible front ends built with React and Next.js."
 },
 {
  "name": "Backends and APIs",
  "text": "APIs with clear contracts and error messages that say what went wrong."
 },
 {
  "name": "Databases",
  "text": "Schemas and queries in PostgreSQL, MySQL or MongoDB, designed so the next feature is easy to add."
 },
 {
  "name": "Real-time and background work",
  "text": "Live updates, queues and scheduled jobs that keep running when nobody is watching."
 },
 {
  "name": "AI features",
  "text": "Question answering over your own documents, grounded in your data."
 }
];
export type Project = { title: string; category: string; description: string; stack: string[]; demo: string; repo: string };
// Replace "#" with real live-demo and repository URLs. Keep this array plain JSON: scripts/seed.mjs parses it.
export const PROJECTS: Project[] = [
 {
  "title": "This portfolio",
  "category": "Portfolio",
  "description": "The site you are on: a public portfolio with a private admin area for editing projects and reading contact messages.",
  "stack": [
   "TypeScript",
   "Next.js",
   "PostgreSQL",
   "Drizzle ORM"
  ],
  "demo": "https://bereda-dev.vercel.app",
  "repo": "https://github.com/Bereda-maker/bereda-portofolio"
 },
 {
  "title": "Personal Finance Tracker",
  "category": "Project",
  "description": "Log income and expenses, categorize them and see where the money goes.",
  "stack": [
   "TypeScript",
   "Next.js",
   "SQLite",
   "Drizzle ORM"
  ],
  "demo": "#",
  "repo": "#"
 },
 {
  "title": "Task Management App",
  "category": "Team",
  "description": "A shared task board for a small team with authentication and a live, consistent view.",
  "stack": [
   "TypeScript",
   "React + Vite",
   "Hono",
   "Bun",
   "PostgreSQL"
  ],
  "demo": "#",
  "repo": "#"
 },
 {
  "title": "Blog Platform with CMS",
  "category": "Publishing",
  "description": "Search-friendly, instant-loading articles with a private authoring experience.",
  "stack": [
   "Python",
   "FastAPI",
   "Next.js",
   "PostgreSQL"
  ],
  "demo": "#",
  "repo": "#"
 },
 {
  "title": "Real-Time Chat",
  "category": "Realtime",
  "description": "Instant messaging and typing indicators that scale beyond one server process.",
  "stack": [
   "TypeScript",
   "Next.js",
   "Hono + Bun",
   "PostgreSQL",
   "Redis"
  ],
  "demo": "#",
  "repo": "#"
 },
 {
  "title": "E-Commerce Platform",
  "category": "Commerce",
  "description": "Cart, checkout and payments with no overselling and no lost orders.",
  "stack": [
   "PHP",
   "Laravel",
   "MySQL"
  ],
  "demo": "#",
  "repo": "#"
 },
 {
  "title": "Job Board",
  "category": "Search",
  "description": "Keyword, location, remote and salary search on a compiled, concurrent backend.",
  "stack": [
   "Go",
   "Next.js",
   "PostgreSQL"
  ],
  "demo": "#",
  "repo": "#"
 },
 {
  "title": "Social Network",
  "category": "Social",
  "description": "Profiles, follows, a feed, likes and notifications, structured in clean layers.",
  "stack": [
   "Java",
   "Spring Boot",
   "Next.js",
   "MongoDB",
   "Redis"
  ],
  "demo": "#",
  "repo": "#"
 },
 {
  "title": "AI-Powered Application",
  "category": "AI",
  "description": "Ask questions grounded in your own documents with retrieval-augmented generation.",
  "stack": [
   "Python",
   "FastAPI",
   "Next.js",
   "PostgreSQL + pgvector"
  ],
  "demo": "#",
  "repo": "#"
 },
 {
  "title": "Marketplace Platform",
  "category": "Marketplace",
  "description": "Multi-vendor checkout with correct seller payouts and background jobs.",
  "stack": [
   "TypeScript",
   "Next.js",
   "Hono + Bun",
   "PostgreSQL",
   "Redis"
  ],
  "demo": "#",
  "repo": "#"
 },
 {
  "title": "SaaS Application",
  "category": "Capstone",
  "description": "Multi-tenant project-management product with subscription billing and usage limits.",
  "stack": [
   "C#",
   "ASP.NET Core",
   "Next.js",
   "PostgreSQL",
   "Redis"
  ],
  "demo": "#",
  "repo": "#"
 }
];
export const STACK_ICON: Record<string, string> = {"TypeScript":"typescript","Next.js":"nextdotjs","React + Vite":"react","Hono":"hono","Hono + Bun":"hono","PostgreSQL":"postgresql","PostgreSQL + pgvector":"postgresql","SQLite":"sqlite","Drizzle ORM":"drizzle","Python":"python","FastAPI":"fastapi","Redis":"redis","PHP":"php","Laravel":"laravel","MySQL":"mysql","Go":"go","Java":"openjdk","Spring Boot":"springboot","MongoDB":"mongodb","C#":"dotnet","ASP.NET Core":"dotnet","Bun":"bun"};
