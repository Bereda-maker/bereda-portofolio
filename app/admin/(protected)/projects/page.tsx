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
    <div className="flex flex-col gap-6">
      {dbError && (
        <div className="rounded-2xl border border-[#ff5c7a]/40 text-[#ff5c7a] px-5 py-4 text-sm">
          Could not reach the database. Check that <code>DATABASE_URL</code> is set correctly and migrations have been applied.
        </div>
      )}
      <ProjectsTable initialProjects={rows} />
    </div>
  );
}
