import { PROJECTS as featuredProjects, type Project } from '@/data/content';

/**
 * Keeps the verified portfolio repository set canonical, while still showing
 * additional admin-managed projects when they have a real source repository.
 * This prevents seeded placeholder rows with repo="#" from hiding the actual work.
 */
export async function getProjects(): Promise<Project[]> {
  try {
    const { db } = await import('./db');
    const { projects } = await import('./schema');
    const rows = await db.select().from(projects).orderBy(projects.id);
    const featuredRepos = new Set(featuredProjects.map((project) => project.repo.toLowerCase()));
    const additional = rows
      .filter((row) => /^https:\/\/github\.com\//i.test(row.repo) && !featuredRepos.has(row.repo.toLowerCase()))
      .map((row) => ({
        title: row.title,
        category: row.category,
        description: row.description,
        stack: row.stack,
        demo: row.demo === '#' ? undefined : row.demo,
        repo: row.repo,
      }));
    return [...featuredProjects, ...additional];
  } catch (err) {
    console.error('[projects] Falling back to static GitHub-backed project list:', err instanceof Error ? err.message : err);
    return featuredProjects;
  }
}
