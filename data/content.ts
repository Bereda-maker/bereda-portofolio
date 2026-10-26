export const SITE = {
  name: 'Bereda',
  role: 'Full Stack Software Engineer',
  email: 'hello@bereda.dev',
  github: 'https://github.com/Bereda-maker',
  linkedin: '#',
};

export const NAV = [
  { label: 'About', href: '#about' },
  { label: 'Services', href: '#services' },
  { label: 'Projects', href: '#projects' },
  { label: 'Contact', href: '#contact' },
];

export const ROLES = ['Full Stack Engineer', 'TypeScript · Python · Go', 'APIs · Databases · AI', 'Idea to production'];

export const HERO_CHIPS = [
  { t: 'Next.js', s: { left: '9%', top: '42%' } },
  { t: 'TypeScript', s: { right: '9%', top: '38%', animationDelay: '-2s' } },
  { t: 'Go', s: { left: '17%', top: '64%', animationDelay: '-1s' } },
  { t: 'PostgreSQL', s: { right: '15%', top: '60%', animationDelay: '-3s' } },
];

export const TECH: [string, string][] = [
  ['TypeScript', 'typescript'], ['Next.js', 'nextdotjs'], ['React', 'react'], ['Python', 'python'],
  ['FastAPI', 'fastapi'], ['PHP', 'php'], ['Laravel', 'laravel'], ['Go', 'go'], ['Java', 'openjdk'],
  ['Spring Boot', 'springboot'], ['C#', 'dotnet'], ['ASP.NET Core', 'dotnet'], ['PostgreSQL', 'postgresql'],
  ['MySQL', 'mysql'], ['MongoDB', 'mongodb'], ['Redis', 'redis'], ['Hono', 'hono'], ['Bun', 'bun'],
  ['SQLite', 'sqlite'], ['Drizzle ORM', 'drizzle'], ['Docker', 'docker'],
];

export const SERVICES: { name: string; text: string }[] = [
  { name: 'Product engineering', text: 'From first interaction to production-ready architecture, I build complete web products with a clear point of view.' },
  { name: 'Frontend systems', text: 'Fast, accessible interfaces with thoughtful motion, responsive layouts and the right rendering strategy.' },
  { name: 'APIs & real-time', text: 'Reliable services, live collaboration and background workflows designed for correctness as systems grow.' },
  { name: 'Data & infrastructure', text: 'Practical schemas, migrations, caching and deployment choices that fit the product—not the trend cycle.' },
  { name: 'AI-enabled experiences', text: 'Useful AI features grounded in product context, with clear boundaries and server-side integrations.' },
];

export type Project = {
  title: string;
  category: string;
  description: string;
  stack: string[];
  demo?: string;
  repo: string;
};

// Projects below map to repositories in github.com/Bereda-maker. Demo links are included only for repositories with a published homepage.
export const PROJECTS: Project[] = [
  {
    title: 'Deborah — Learning Platform',
    category: 'Education · AI',
    description: 'An Ethiopia-rooted Grade 12 learning platform with curriculum-driven content, server-authoritative exams and an AI learning assistant.',
    stack: ['Next.js', 'TypeScript', 'Bun', 'Hono', 'PostgreSQL'],
    demo: 'https://web-cdry.vercel.app',
    repo: 'https://github.com/Bereda-maker/dibo',
  },
  {
    title: 'TenaSew',
    category: 'Wellness · Product',
    description: 'A warm, Ethiopia-rooted wellness and body-confidence experience built around feeling better and growing confidently.',
    stack: ['Next.js', 'TypeScript', 'Tailwind CSS'],
    demo: 'https://tenasew.vercel.app',
    repo: 'https://github.com/Bereda-maker/TenaSew',
  },
  {
    title: 'Real-Time Chat',
    category: 'Realtime · Systems',
    description: 'A multi-instance messaging system: Postgres keeps durable history while Redis coordinates presence, typing and cross-server delivery.',
    stack: ['Next.js', 'TypeScript', 'Hono', 'Bun', 'PostgreSQL', 'Redis'],
    repo: 'https://github.com/Bereda-maker/real-time-chat-app',
  },
  {
    title: 'E-Commerce Platform',
    category: 'Commerce · Backend',
    description: 'A Laravel storefront designed to prevent overselling with transactional stock locks and confirm payment through signed webhooks.',
    stack: ['PHP', 'Laravel', 'Livewire', 'MySQL', 'Stripe'],
    repo: 'https://github.com/Bereda-maker/e-commerce',
  },
  {
    title: 'Task Board',
    category: 'Collaboration · Full stack',
    description: 'A shared team workspace with authenticated boards, assigned tasks and a separately deployed React client and Hono API.',
    stack: ['React', 'TypeScript', 'Vite', 'Hono', 'Bun', 'PostgreSQL'],
    repo: 'https://github.com/Bereda-maker/task-managment-app',
  },
  {
    title: 'Personal Finance Tracker',
    category: 'Finance · Product',
    description: 'A private money dashboard for income, spending and trends, with server-side validation and amounts handled as integer cents.',
    stack: ['Next.js', 'TypeScript', 'SQLite', 'Drizzle ORM'],
    demo: 'https://personal-finance-tracker-omega-sable.vercel.app',
    repo: 'https://github.com/Bereda-maker/personal-finance-tracker',
  },
  {
    title: 'Blog Platform with CMS',
    category: 'Publishing · Full stack',
    description: 'A publishing platform pairing a searchable reading experience with a private authoring workflow.',
    stack: ['Python', 'FastAPI', 'Next.js', 'PostgreSQL'],
    repo: 'https://github.com/Bereda-maker/Blog-Platform-with-CMS',
  },
];

export const STACK_ICON: Record<string, string> = {
  TypeScript: 'typescript', 'Next.js': 'nextdotjs', React: 'react', 'React + Vite': 'react', Vite: 'vite',
  Python: 'python', FastAPI: 'fastapi', PHP: 'php', Laravel: 'laravel', Livewire: 'laravel', Go: 'go',
  Java: 'openjdk', 'Spring Boot': 'springboot', 'C#': 'dotnet', 'ASP.NET Core': 'dotnet',
  PostgreSQL: 'postgresql', MySQL: 'mysql', MongoDB: 'mongodb', Redis: 'redis', Hono: 'hono', Bun: 'bun',
  SQLite: 'sqlite', 'Drizzle ORM': 'drizzle', Docker: 'docker', 'Tailwind CSS': 'tailwindcss', Stripe: 'stripe',
};
