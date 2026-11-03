import { PROJECTS as verifiedProjects } from '@/data/content';
import type { Project } from '@/data/content';
import { mergeProjectContent } from '@/lib/project-content';

/**
 * Public projects use the verified five-project catalog as the stable baseline.
 * When a matching database row exists, admin-saved content overlays that baseline.
 * If the database is unavailable, the public site remains fully renderable.
 */
export async function getProjects(): Promise<Project[]> {
  try {
    const { db } = await import('@/lib/db');
    const { projects } = await import('@/lib/schema');
    const rows = await db.select().from(projects);
    if (rows.length === 0) return verifiedProjects;
    const orderedRows = [...rows].sort((a, b) => a.id - b.id);
    return verifiedProjects.map((project, index) => mergeProjectContent(project, rows.find((row) => row.title === project.title) ?? orderedRows[index]));
  } catch {
    return verifiedProjects;
  }
}
