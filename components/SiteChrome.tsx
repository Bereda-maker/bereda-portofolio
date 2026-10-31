import Link from 'next/link';
import { ArrowUpRight, Download, Mail } from 'lucide-react';
import { NAV, SITE } from '@/data/content';
import ThemeToggle from '@/components/ThemeToggle';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 bg-paper/80 py-3 backdrop-blur-xl">
      <div className="wrap">
        <nav aria-label="Primary" className="flex items-center justify-between gap-3 rounded-full border border-rule bg-card/90 px-3 py-2 shadow-soft sm:px-4">
          <Link href="/" className="group flex min-w-0 items-center gap-2.5 px-2 font-display text-[1rem] font-semibold tracking-tight">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-gold transition-transform group-hover:scale-125" aria-hidden="true" />
            <span className="truncate">{SITE.name}</span>
          </Link>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <ul className="hidden items-center gap-1 rounded-full bg-panel/70 p-1 font-display text-[.83rem] sm:flex">
              {NAV.map((item) => <li key={item.href}><Link href={item.href} className="inline-flex rounded-full px-3 py-2 text-muted transition hover:bg-card hover:text-ink">{item.label}</Link></li>)}
            </ul>
            <a href={SITE.cv} download className="hidden items-center gap-1.5 rounded-full px-3 py-2 font-display text-[.83rem] font-semibold text-ink transition hover:bg-panel sm:inline-flex"><Download size={14} aria-hidden="true" /> CV</a>
            <ThemeToggle />
            <a href={`mailto:${SITE.email}`} className="btn btn-primary !hidden !gap-1.5 !px-3.5 !py-2.5 !text-[.82rem] sm:!inline-flex"><Mail size={14} aria-hidden="true" /> <span className="hidden md:inline">Email me</span><ArrowUpRight size={14} className="md:hidden" aria-hidden="true" /></a>
          </div>
        </nav>
      </div>
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
