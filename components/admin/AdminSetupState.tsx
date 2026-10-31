import Link from 'next/link';

export function AdminPageHeader({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <header className="admin-page-header">
      <div><p className="admin-eyebrow">{eyebrow}</p><h1 className="admin-title">{title}</h1><p className="admin-description">{description}</p></div>
    </header>
  );
}

export function SetupRequired({ title = 'Setup required', children }: { title?: string; children: React.ReactNode }) {
  return (
    <section className="admin-notice">
      <div className="flex items-start gap-4">
        <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[#f0bd48]" aria-hidden="true" />
        <div>
          <h2 className="font-bold text-lg">{title}</h2>
          <div className="mt-2 text-sm opacity-70 leading-relaxed">{children}</div>
        </div>
      </div>
    </section>
  );
}

export function EmptyAdminState({ children }: { children: React.ReactNode }) {
  return <div className="admin-card border-dashed px-5 py-8 text-sm text-[#aebedd]">{children}</div>;
}

export function AdminLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <Link href={href} className="admin-button-secondary">{children}</Link>;
}
