import Link from 'next/link';
import { asc, desc, eq } from 'drizzle-orm';
import { ArrowRight, ArrowUpRight, BookOpen, CalendarDays, PlaySquare } from 'lucide-react';

type BookPreview = {
  id: number;
  title: string;
  author: string | null;
  description: string | null;
  coverUrl: string | null;
};

async function getBookPreviews(): Promise<{ books: BookPreview[]; unavailable: boolean }> {
  try {
    const { db } = await import('@/lib/db');
    const { books } = await import('@/lib/schema');
    const rows = await db.select({
      id: books.id,
      title: books.title,
      author: books.author,
      description: books.description,
      metadata: books.metadata,
    }).from(books)
      .where(eq(books.isPublished, true))
      .orderBy(desc(books.publishedAt), asc(books.title))
      .limit(3);

    return {
      books: rows.map((book) => ({
        id: book.id,
        title: book.title,
        author: book.author,
        description: book.description,
        coverUrl: typeof book.metadata?.coverUrl === 'string' ? book.metadata.coverUrl : null,
      })),
      unavailable: false,
    };
  } catch (error) {
    console.error('[homepage/books]', error instanceof Error ? error.message : error);
    return { books: [], unavailable: true };
  }
}

export default async function Explore() {
  const { books, unavailable } = await getBookPreviews();

  return (
    <>
      <section id="books" className="explore-section explore-section--books border-b border-rule" aria-labelledby="books-title">
        <div className="wrap py-20 md:py-28">
          <div className="grid gap-10 md:grid-cols-[.8fr_1.2fr] md:items-end md:gap-16">
            <div>
              <span className="explore-icon" aria-hidden="true"><BookOpen size={22} strokeWidth={1.8} /></span>
              <p className="eyebrow mt-7">Books</p>
              <h2 id="books-title" className="section-title mt-3 max-w-[10ch]">Ideas worth returning to.</h2>
            </div>
            <div className="max-w-[38rem]">
              <p className="text-[1.15rem] text-muted">A growing shelf of books and reading material that informs how I think, build, and keep learning.</p>
              <Link href="/books" className="explore-link mt-7">Browse the shelf <ArrowUpRight size={15} aria-hidden="true" /></Link>
            </div>
          </div>

          {unavailable ? (
            <p className="mt-10 text-sm text-muted" role="status">The book shelf is temporarily unavailable. Browse the full catalog for more details.</p>
          ) : books.length > 0 ? (
            <div className="book-preview-grid mt-12" aria-label="Featured books">
              {books.map((book) => (
                <article key={book.id} className="book-preview-card">
                  <div className="book-preview-cover">
                    {book.coverUrl ? (
                      // External cover links are entered by the admin; a plain img keeps the homepage host-agnostic.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={book.coverUrl} alt={`${book.title} cover`} loading="lazy" />
                    ) : (
                      <BookOpen size={28} aria-hidden="true" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-display text-lg font-semibold leading-tight tracking-[-.02em]">{book.title}</h3>
                    {book.author && <p className="mt-1 text-sm text-muted">By {book.author}</p>}
                    {book.description && <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted">{book.description}</p>}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="mt-10 text-sm text-muted">Published titles will appear here when they are ready to share.</p>
          )}
        </div>
      </section>

      <section id="media" className="explore-section explore-section--media border-b border-rule bg-forest-dark text-white" aria-labelledby="media-title">
        <div className="wrap py-20 md:py-28">
          <div className="grid gap-10 md:grid-cols-[1.1fr_.9fr] md:items-center md:gap-16">
            <div>
              <span className="explore-icon explore-icon--dark" aria-hidden="true"><PlaySquare size={22} strokeWidth={1.8} /></span>
              <p className="explore-eyebrow mt-7">Media</p>
              <h2 id="media-title" className="section-title mt-3 max-w-[11ch] text-white">See the work in motion.</h2>
            </div>
            <div>
              <p className="text-[1.15rem] text-white/65">Walkthroughs, demonstrations, and written notes about useful products, systems, and teams.</p>
              <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3">
                <Link href="/videos" className="explore-link explore-link--dark">Explore videos <ArrowUpRight size={15} aria-hidden="true" /></Link>
                <Link href="/content" className="explore-secondary-link explore-secondary-link--dark">Read the writing <ArrowRight size={15} aria-hidden="true" /></Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="appointment" className="explore-section explore-section--appointment border-b border-rule" aria-labelledby="appointment-title">
        <div className="wrap py-20 md:py-28">
          <div className="appointment-panel">
            <div className="grid gap-10 md:grid-cols-[.85fr_1.15fr] md:items-center md:gap-16">
              <div>
                <span className="explore-icon explore-icon--appointment" aria-hidden="true"><CalendarDays size={22} strokeWidth={1.8} /></span>
                <p className="eyebrow mt-7">Appointment</p>
                <h2 id="appointment-title" className="section-title mt-3 max-w-[11ch]">Make the next step concrete.</h2>
              </div>
              <div>
                <p className="max-w-[38rem] text-[1.15rem] text-muted">Choose a conversation purpose, find an available time, and bring a real product question to the table.</p>
                <Link href="/book" className="btn btn-primary mt-7">Book a conversation <ArrowUpRight size={16} aria-hidden="true" /></Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
