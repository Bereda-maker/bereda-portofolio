import Link from 'next/link';
import { NAV, SITE } from '@/data/content';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-rule bg-paper/90 backdrop-blur">
      <nav aria-label="Primary" className="wrap flex items-center justify-between gap-4 py-3.5">
        <Link href="/" className="font-display text-[1.05rem] font-semibold tracking-tight">
          {SITE.name}
        </Link>
        <div className="flex items-center gap-5 sm:gap-7">
          <ul className="flex items-center gap-4 font-display text-[.95rem] sm:gap-6">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-muted transition-colors hover:text-ink">{item.label}</Link>
              </li>
            ))}
          </ul>
          <a href={`mailto:${SITE.email}`} className="btn btn-primary hidden !py-2.5 sm:inline-flex">Email me</a>
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
          {SITE.linkedin && <li><a href={SITE.linkedin} className="hover:text-ink" rel="noopener noreferrer">LinkedIn</a></li>}
          <li><Link href="/journey" className="hover:text-ink">How I work</Link></li>
          <li><a href="#top" className="hover:text-ink">Back to top</a></li>
        </ul>
      </div>
    </footer>
  );
}
