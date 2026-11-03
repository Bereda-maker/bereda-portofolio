import { z } from 'zod';
import type { Project } from '@/data/content';
import type { ProjectRow } from '@/lib/schema';

export const CaseStudyContentSchema = z.object({
  eyebrow: z.string().trim().max(160),
  tagline: z.string().trim().max(500),
  context: z.string().trim().max(4000),
  problem: z.string().trim().max(4000),
  contribution: z.string().trim().max(4000),
  workflow: z.string().trim().max(4000),
  architecture: z.string().trim().max(4000),
  integrations: z.string().trim().max(4000),
  verification: z.string().trim().max(4000),
  evidence: z.array(z.object({ label: z.string().trim().min(1).max(160), href: z.string().trim().url() })).max(12),
  features: z.array(z.string().trim().min(1).max(300)).max(20),
  next: z.string().trim().max(4000),
}).partial();

export const ProjectContentSchema = z.object({
  image: z.string().trim().max(2000),
  walkthrough: z.string().trim().max(2000),
  alt: z.string().trim().max(300),
  status: z.string().trim().max(120),
  role: z.string().trim().max(2000),
  featured: z.boolean(),
  caseStudy: CaseStudyContentSchema,
}).partial();

export type EditableProjectContent = z.infer<typeof ProjectContentSchema>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function contentForProject(project?: ProjectRow | null): EditableProjectContent {
  if (!project || !isRecord(project.content)) return {};
  const parsed = ProjectContentSchema.safeParse(project.content);
  return parsed.success ? parsed.data : {};
}

export function mergeProjectContent(base: Project, row?: ProjectRow | null): Project {
  const content = contentForProject(row);
  const study = content.caseStudy;
  const { caseStudy: _ignoredCaseStudy, ...scalarContent } = content;
  return {
    ...base,
    ...(row ? { title: row.title, category: row.category, description: row.description, stack: row.stack, demo: row.demo, repo: row.repo } : {}),
    ...scalarContent,
    ...(study ? { caseStudy: { ...(base.caseStudy ?? {}), ...study } as Project['caseStudy'] } : {}),
  };
}
