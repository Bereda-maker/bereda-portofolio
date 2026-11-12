import LifeAIMemoryWorkspace from '@/components/admin/LifeAIMemoryWorkspace';

export const metadata = {
  title: 'Memory & Personalization -- Admin',
  description: 'Manage private profile access, category permissions, export, and deletion for Your Life AI.',
};
export const dynamic = 'force-dynamic';

export default function LifeAIMemoryPage() {
  return (
    <div className="admin-page life-memory-page">
      <LifeAIMemoryWorkspace />
    </div>
  );
}
