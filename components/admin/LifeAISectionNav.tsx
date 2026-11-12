'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Brain, SlidersHorizontal, UserRound } from 'lucide-react';

const links = [
  { href: '/admin/life-ai', label: 'AI Chat', icon: Brain, exact: true },
  { href: '/admin/life-ai/profile', label: 'My Life Profile', icon: UserRound, exact: false },
  { href: '/admin/life-ai/memory', label: 'Memory & Personalization', icon: SlidersHorizontal, exact: false },
];

export default function LifeAISectionNav() {
  const pathname = usePathname();
  return <nav className="life-ai-section-nav" aria-label="Your Life AI sections">
    {links.map(({ href, label, icon: Icon, exact }) => {
      const active = exact ? pathname === href : pathname.startsWith(href);
      return <Link key={href} href={href} aria-current={active ? 'page' : undefined} className={active ? 'active' : ''}>
        <Icon size={16} aria-hidden="true" /> <span>{label}</span>
      </Link>;
    })}
  </nav>;
}
