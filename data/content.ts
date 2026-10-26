export const SITE = {
  name: 'Bereda',
  role: 'Full-Stack Product Engineer',
  email: 'hello@bereda.dev',
  github: 'https://github.com/Bereda-maker',
};

export const NAV = [
  { label: 'About', href: '#about' },
  { label: 'Capabilities', href: '#services' },
  { label: 'Projects', href: '#projects' },
  { label: 'Contact', href: '#contact' },
];

export const TECH: [string, string][] = [
  ['TypeScript', 'typescript'], ['Next.js', 'nextdotjs'], ['React', 'react'], ['Python', 'python'],
  ['FastAPI', 'fastapi'], ['PHP', 'php'], ['Laravel', 'laravel'], ['Go', 'go'], ['Java', 'openjdk'],
  ['Spring Boot', 'springboot'], ['C#', 'dotnet'], ['ASP.NET Core', 'dotnet'], ['PostgreSQL', 'postgresql'],
  ['MySQL', 'mysql'], ['MongoDB', 'mongodb'], ['Redis', 'redis'], ['Hono', 'hono'], ['Bun', 'bun'],
  ['SQLite', 'sqlite'], ['Drizzle ORM', 'drizzle'], ['Docker', 'docker'],
];

export const SERVICES: { name: string; text: string }[] = [
  { name: 'Product engineering', text: 'Turn an idea into a coherent product, from the first user flow through production release.' },
  { name: 'Frontend systems', text: 'Build fast, accessible interfaces with careful interaction design and a clear visual point of view.' },
  { name: 'APIs & real-time', text: 'Design reliable services, live collaboration and background workflows that behave correctly as they grow.' },
  { name: 'Data & infrastructure', text: 'Choose practical schemas, caching and deployment patterns that fit the product and its constraints.' },
  { name: 'Applied AI', text: 'Add AI where it improves a real workflow, with grounded context and clear boundaries.' },
];

export type Project = {
  title: string;
  category: string;
  description: string;
  stack: string[];
  image?: string;
  imageAlt?: string;
  demo?: string;
  repo: string;
};

// Projects are linked to their GitHub repositories. Demo links are shown only for verified live pages.
export const PROJECTS: Project[] = [
  {
    title: 'Negus Gebeya',
    category: 'Commerce · Marketplace',
    description: 'An Ethiopia-focused marketplace with transparent seller trust scores, AI-assisted listings and fair-price guidance.',
    stack: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS'],
    image: '/projects/negus-gebeya.webp',
    imageAlt: 'Negus Gebeya marketplace homepage showing its seller trust and listing features',
    demo: 'https://negus-kappa.vercel.app',
    repo: 'https://github.com/Bereda-maker/negus-gebeya-frontend',
  },
  {
    title: 'Deborah — Learning Platform',
    category: 'Education · AI',
    description: 'An Ethiopia-rooted Grade 12 platform with curriculum-led study, server-authoritative exams and an AI learning assistant.',
    stack: ['Next.js', 'TypeScript', 'Bun', 'Hono', 'PostgreSQL'],
    image: '/projects/deborah.webp',
    imageAlt: 'Deborah learning platform homepage for Ethiopian Grade 12 students',
    demo: 'https://web-cdry.vercel.app',
    repo: 'https://github.com/Bereda-maker/dibo',
  },
  {
    title: 'TenaSew',
    category: 'Product · Wellness',
    description: 'A multilingual wellness experience centered on body confidence, healthy habits and accessible guidance for everyday life.',
    stack: ['Next.js', 'TypeScript', 'Tailwind CSS'],
    image: '/projects/tenasew-cover.webp',
    imageAlt: 'TenaSew wellness platform hero artwork from the project repository',
    demo: 'https://tenasew.vercel.app',
    repo: 'https://github.com/Bereda-maker/TenaSew',
  },
  {
    title: 'Real-Time Chat',
    category: 'Systems · Realtime',
    description: 'A multi-instance messaging system using durable Postgres history and Redis for presence, typing and cross-server delivery.',
    stack: ['Next.js', 'TypeScript', 'Hono', 'Bun', 'PostgreSQL', 'Redis'],
    image: '/projects/chat-cover.webp',
    imageAlt: 'Editorial illustration of connected glass forms representing a real-time messaging system',
    repo: 'https://github.com/Bereda-maker/real-time-chat-app',
  },
  {
    title: 'Personal Finance Tracker',
    category: 'Product · Finance',
    description: 'A private money dashboard for income, spending and trends, with server-side validation and amounts stored as integer cents.',
    stack: ['Next.js', 'TypeScript', 'SQLite', 'Drizzle ORM'],
    image: '/projects/finance-tracker.webp',
    imageAlt: 'Personal Finance Tracker dashboard with balances, trends and recent transactions',
    demo: 'https://personal-finance-tracker-omega-sable.vercel.app',
    repo: 'https://github.com/Bereda-maker/personal-finance-tracker',
  },
  {
    title: 'E-Commerce Platform',
    category: 'Commerce · Payments',
    description: 'A Laravel storefront built around transactional stock locks and signed payment webhooks to prevent overselling and verify checkout.',
    stack: ['PHP', 'Laravel', 'Livewire', 'MySQL', 'Stripe'],
    image: '/projects/commerce-cover.webp',
    imageAlt: 'Editorial illustration of a securely wrapped commerce parcel',
    repo: 'https://github.com/Bereda-maker/e-commerce',
  },
  {
    title: 'Task Board',
    category: 'Product · Collaboration',
    description: 'A shared team workspace with authenticated boards and assigned tasks, backed by a separately deployed React client and Hono API.',
    stack: ['React', 'TypeScript', 'Vite', 'Hono', 'Bun', 'PostgreSQL'],
    image: '/projects/taskboard-cover.webp',
    imageAlt: 'Editorial illustration of modular task-board columns and markers',
    repo: 'https://github.com/Bereda-maker/task-managment-app',
  },
  {
    title: 'Blog Platform with CMS',
    category: 'Product · Publishing',
    description: 'A publishing platform pairing a searchable reading experience with a separate authoring workflow.',
    stack: ['Python', 'FastAPI', 'Next.js', 'PostgreSQL'],
    image: '/projects/blog-cover.webp',
    imageAlt: 'Editorial illustration of an open book and publishing pages',
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
