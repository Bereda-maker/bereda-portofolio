import { AdminPageHeader, SetupRequired } from '@/components/admin/AdminSetupState';
import AppointmentsPanel from '@/components/admin/AppointmentsPanel';

export const metadata = { title: 'Appointments -- Admin' };
export const dynamic = 'force-dynamic';

export default function AdminAppointmentsPage({ searchParams }: { searchParams?: { calendar?: string; reason?: string } }) {
  const calendarMessage = searchParams?.calendar === 'connected' ? 'Google Calendar connected successfully.' : searchParams?.calendar === 'error' ? `Calendar connection failed: ${searchParams.reason || 'unknown error'}.` : '';
  return (
    <div className="admin-page admin-page-wide">
      <AdminPageHeader eyebrow="Programs / Scheduling" title="Appointments" description="Connect your calendar, define availability, and manage the conversations visitors request through your portfolio." />
      <AppointmentsPanel initialCalendarMessage={calendarMessage} />
    </div>
  );
}
