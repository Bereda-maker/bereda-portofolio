import { PROJECTS as verifiedProjects } from '@/data/content';
import type { Project } from '@/data/content';

/**
 * The public portfolio is intentionally sourced from the verified records in
 * data/content.ts. The former database seed contained placeholder work, so it
 * must not silently override the live links and case-study evidence here.
 */
export async function getProjects(): Promise<Project[]> {
  return verifiedProjects;
}
