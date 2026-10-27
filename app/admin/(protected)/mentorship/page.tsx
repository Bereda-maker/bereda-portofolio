import { AdminPageHeader, SetupRequired } from '@/components/admin/AdminSetupState';

export const metadata = { title: 'Mentorship -- Admin' };
export const dynamic = 'force-dynamic';

export default function AdminMentorshipPage() {
  return (
    <div className="flex flex-col gap-8">
      <AdminPageHeader eyebrow="Programs / Mentorship" title="Mentorship" description="A future workspace for students, session history, pricing, and the minute-level allowance ledger." />
      <SetupRequired title="Mentorship records are not configured">
        There are no student profiles, mentorship sessions, pricing rules, or per-student free-hour ledger in the current schema. No students, hours, or revenue metrics are shown until those records and accounting rules exist.
      </SetupRequired>
    </div>
  );
}
