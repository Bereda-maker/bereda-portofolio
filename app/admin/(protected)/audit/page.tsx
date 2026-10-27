import { AdminPageHeader, EmptyAdminState, SetupRequired } from '@/components/admin/AdminSetupState';

export const metadata = { title: 'Audit & Activity -- Admin' };
export const dynamic = 'force-dynamic';

export default function AdminAuditPage() {
  return (
    <div className="flex flex-col gap-8">
      <AdminPageHeader eyebrow="Operations / Accountability" title="Audit & activity" description="A privacy-conscious record of administrative changes, provider events, and reconciliation attempts." />
      <SetupRequired title="Audit logging is not configured">
        The current backend has no audit-event table, structured event sink, retention policy, or actor metadata. No activity timeline is shown until those pieces are implemented.
      </SetupRequired>
      <EmptyAdminState>There are no auditable events to display.</EmptyAdminState>
    </div>
  );
}
