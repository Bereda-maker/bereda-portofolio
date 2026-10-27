import { PROJECTS as fallbackProjects, type Project } from '@/data/content';

/**
 * Loads projects from Postgres. `./db` is imported dynamically, inside the
 * try/catch, so that a missing DATABASE_URL (local dev without a database,
 * a build step with no env vars yet, etc.) can never throw during module
 * evaluation and crash the page — it just falls back to the static list in
 * data/content.ts and logs why.
 */
export async function getProjects(): Promise<Project[]> {
  try {
    const { db } = await import('./db');
    const { projects } = await import('./schema');
    const rows = await db.select().from(projects).orderBy(projects.id);
    if (rows.length === 0) return fallbackProjects;
    return rows.map((r) => ({
      title: r.title,
      category: r.category,
      description: r.description,
      stack: r.stack,
      demo: r.demo,
      repo: r.repo,
    }));
  } catch (err) {
    console.error('[projects] Falling back to static data/content.ts:', err instanceof Error ? err.message : err);
    return fallbackProjects;
  }
}
