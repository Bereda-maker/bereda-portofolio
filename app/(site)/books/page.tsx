import type { Metadata } from 'next';
import { asc, desc, eq } from 'drizzle-orm';
import { ArrowUpRight, BookOpen } from 'lucide-react';
import { Note, PublicPage } from '@/components/PublicPage';

export const metadata: Metadata = {
  title: 'Books',
  description: 'Books and reading material shared on Bereda Wako’s portfolio.',
};
export const dynamic = 'force-dynamic';

type CatalogBook = {
  id: number;
  title: string;
  author: string | null;
  description: string | null;
  category: string | null;
  slug: string;
  coverUrl: string | null;
  externalBookUrl: string | null;
};

async function getPublishedBooks(): Promise<{ books: CatalogBook[]; unavailable: boolean }> {
  try {
    const { db } = await import('@/lib/db');
    const { books, categories } = await import('@/lib/schema');
    const rows = await db.select({
      id: books.id,
      title: books.title,
      author: books.author,
      description: books.description,
      category: categories.name,
      slug: books.slug,
      metadata: books.metadata,
    }).from(books).leftJoin(categories, eq(books.categoryId, categories.id))
      .where(eq(books.isPublished, true))
      .orderBy(desc(books.publishedAt), asc(books.title));
    return {
      books: rows.map((book) => ({
        id: book.id,
        title: book.title,
        author: book.author,
        description: book.description,
        category: book.category,
        slug: book.slug,
        coverUrl: typeof book.metadata?.coverUrl === 'string' ? book.metadata.coverUrl : null,
        externalBookUrl: typeof book.metadata?.externalBookUrl === 'string' ? book.metadata.externalBookUrl : null,
      })),
      unavailable: false,
    };
  } catch (error) {
    console.error('[books/catalog]', error instanceof Error ? error.message : error);
    return { books: [], unavailable: true };
  }
}

export default async function BooksPage() {
  const { books, unavailable } = await getPublishedBooks();
  return (
    <PublicPage title="Books" intro="A small catalog of books and reading worth sharing.">
      <section className="wrap pb-24" aria-label="Published books">
        {unavailable ? (
          <Note><p role="status">The book catalog is temporarily unavailable. Please try again later.</p></Note>
        ) : books.length === 0 ? (
          <Note>
            <BookOpen size={24} className="text-forest" aria-hidden="true" />
            <h2 className="mt-4 font-display text-xl font-semibold">No books published yet</h2>
            <p className="mt-2 text-muted">Published titles will appear here when they are ready to share.</p>
          </Note>
        ) : (
          <ul className="divide-y divide-rule border-y border-rule">
            {books.map((book) => (
              <li key={book.id} className="grid gap-5 py-7 sm:grid-cols-[8rem_minmax(0,1fr)] sm:gap-8">
                <div className="aspect-[3/4] overflow-hidden rounded-lg border border-rule bg-panel">
                  {book.coverUrl ? (
                    // External cover links are entered by the admin; using a plain img avoids locking the project to a single image host.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={book.coverUrl} alt={`${book.title} cover`} className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-3 p-4 text-center text-muted"><BookOpen size={26} aria-hidden="true" /><span className="font-display text-sm">Book cover</span></div>
                  )}
                </div>
                <div className="flex flex-col items-start py-1">
                  {book.category && <p className="font-display text-xs font-semibold uppercase tracking-[.14em] text-forest">{book.category}</p>}
                  <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight">{book.title}</h2>
                  {book.author && <p className="mt-1 text-muted">By {book.author}</p>}
                  {book.description && <p className="mt-4 max-w-[48rem] whitespace-pre-line leading-relaxed text-muted">{book.description}</p>}
                  {book.externalBookUrl && <a href={book.externalBookUrl} target="_blank" rel="noopener noreferrer" className="btn btn-quiet mt-5">View book details <ArrowUpRight size={15} aria-hidden="true" /></a>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </PublicPage>
  );
}
