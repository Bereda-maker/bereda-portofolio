import { AdminPageHeader } from '@/components/admin/AdminSetupState';
import MentorshipWorkspace from '@/components/admin/MentorshipWorkspace';

export const metadata = { title: 'Mentorship -- Admin' };
export const dynamic = 'force-dynamic';

export default function AdminMentorshipPage() {
  return (
    <div className="admin-page">
      <AdminPageHeader eyebrow="Programs / Mentorship" title="Mentorship" description="Manage mentor profiles, record sessions, grant student free minutes, and review time and amounts. These tracking records are separate from public calendar bookings." />
      <MentorshipWorkspace />
    </div>
  );
}
