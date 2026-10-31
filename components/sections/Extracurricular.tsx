import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';
import { EXTRACURRICULAR } from '@/data/content';

export default function Extracurricular() {
  return <section id="extracurricular" className="border-b border-rule bg-forest-dark text-white">
    <div className="wrap py-20 md:py-28">
      <div className="grid gap-5 md:grid-cols-[.8fr_1.2fr] md:items-end md:gap-16"><div><p className="extracurricular-eyebrow">Extracurricular</p><h2 className="section-title mt-3 max-w-[12ch] text-white">The things that keep the work human.</h2></div><p className="max-w-[35rem] text-[1.15rem] text-white/65">Outside product work, I make time for study, music, and reading — practices that sharpen attention, patience, and imagination.</p></div>
      <div className="mt-12 grid gap-5 lg:grid-cols-3">{EXTRACURRICULAR.map((item) => <article key={item.title} className="extracurricular-card"><div className="extracurricular-media"><Image src={item.image} alt={item.alt} fill sizes="(min-width: 1024px) 31vw, (min-width: 640px) 50vw, 100vw" className="object-cover" /><span>{item.label}</span></div><div className="p-5 sm:p-6"><h3 className="font-display text-[1.45rem] font-semibold tracking-[-.03em]">{item.title}</h3><p className="mt-3 text-[.98rem] text-white/65">{item.text}</p><a href="#contact" className="mt-5 inline-flex items-center gap-1.5 font-display text-[.82rem] font-semibold text-[#f0bd48] underline decoration-[#f0bd48]/30 underline-offset-4 hover:decoration-[#f0bd48]">Keep exploring <ArrowUpRight size={13} aria-hidden="true" /></a></div></article>)}</div>
    </div>
  </section>;
}
