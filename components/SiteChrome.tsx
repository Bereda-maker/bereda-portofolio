'use client';

import Link from 'next/link';
import { ArrowUpRight, Download, Mail, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { NAV, SITE } from '@/data/content';
import ThemeToggle from '@/components/ThemeToggle';

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-paper/80 py-3 backdrop-blur-xl">
      <div className="wrap">
        <nav aria-label="Primary" className="relative flex flex-wrap items-center justify-between gap-3 rounded-full border border-rule bg-card/90 px-3 py-2 shadow-soft sm:px-4">
          <Link href="/" className="group flex min-w-0 items-center px-2 font-display text-[1rem] font-semibold tracking-tight">
            <span className="truncate">{SITE.name}</span>
          </Link>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <ul className="hidden items-center gap-1 rounded-full bg-panel/70 p-1 font-display text-[.83rem] sm:flex">
              {NAV.map((item) => <li key={item.href}><Link href={item.href} className="inline-flex rounded-full px-3 py-2 text-muted transition hover:bg-card hover:text-ink">{item.label}</Link></li>)}
            </ul>
            <a href={SITE.cv} download className="hidden items-center gap-1.5 rounded-full px-3 py-2 font-display text-[.83rem] font-semibold text-ink transition hover:bg-panel sm:inline-flex"><Download size={14} aria-hidden="true" /> CV</a>
            <ThemeToggle />
            <button type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-full text-ink transition hover:bg-panel sm:hidden" aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={menuOpen} aria-controls="mobile-navigation" onClick={() => setMenuOpen((open) => !open)}>
              {menuOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
            </button>
            <a href={`mailto:${SITE.email}`} className="btn btn-primary !hidden !gap-1.5 !px-3.5 !py-2.5 !text-[.82rem] sm:!inline-flex"><Mail size={14} aria-hidden="true" /> <span className="hidden md:inline">Email me</span><ArrowUpRight size={14} className="md:hidden" aria-hidden="true" /></a>
          </div>
          <div id="mobile-navigation" className={`${menuOpen ? 'flex' : 'hidden'} w-full basis-full flex-col border-t border-rule/70 pt-2 sm:hidden`}>
            <ul className="flex flex-col gap-1 font-display text-[.95rem]">
              {NAV.map((item) => <li key={item.href}><Link href={item.href} onClick={() => setMenuOpen(false)} className="block rounded-2xl px-4 py-3 text-muted transition hover:bg-panel hover:text-ink">{item.label}</Link></li>)}
              <li><a href={SITE.cv} download onClick={() => setMenuOpen(false)} className="block rounded-2xl px-4 py-3 font-semibold text-ink transition hover:bg-panel">Download CV</a></li>
              <li><a href={`mailto:${SITE.email}`} onClick={() => setMenuOpen(false)} className="block rounded-2xl bg-forest px-4 py-3 font-semibold text-white transition hover:bg-forest-dark">Email me</a></li>
            </ul>
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
