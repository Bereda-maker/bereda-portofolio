'use client';
import { TECH } from '@/data/content';

export default function Marquee() {
  const featured = TECH.slice(0, 12);
  return (
    <section className="reference-tech-strip relative overflow-hidden px-5 py-10 sm:px-8 md:px-10">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-5"><p className="reference-eyebrow mb-0">TOOLS I USE TO SHIP</p><div className="reference-tech-list">{featured.map(([name]) => <span key={name}>{name}</span>)}</div></div>
    </section>
  );
}
