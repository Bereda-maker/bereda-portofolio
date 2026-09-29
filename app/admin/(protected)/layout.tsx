import Link from 'next/link';
import LogoutButton from '@/components/admin/LogoutButton';

const NAV = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/projects', label: 'Projects' },
  { href: '/admin/messages', label: 'Messages' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: '#0C0C0C', color: '#D7E2EA' }}>
      <header className="flex flex-wrap items-center justify-between gap-4 px-5 sm:px-8 md:px-10 py-5 border-b border-[#D7E2EA]/10">
        <div className="flex items-center gap-8 sm:gap-10">
          <span className="font-black uppercase tracking-wide text-lg">Bereda <span className="opacity-50 font-light">/ Admin</span></span>
          <nav className="flex gap-6 uppercase text-sm tracking-widest">
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
