import Link from 'next/link';
import { Download, Mail } from 'lucide-react';
import { NAV, SITE } from '@/data/content';
import ThemeToggle from '@/components/ThemeToggle';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-rule/80 bg-paper/85 backdrop-blur-xl">
      <nav aria-label="Primary" className="wrap flex items-center justify-between gap-4 py-3.5">
        <Link href="/" className="group flex items-center gap-2 font-display text-[1.05rem] font-semibold tracking-tight">
          <span className="h-2.5 w-2.5 rounded-full bg-gold transition-transform group-hover:scale-125" aria-hidden="true" />
          {SITE.name}
        </Link>
        <div className="flex items-center gap-2 sm:gap-5">
          <ul className="hidden items-center gap-5 font-display text-[.9rem] sm:flex">
            {NAV.map((item) => <li key={item.href}><Link href={item.href} className="text-muted transition-colors hover:text-ink">{item.label}</Link></li>)}
          </ul>
          <a href={SITE.cv} download className="hidden items-center gap-1.5 font-display text-[.9rem] font-semibold text-ink sm:inline-flex"><Download size={15} aria-hidden="true" /> CV</a>
          <ThemeToggle />
          <a href={`mailto:${SITE.email}`} className="btn btn-primary hidden !px-4 !py-2.5 md:inline-flex"><Mail size={15} aria-hidden="true" /> Email me</a>
        </div>
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-rule">
      <div className="wrap flex flex-wrap items-center justify-between gap-x-8 gap-y-3 py-8 font-display text-[.9rem] text-muted">
        <p>© {new Date().getFullYear()} {SITE.name}</p>
        <ul className="flex flex-wrap gap-x-6 gap-y-2">
          <li><a href={SITE.github} className="hover:text-ink" rel="noopener noreferrer">GitHub</a></li>
          <li><a href={SITE.cv} download className="hover:text-ink">Download CV</a></li>
          <li><Link href="/journey" className="hover:text-ink">How I work</Link></li>
          <li><a href="#top" className="hover:text-ink">Back to top</a></li>
        </ul>
      </div>
    </footer>
  );
}
