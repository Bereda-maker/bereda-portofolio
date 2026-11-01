import { CheckCircle2, AlertCircle } from 'lucide-react';
import { AdminPageHeader, SetupRequired } from '@/components/admin/AdminSetupState';

export const metadata = { title: 'Settings & Integrations -- Admin' };
export const dynamic = 'force-dynamic';

function StatusRow({ label, configured, detail }: { label: string; configured: boolean; detail: string }) {
  return (
    <li className="admin-status-row">
      <span className={`admin-status-icon ${configured ? 'ok' : 'warn'}`} aria-hidden="true">{configured ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}</span>
      <div className="admin-status-copy"><strong>{label}</strong><span>{detail}</span></div>
      <span className={`admin-badge ${configured ? 'ok' : 'warn'}`}>{configured ? 'Configured' : 'Not configured'}</span>
    </li>
  );
}

export default function AdminSettingsPage() {
  const databaseConfigured = Boolean(process.env.DATABASE_URL);
  const sessionConfigured = Boolean(process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 32);

  return (
    <div className="admin-page">
      <AdminPageHeader eyebrow="System" title="Settings & integrations" description="See which server-side prerequisites are present. Secrets are never displayed, and an environment variable alone does not claim a provider integration is complete." />
      <section className="admin-card admin-panel" aria-label="Integration status">
        <ul className="admin-status-list">
          <StatusRow label="Postgres database" configured={databaseConfigured} detail={databaseConfigured ? 'DATABASE_URL is present.' : 'DATABASE_URL is missing.'} />
          <StatusRow label="Admin session" configured={sessionConfigured} detail={sessionConfigured ? 'SESSION_SECRET meets the minimum length.' : 'SESSION_SECRET is missing or too short.'} />
          <StatusRow label="Payments & protected files" configured={false} detail="No payment provider or private file-storage contract is configured." />
          <StatusRow label="Email & calendar" configured={false} detail="No email delivery or Google Calendar/Meet reconciliation is configured." />
          <StatusRow label="AI research" configured={false} detail="No opportunity-research provider or approval workflow is configured." />
        </ul>
      </section>
      <SetupRequired title="Configuration changes happen outside this page">
        Add provider credentials and backend migrations through the deployment environment, then implement server-side verification and retryable reconciliation before showing a connected status. This page is read-only by design.
      </SetupRequired>
    </div>
  );
}
