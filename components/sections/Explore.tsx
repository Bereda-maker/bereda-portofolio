import Link from 'next/link';
import { ArrowUpRight, BookOpen, CalendarDays, PlaySquare } from 'lucide-react';

const DESTINATIONS = [
  {
    number: '01',
    label: 'Books',
    title: 'Ideas worth returning to.',
    text: 'A growing shelf of books and reading material that informs how I think, build, and keep learning.',
    href: '/books',
    action: 'Browse the shelf',
    icon: BookOpen,
  },
  {
    number: '02',
    label: 'Media',
    title: 'See the work in motion.',
    text: 'Walkthroughs, demonstrations, and written notes about useful products, systems, and teams.',
    href: '/videos',
    action: 'Explore media',
    icon: PlaySquare,
    secondaryHref: '/content',
    secondaryAction: 'Read the writing',
  },
  {
    number: '03',
    label: 'Appointment',
    title: 'Make the next step concrete.',
    text: 'Choose a conversation purpose, find an available time, and bring a real product question to the table.',
    href: '/book',
    action: 'Book a conversation',
    icon: CalendarDays,
  },
];

export default function Explore() {
  return (
    <section id="explore" className="explore-section border-b border-rule" aria-labelledby="explore-title">
      <div className="wrap py-20 md:py-28">
        <div className="grid gap-6 md:grid-cols-[.8fr_1.2fr] md:items-end md:gap-16">
          <div>
            <p className="eyebrow">Beyond the portfolio</p>
            <h2 id="explore-title" className="section-title mt-3 max-w-[11ch]">A few useful places to go next.</h2>
          </div>
          <p className="max-w-[36rem] text-[1.12rem] text-muted">Browse the ideas behind the work, watch selected builds take shape, or set up a focused conversation about your own product.</p>
        </div>

        <div className="explore-grid mt-12">
          {DESTINATIONS.map(({ number, label, title, text, href, action, icon: Icon, secondaryHref, secondaryAction }) => (
            <article key={label} className="explore-card">
              <div className="flex items-start justify-between gap-4">
                <span className="explore-icon" aria-hidden="true"><Icon size={22} strokeWidth={1.8} /></span>
                <span className="explore-number">{number}</span>
              </div>
              <p className="eyebrow mt-8">{label}</p>
              <h3 className="mt-3 font-display text-[clamp(1.45rem,2.2vw,2rem)] font-semibold leading-tight tracking-[-.035em]">{title}</h3>
              <p className="mt-4 max-w-[28rem] text-[.98rem] leading-relaxed text-muted">{text}</p>
              <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
                <Link href={href} className="explore-link">{action} <ArrowUpRight size={15} aria-hidden="true" /></Link>
                {secondaryHref && <Link href={secondaryHref} className="explore-secondary-link">{secondaryAction}</Link>}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
