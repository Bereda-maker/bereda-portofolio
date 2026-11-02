import Link from 'next/link';
import { ArrowRight, ArrowUpRight, BookOpen, CalendarDays, PlaySquare } from 'lucide-react';

export default function Explore() {
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
