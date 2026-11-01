import type { Metadata } from 'next';
import Link from 'next/link';
import { desc, like } from 'drizzle-orm';
import { FileText } from 'lucide-react';
import { Note, PublicPage } from '@/components/PublicPage';
import { CONTENT_PREFIX, isPortfolioContent, type PortfolioContent } from '@/lib/portfolio-content';

export const metadata: Metadata = {
  title: 'Writing',
  description: 'Articles and writing from Bereda Wako.',
};
export const dynamic = 'force-dynamic';

async function getArticles(): Promise<{ articles: PortfolioContent[]; unavailable: boolean }> {
  try {
    const { db } = await import('@/lib/db');
    const { siteSettings } = await import('@/lib/schema');
    const rows = await db.select().from(siteSettings)
      .where(like(siteSettings.key, `${CONTENT_PREFIX}%`))
      .orderBy(desc(siteSettings.updatedAt));
    const articles = rows.map((row) => row.value)
      .filter((value): value is PortfolioContent => isPortfolioContent(value) && value.status === 'published')
      .sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''));
    return { articles, unavailable: false };
  } catch (error) {
    console.error('[content/index]', error instanceof Error ? error.message : error);
    return { articles: [], unavailable: true };
  }
}

export default async function ContentPage() {
  const { articles, unavailable } = await getArticles();
  return (
    <PublicPage title="Writing" intro="Notes and articles on building useful products, systems, and teams.">
      <section className="wrap pb-24" aria-label="Published articles">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-rule bg-card p-5 sm:p-6">
          <p className="max-w-[38rem] text-muted">Prefer to watch? Browse the video walkthroughs and demonstrations.</p>
          <Link href="/videos" className="btn btn-quiet">Browse videos</Link>
        </div>
        {unavailable ? (
          <Note><p role="status">Writing is temporarily unavailable. Please try again later.</p></Note>
        ) : articles.length === 0 ? (
          <Note>
            <FileText size={24} className="text-forest" aria-hidden="true" />
            <h2 className="mt-4 font-display text-xl font-semibold">No articles published yet</h2>
            <p className="mt-2 text-muted">Published writing will appear here when it is ready to share.</p>
          </Note>
        ) : (
          <ul className="divide-y divide-rule border-y border-rule">
            {articles.map((article) => (
              <li key={article.slug} className="py-7">
                <article>
                  {article.category && <p className="font-display text-xs font-semibold uppercase tracking-[.14em] text-forest">{article.category}</p>}
                  <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight"><Link className="hover:underline" href={`/content/${encodeURIComponent(article.slug)}`}>{article.title}</Link></h2>
                  {article.publishedAt && <time className="mt-2 block text-sm text-muted" dateTime={article.publishedAt}>{new Date(article.publishedAt).toLocaleDateString()}</time>}
                  {article.summary && <p className="mt-3 max-w-[48rem] whitespace-pre-line leading-relaxed text-muted">{article.summary}</p>}
                  <Link className="btn btn-quiet mt-4" href={`/content/${encodeURIComponent(article.slug)}`}>Read article</Link>
                </article>
              </li>
            ))}
          </ul>
        )}
      </section>
    </PublicPage>
  );
}
