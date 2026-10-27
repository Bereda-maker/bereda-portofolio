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
    <div className="min-h-screen" style={{ background: '#0C0C0C', color: '#D7E2EA' }}>
      <header className="flex flex-wrap items-center justify-between gap-4 px-5 sm:px-8 md:px-10 py-5 border-b border-[#D7E2EA]/10">
        <div className="flex items-center gap-8 sm:gap-10">
          <span className="font-black uppercase tracking-wide text-lg">Bereda <span className="opacity-50 font-light">/ Admin</span></span>
          <nav className="flex max-w-full flex-wrap gap-x-5 gap-y-2 uppercase text-xs tracking-widest">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="hover:opacity-70 transition-opacity duration-200">
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/" target="_blank" className="text-sm uppercase tracking-widest opacity-70 hover:opacity-100 transition-opacity">
            View site ↗
          </Link>
          <LogoutButton />
        </div>
      </header>
      <main className="px-5 sm:px-8 md:px-10 py-10 max-w-6xl mx-auto">{children}</main>
    </div>
  );
}
