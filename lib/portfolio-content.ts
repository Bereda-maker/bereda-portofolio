import { z } from 'zod';

export const CONTENT_PREFIX = 'portfolio-content:';

export const ContentInput = z.object({
  title: z.string().trim().min(1).max(200),
  slug: z.string().trim().max(120).optional().or(z.literal('')),
  category: z.string().trim().max(100).optional().or(z.literal('')),
  summary: z.string().trim().max(500),
  body: z.string().max(20_000).refine((value) => value.trim().length > 0, 'Body is required.'),
  status: z.enum(['draft', 'published']),
}).strict();

export type PortfolioContent = {
  title: string;
  slug: string;
  category?: string;
  summary: string;
  body: string;
  status: 'draft' | 'published';
  publishedAt: string | null;
};

export type ContentInputValue = z.infer<typeof ContentInput>;

export function slugFromTitle(title: string): string {
  const base = title.toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 120)
    .replace(/-+$/g, '');
  if (base) return base;

  // Keep non-Latin titles addressable without collapsing all of them to "article".
  let hash = 2166136261;
  for (const character of title) {
    hash = Math.imul(hash ^ (character.codePointAt(0) ?? 0), 16777619);
  }
  return `article-${(hash >>> 0).toString(36)}`;
}

export function isPortfolioContent(value: unknown): value is PortfolioContent {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  return typeof item.title === 'string' && item.title.trim().length > 0 && item.title.length <= 200
    && typeof item.slug === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.slug) && item.slug.length <= 120
    && (item.category === undefined || (typeof item.category === 'string' && item.category.length <= 100))
    && typeof item.summary === 'string' && item.summary.length <= 500
    && typeof item.body === 'string' && item.body.trim().length > 0 && item.body.length <= 20_000
    && (item.status === 'draft' || item.status === 'published')
    && (item.publishedAt === null || typeof item.publishedAt === 'string');
}

export function contentKey(slug: string): string {
  return `${CONTENT_PREFIX}${slug}`;
}

export function normalizeContent(input: ContentInputValue, existingPublishedAt: string | null): PortfolioContent {
  const slug = input.slug ? slugFromTitle(input.slug) : slugFromTitle(input.title);
  return {
    title: input.title,
    slug,
    ...(input.category ? { category: input.category } : {}),
    summary: input.summary,
    body: input.body,
    status: input.status,
    publishedAt: input.status === 'published' ? existingPublishedAt ?? new Date().toISOString() : existingPublishedAt,
  };
}
