import type { Metadata } from 'next';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { Note, PublicPage } from '@/components/PublicPage';
import { contentKey, isPortfolioContent } from '@/lib/portfolio-content';
export const dynamic = 'force-dynamic';
type Props = { params: { slug: string } };
async function getArticle(slug: string) {
  try {
    const { db } = await import('@/lib/db'); const { siteSettings } = await import('@/lib/schema');
    const [row] = await db.select().from(siteSettings).where(eq(siteSettings.key, contentKey(slug))).limit(1);
    return row && isPortfolioContent(row.value) && row.value.status === 'published' && row.value.slug === slug ? { article: row.value, unavailable: false } : { article: null, unavailable: false };
  } catch (error) { console.error('[content/detail]', error instanceof Error ? error.message : error); return { article: null, unavailable: true }; }
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { article } = await getArticle(params.slug);
  return article ? { title: article.title, description: article.summary } : { title: 'Article not found' };
}
export default async function ContentDetailPage({ params }: Props) {
  const { article, unavailable } = await getArticle(params.slug);
  if (!article && !unavailable) notFound();
  return <PublicPage title={article?.title ?? 'Content unavailable'} intro={article?.summary ?? ''}><section className="wrap pb-24">{unavailable ? <Note><p role="status">Content is temporarily unavailable. Please try again later.</p></Note> : article ? <article className="mx-auto max-w-[48rem]"><div className="mb-8 border-b border-rule pb-5">{article.category && <p className="font-display text-xs font-semibold uppercase tracking-[.14em] text-forest">{article.category}</p>}{article.publishedAt && <time className="mt-2 block text-sm text-muted" dateTime={article.publishedAt}>{new Date(article.publishedAt).toLocaleDateString()}</time>}</div><div className="whitespace-pre-wrap break-words leading-relaxed text-ink">{article.body}</div></article> : null}</section></PublicPage>;
}
