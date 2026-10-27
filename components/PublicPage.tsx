import Link from 'next/link';
import { SITE } from '@/data/content';

export const PUBLIC_NAV = [
  { label: 'Home', href: '/' },
  { label: 'Work', href: '/#projects' },
  { label: 'Journey', href: '/journey' },
  { label: 'Books', href: '/books' },
  { label: 'Mentorship', href: '/mentorship' },
  { label: 'Videos', href: '/videos' },
  { label: 'Opportunities', href: '/opportunities' },
  { label: 'Contact', href: '/#contact' },
];

export function PublicNav() {
  return (
    <nav aria-label="Primary navigation" className="relative z-20 mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 pb-8 pt-6 sm:px-8 md:px-10 md:pt-8">
      <Link href="/" className="flex items-center gap-3 text-sm font-medium uppercase tracking-[.2em] text-[#D7E2EA]">
        <span className="brand-mark" aria-hidden="true" />{SITE.name}<span className="hidden opacity-40 sm:inline">/ 26</span>
      </Link>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs uppercase tracking-widest text-[#D7E2EA] sm:gap-8 sm:text-sm">
        {PUBLIC_NAV.map((item) => <Link key={item.href} href={item.href} className="nav-link opacity-70 hover:opacity-100">{item.label}</Link>)}
      </div>
    </nav>
  );
}

export function PublicPage({ children, eyebrow, title, intro }: { children: React.ReactNode; eyebrow: string; title: React.ReactNode; intro?: string }) {
  return (
    <main className="min-h-screen overflow-x-clip bg-[#0C0C0C] text-[#D7E2EA]">
      <PublicNav />
      <header className="mx-auto max-w-6xl px-5 pb-16 pt-12 sm:px-8 sm:pb-20 md:px-10 md:pt-20">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="hero-heading max-w-5xl text-left font-black uppercase leading-[.88] tracking-tight" style={{ fontSize: 'clamp(3.5rem, 10vw, 9rem)' }}>{title}</h1>
        {intro && <p className="mt-8 max-w-2xl text-lg font-light leading-relaxed text-[#D7E2EA]/70 sm:text-xl">{intro}</p>}
      </header>
      {children}
      <footer className="mx-auto flex max-w-6xl flex-wrap justify-between gap-4 px-5 py-12 text-xs uppercase tracking-widest text-[#D7E2EA]/50 sm:px-8 md:px-10">
        <span>© {new Date().getFullYear()} {SITE.name}</span><Link href="/#contact" className="hover:text-[#D7E2EA]">Start a conversation ↗</Link>
      </footer>
    </main>
  );
}

export function SetupState({ label, detail }: { label: string; detail: string }) {
  return <div className="rounded-[32px] border border-[#D7E2EA]/20 bg-[#D7E2EA]/[.04] p-8 sm:p-12"><p className="mb-3 text-xs uppercase tracking-[.2em] text-[#B600A8]">{label}</p><p className="max-w-xl text-xl font-light leading-relaxed text-[#D7E2EA]/80">{detail}</p></div>;
}
