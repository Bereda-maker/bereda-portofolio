import { AdminPageHeader } from '@/components/admin/AdminSetupState';
import AuditWorkspace from '@/components/admin/AuditWorkspace';

export const metadata = { title: 'Audit & Activity -- Admin' };
export const dynamic = 'force-dynamic';

export default function AdminAuditPage() {
  return (
    <div className="admin-page">
      <AdminPageHeader eyebrow="Operations / Accountability" title="Audit & activity" description="Review administrator changes with timestamps, entity references, and redacted before/after details." />
      <AuditWorkspace />
    </div>
  );
}
