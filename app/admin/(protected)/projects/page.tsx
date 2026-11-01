import { Suspense } from 'react';
import { AlertTriangle } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminSetupState';
import ProjectsTable from '@/components/admin/ProjectsTable';
import type { ProjectRow } from '@/lib/schema';

export const metadata = { title: 'Projects -- Admin' };
export const dynamic = 'force-dynamic';

async function loadProjects(): Promise<{ rows: ProjectRow[]; dbError: boolean }> {
  try {
    const { db } = await import('@/lib/db');
    const { projects } = await import('@/lib/schema');
    const rows = await db.select().from(projects).orderBy(projects.id);
    return { rows, dbError: false };
  } catch (err) {
    console.error('[admin/projects page] Failed to load projects:', err instanceof Error ? err.message : err);
    return { rows: [], dbError: true };
  }
}

export default async function AdminProjectsPage() {
  const { rows, dbError } = await loadProjects();
  return (
    <div className="admin-page">
      <AdminPageHeader eyebrow="Content" title="Projects" description="The work shown on your public portfolio. Edits go live within a minute." />
      {dbError && (
        <div className="admin-error" role="alert">
          <AlertTriangle size={16} aria-hidden="true" />
          <span>Could not reach the database. Check that <code>DATABASE_URL</code> is set correctly and migrations have been applied.</span>
        </div>
      )}
      <Suspense fallback={<div className="admin-skeleton" style={{ height: '18rem' }} />}>
        <ProjectsTable initialProjects={rows} />
      </Suspense>
    </div>
  );
}
