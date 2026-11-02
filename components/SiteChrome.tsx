'use client';

import Link from 'next/link';
import { ArrowUpRight, CalendarDays, ChevronDown, Download, Mail, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { NAV, SITE } from '@/data/content';
import ThemeToggle from '@/components/ThemeToggle';

const desktopLink = 'inline-flex items-center rounded-full px-2.5 py-2 font-display text-[.76rem] font-semibold text-muted transition hover:bg-panel hover:text-ink';
const menuSummary = 'inline-flex cursor-pointer list-none items-center gap-1 rounded-full px-2.5 py-2 font-display text-[.76rem] font-semibold text-muted transition hover:bg-panel hover:text-ink [&::-webkit-details-marker]:hidden';

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-paper/80 py-3 backdrop-blur-xl">
      <div className="wrap">
        <nav aria-label="Primary" className={`relative flex flex-wrap items-center justify-between gap-3 px-3 py-2 sm:px-4 ${menuOpen ? 'rounded-3xl border border-transparent bg-transparent shadow-none' : 'rounded-full border border-rule bg-card/90 shadow-soft'}`}>
          <Link href="/#top" className="group flex min-w-0 items-center px-2 font-display text-[1rem] font-semibold tracking-tight" onClick={() => setMenuOpen(false)}>
            <span className="truncate">{SITE.name}</span>
          </Link>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <ul className="hidden items-center gap-0.5 xl:flex">
              {NAV.map((item) => <li key={item.label}>
                {item.items ? <details className="group relative">
                  <summary className={menuSummary}>{item.label}<ChevronDown size={13} aria-hidden="true" className="transition-transform group-open:rotate-180" /></summary>
                  <ul className="absolute left-0 top-full z-50 mt-2 min-w-64 rounded-2xl border border-rule bg-card p-2 font-display text-[.88rem] shadow-soft">
                    {item.items.map((child) => <li key={child.href}><Link href={child.href} className="block rounded-xl px-4 py-3 text-muted transition hover:bg-panel hover:text-ink">{child.label}</Link></li>)}
                  </ul>
                </details> : <Link href={item.href || '/'} className={item.label === 'Appointment' ? 'btn btn-primary !inline-flex !gap-1.5 !px-3 !py-2 !text-[.75rem]' : desktopLink}>
                  {item.label === 'Appointment' && <CalendarDays size={13} aria-hidden="true" />}{item.label}
                </Link>}
              </li>)}
            </ul>
            <a href={SITE.cv} download className="hidden items-center gap-1.5 rounded-full px-3 py-2 font-display text-[.78rem] font-semibold text-ink transition hover:bg-panel 2xl:inline-flex"><Download size={14} aria-hidden="true" /> CV</a>
            <ThemeToggle />
            <button type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-full text-ink transition hover:bg-panel xl:hidden" aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={menuOpen} aria-controls="mobile-navigation" onClick={() => setMenuOpen((open) => !open)}>
              {menuOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
            </button>
            <a href={`mailto:${SITE.email}`} className="btn btn-primary !hidden !gap-1.5 !px-3.5 !py-2.5 !text-[.82rem] 2xl:!inline-flex"><Mail size={14} aria-hidden="true" /> <span>Email me</span><ArrowUpRight size={14} aria-hidden="true" /></a>
          </div>
          <div id="mobile-navigation" className={`${menuOpen ? 'flex' : 'hidden'} w-full basis-full flex-col pt-2 xl:hidden`}>
            <ul className="flex flex-col gap-1 font-display text-[.95rem]">
              {NAV.map((item) => <li key={item.label}>
                {item.items ? <details className="group rounded-2xl">
                  <summary className="flex cursor-pointer list-none items-center justify-between rounded-2xl px-4 py-3 font-semibold text-ink transition hover:bg-panel [&::-webkit-details-marker]:hidden">
                    {item.label}<ChevronDown size={16} aria-hidden="true" className="transition-transform group-open:rotate-180" />
                  </summary>
                  <ul className="mb-2 ml-3 border-l border-rule pl-3">
                    {item.items.map((child) => <li key={child.href}><Link href={child.href} onClick={() => setMenuOpen(false)} className="block rounded-xl px-4 py-2.5 text-sm text-muted transition hover:bg-panel hover:text-ink">{child.label}</Link></li>)}
                  </ul>
                </details> : <Link href={item.href || '/'} onClick={() => setMenuOpen(false)} className={`block rounded-2xl px-4 py-3 transition hover:bg-panel ${item.label === 'Appointment' ? 'bg-gold font-semibold text-ink hover:bg-[#ffd263]' : 'text-muted hover:text-ink'}`}>{item.label}</Link>}
              </li>)}
              <li><a href={SITE.cv} download onClick={() => setMenuOpen(false)} className="block rounded-2xl px-4 py-3 font-semibold text-ink transition hover:bg-panel">Download CV</a></li>
              <li><a href={`mailto:${SITE.email}`} onClick={() => setMenuOpen(false)} className="block rounded-2xl px-4 py-3 font-semibold text-muted transition hover:bg-panel hover:text-ink">Email me</a></li>
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
          <li><Link href="/content" className="hover:text-ink">Writing</Link></li>
          <li><a href="#top" className="hover:text-ink">Back to top</a></li>
        </ul>
      </div>
    </footer>
  );
}
