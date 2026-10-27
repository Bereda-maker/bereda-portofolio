import { AdminLink, AdminPageHeader, EmptyAdminState, SetupRequired } from '@/components/admin/AdminSetupState';

export const metadata = { title: 'Videos -- Admin' };
export const dynamic = 'force-dynamic';

export default function AdminVideosPage() {
  return (
    <div className="flex flex-col gap-8">
      <AdminPageHeader eyebrow="Publishing / Media" title="Videos & content" description="Manage video metadata and editorial drafts only after media storage and an approval workflow are connected." />
      <SetupRequired title="Video publishing is not configured">
        There are no video, media, content-draft, version, or publication-approval tables in the current backend. Uploads and publish actions are disabled until those contracts are implemented.
      </SetupRequired>
      <div className="flex flex-col gap-3">
        <h2 className="uppercase tracking-widest text-xs opacity-50">Draft queue</h2>
        <EmptyAdminState>No content drafts are available because the content backend has not been configured.</EmptyAdminState>
      </div>
      <div><AdminLink href="/admin/settings">Review integrations</AdminLink></div>
    </div>
  );
}
