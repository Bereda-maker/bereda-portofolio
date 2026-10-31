import Link from 'next/link';
import { redirect } from 'next/navigation';
import LogoutButton from '@/components/admin/LogoutButton';
import { isAdminRequest } from '@/lib/auth';

const NAV = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/projects', label: 'Projects' },
  { href: '/admin/messages', label: 'Messages' },
  { href: '/admin/books', label: 'Books' },
  { href: '/admin/mentorship', label: 'Mentorship' },
  { href: '/admin/appointments', label: 'Appointments' },
  { href: '/admin/opportunities', label: 'Opportunities' },
  { href: '/admin/videos', label: 'Videos & content' },
  { href: '/admin/settings', label: 'Settings' },
  { href: '/admin/audit', label: 'Audit' },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAdminRequest())) redirect('/admin/login');

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link href="/admin" className="admin-brand">
          <span className="admin-brand-mark">B</span>
          <span className="admin-brand-copy"><strong>Bereda</strong><span>Control center</span></span>
        </Link>
        <nav className="admin-nav" aria-label="Admin navigation">
          <span className="admin-nav-label">Workspace</span>
          {NAV.map((n) => <Link key={n.href} href={n.href}>{n.label}</Link>)}
        </nav>
        <div className="admin-sidebar-footer">
          <Link href="/" target="_blank">View public site ↗</Link>
          <LogoutButton />
        </div>
      </aside>
      <div className="admin-main">
        <header className="admin-topbar">
          <span className="admin-topbar-meta">Private workspace / Bereda portfolio</span>
          <div className="flex items-center gap-3"><Link href="/" target="_blank" className="admin-button-secondary !px-4 !py-2 !text-[.65rem]">View site ↗</Link><LogoutButton /></div>
        </header>
        <main className="admin-content">{children}</main>
      </div>
    </div>
  );
}
