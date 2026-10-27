import { AdminPageHeader, SetupRequired } from '@/components/admin/AdminSetupState';

export const metadata = { title: 'Opportunities -- Admin' };
export const dynamic = 'force-dynamic';

export default function AdminOpportunitiesPage() {
  return (
    <div className="flex flex-col gap-8">
      <AdminPageHeader eyebrow="AI Workspace / Research" title="Opportunities" description="Review candidate profiles, companies, contacts, applications, and evidence-backed opportunity matches." />
      <SetupRequired title="Opportunity research is not configured">
        No candidate, company, contact, application, source-evidence, matching, approval, or daily-limit tables exist yet. No opportunities or outreach activity is fabricated in this workspace.
      </SetupRequired>
    </div>
  );
}
