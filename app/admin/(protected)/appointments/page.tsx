import { AdminPageHeader, SetupRequired } from '@/components/admin/AdminSetupState';

export const metadata = { title: 'Appointments -- Admin' };
export const dynamic = 'force-dynamic';

export default function AdminAppointmentsPage() {
  return (
    <div className="flex flex-col gap-8">
      <AdminPageHeader eyebrow="Programs / Scheduling" title="Appointments" description="Availability, blocked times, reservations, and calendar reconciliation will live here once scheduling has a server-side source of truth." />
      <SetupRequired title="Scheduling is not configured">
        The current schema has no availability, appointment, conflict-lock, or calendar-sync records. This page intentionally does not offer a booking form or show availability that cannot be verified.
      </SetupRequired>
    </div>
  );
}
