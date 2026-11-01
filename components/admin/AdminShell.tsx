'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowUpRight, Menu, Search, X } from 'lucide-react';
import CommandPalette from './CommandPalette';
import LogoutButton from './LogoutButton';
import { ALL_NAV_ITEMS, NAV_GROUPS, isActive } from './nav';

export default function AdminShell({ unread, children }: { unread: number; children: React.ReactNode }) {
  const pathname = usePathname();
  const [drawer, setDrawer] = useState(false);
  const [palette, setPalette] = useState(false);
  const [isMac, setIsMac] = useState(false);

  useEffect(() => { setIsMac(/Mac|iPhone|iPad/.test(navigator.platform)); }, []);
  useEffect(() => { setDrawer(false); }, [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPalette((v) => !v); }
      if (e.key === 'Escape') setDrawer(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const current = ALL_NAV_ITEMS.find((item) => isActive(item, pathname));

  return (
    <div className="admin-shell">
      <a href="#admin-main" className="admin-skip">Skip to content</a>
      {drawer && <div className="admin-scrim" onClick={() => setDrawer(false)} aria-hidden="true" />}

      <aside className={`admin-sidebar${drawer ? ' open' : ''}`} aria-label="Sidebar">
        <div className="admin-sidebar-head">
          <Link href="/admin" className="admin-brand">
            <span className="admin-brand-mark">B</span>
            <span className="admin-brand-copy"><strong>Bereda</strong><span>Control center</span></span>
          </Link>
          <button type="button" className="admin-icon-btn admin-drawer-close" aria-label="Close menu" onClick={() => setDrawer(false)}><X size={18} /></button>
        </div>

        <nav className="admin-nav" aria-label="Admin navigation">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="admin-nav-group">
              <span className="admin-nav-label">{group.label}</span>
              {group.items.map((item) => {
                const active = isActive(item, pathname);
                return (
                  <Link key={item.href} href={item.href} aria-current={active ? 'page' : undefined} className={`admin-nav-link${active ? ' active' : ''}`}>
                    <item.icon size={17} aria-hidden="true" />
                    <span>{item.label}</span>
                    {item.badge === 'unread' && unread > 0 && <span className="admin-nav-badge" aria-label={`${unread} unread`}>{unread > 99 ? '99+' : unread}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <Link href="/" target="_blank" rel="noopener noreferrer" className="admin-nav-link"><ArrowUpRight size={17} aria-hidden="true" /><span>View public site</span></Link>
          <LogoutButton />
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <button type="button" className="admin-icon-btn admin-menu-btn" aria-label="Open menu" aria-expanded={drawer} onClick={() => setDrawer(true)}><Menu size={18} /></button>
            <nav aria-label="Breadcrumb" className="admin-crumbs">
              <span>Admin</span>
              <span aria-hidden="true">/</span>
              <strong aria-current="page">{current?.label ?? 'Workspace'}</strong>
            </nav>
          </div>
          <div className="admin-topbar-right">
            <button type="button" className="admin-search-trigger" onClick={() => setPalette(true)} aria-label="Search pages and actions">
              <Search size={15} aria-hidden="true" />
              <span>Search or jump to…</span>
              <kbd>{isMac ? '⌘' : 'Ctrl'} K</kbd>
            </button>
          </div>
        </header>
        <main id="admin-main" className="admin-content" tabIndex={-1}>{children}</main>
      </div>

      <CommandPalette open={palette} onClose={() => setPalette(false)} />
    </div>
  );
}
