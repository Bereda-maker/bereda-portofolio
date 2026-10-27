import { AdminPageHeader, SetupRequired } from '@/components/admin/AdminSetupState';

export const metadata = { title: 'Settings & Integrations -- Admin' };
export const dynamic = 'force-dynamic';

function StatusRow({ label, configured, detail }: { label: string; configured: boolean; detail: string }) {
  return (
    <div className="flex flex-col gap-2 border-b border-[#D7E2EA]/10 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div><div className="font-medium">{label}</div><div className="text-sm opacity-60">{detail}</div></div>
      <span className={`w-fit rounded-full px-3 py-1 text-xs uppercase tracking-widest ${configured ? 'bg-[#2D8A63]/20 text-[#78D6A5]' : 'bg-[#E0B04B]/15 text-[#E0B04B]'}`}>{configured ? 'Configured' : 'Not configured'}</span>
    </div>
  );
}

export default function AdminSettingsPage() {
  const databaseConfigured = Boolean(process.env.DATABASE_URL);
  const sessionConfigured = Boolean(process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 32);

  return (
    <div className="flex flex-col gap-8">
      <AdminPageHeader eyebrow="Operations / Configuration" title="Settings & integrations" description="See which server-side prerequisites are present. Secrets are never displayed, and an environment variable alone does not claim a provider integration is complete." />
      <section className="rounded-[28px] border border-[#D7E2EA]/15 px-5 sm:px-8">
        <StatusRow label="Postgres database" configured={databaseConfigured} detail={databaseConfigured ? 'DATABASE_URL is present.' : 'DATABASE_URL is missing.'} />
        <StatusRow label="Admin session" configured={sessionConfigured} detail={sessionConfigured ? 'SESSION_SECRET meets the minimum length.' : 'SESSION_SECRET is missing or too short.'} />
        <StatusRow label="Payments & protected files" configured={false} detail="No payment provider or private file-storage contract is configured." />
        <StatusRow label="Email & calendar" configured={false} detail="No email delivery or Google Calendar/Meet reconciliation is configured." />
        <StatusRow label="AI research" configured={false} detail="No opportunity-research provider or approval workflow is configured." />
      </section>
      <SetupRequired title="Configuration changes happen outside this page">
        Add provider credentials and backend migrations through the deployment environment, then implement server-side verification and retryable reconciliation before showing a connected status. This page is read-only by design.
      </SetupRequired>
    </div>
  );
}
