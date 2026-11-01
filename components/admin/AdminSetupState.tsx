import Link from 'next/link';
import { ArrowUpRight, Inbox, Wrench, type LucideIcon } from 'lucide-react';

export function AdminPageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <header className="admin-page-header">
      <div>
        {eyebrow && <p className="admin-eyebrow">{eyebrow}</p>}
        <h1 className="admin-title">{title}</h1>
        {description && <p className="admin-description">{description}</p>}
      </div>
      {actions && <div className="admin-actions">{actions}</div>}
    </header>
  );
}

export function SetupRequired({ title = 'Setup required', children }: { title?: string; children: React.ReactNode }) {
  return (
    <section className="admin-notice">
      <span className="admin-notice-icon" aria-hidden="true"><Wrench size={16} /></span>
      <div>
        <h2>{title}</h2>
        <div className="admin-notice-body">{children}</div>
      </div>
    </section>
  );
}

export function EmptyAdminState({ children, icon: Icon = Inbox }: { children: React.ReactNode; icon?: LucideIcon }) {
  return (
    <div className="admin-empty">
      <span className="admin-empty-icon" aria-hidden="true"><Icon size={18} /></span>
      <p>{children}</p>
    </div>
  );
}

export function AdminLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <Link href={href} className="admin-button-secondary">{children}<ArrowUpRight size={14} aria-hidden="true" /></Link>;
}
