export const SITE = { name: 'Bereda', role: 'Full Stack Software Engineer', email: 'hello@bereda.dev', github: '#', linkedin: '#' };
export const NAV = [{ label: 'About', href: '#about' }, { label: 'Services', href: '#services' }, { label: 'Projects', href: '#projects' }, { label: 'Contact', href: '#contact' }];
export const ROLES = ['Full Stack Engineer', 'TypeScript · Python · Go', 'APIs · Databases · AI', 'Idea to production'];
export const HERO_CHIPS = [
  { t: 'Next.js', s: { left: '9%', top: '42%' } }, { t: 'TypeScript', s: { right: '9%', top: '38%', animationDelay: '-2s' } },
  { t: 'Go', s: { left: '17%', top: '64%', animationDelay: '-1s' } }, { t: 'PostgreSQL', s: { right: '15%', top: '60%', animationDelay: '-3s' } },
];
export const TECH: [string, string][] = [["TypeScript", "typescript"], ["Next.js", "nextdotjs"], ["React", "react"], ["Python", "python"], ["FastAPI", "fastapi"], ["PHP", "php"], ["Laravel", "laravel"], ["Go", "go"], ["Java", "openjdk"], ["Spring Boot", "springboot"], ["C#", "dotnet"], ["ASP.NET Core", "dotnet"], ["PostgreSQL", "postgresql"], ["MySQL", "mysql"], ["MongoDB", "mongodb"], ["Redis", "redis"], ["Hono", "hono"], ["Bun", "bun"], ["SQLite", "sqlite"], ["Drizzle ORM", "drizzle"], ["Docker", "docker"]];
export const SERVICES: { name: string; text: string }[] = [
 {
  "name": "Frontend Development",
  "text": "Fast, accessible interfaces built with React and Next.js, with the right rendering strategy for each page."
 },
 {
  "name": "Backend & APIs",
  "text": "Clean, well-tested APIs and services in TypeScript, Python, PHP, Go, Java and C#."
 },
 {
  "name": "Databases & Search",
  "text": "Schema design and queries on PostgreSQL, MySQL, MongoDB, SQLite and pgvector, plus caching with Redis."
 },
 {
  "name": "Real-Time & Background Jobs",
  "text": "WebSocket messaging, queues and workers that keep working across multiple server processes."
 },
 {
  "name": "AI & SaaS Products",
  "text": "Retrieval-augmented AI features and multi-tenant SaaS with subscription billing, from first commit to production."
 }
];
export type Project = { title: string; category: string; description: string; stack: string[]; demo: string; repo: string };
// Replace "#" with real live-demo and repository URLs.
export const PROJECTS: Project[] = [
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
