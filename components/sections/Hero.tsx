import Image from 'next/image';
import { ArrowDownRight, ArrowUpRight, Mail } from 'lucide-react';
import { SITE } from '@/data/content';

export default function Hero() {
  return (
    <section id="top" className="overflow-hidden border-b border-rule">
      <div className="wrap grid min-h-[calc(100vh-5.5rem)] items-center gap-10 py-10 sm:py-14 lg:grid-cols-[.92fr_1.08fr] lg:gap-14 lg:py-16">
        <div className="relative z-10 max-w-[42rem]">
          <p className="settle eyebrow flex items-center gap-2.5"><span className="beacon h-2.5 w-2.5 rounded-full bg-forest" aria-hidden="true" />Full-stack product engineer</p>
          <h1 className="settle settle-2 mt-5 max-w-[10ch] font-display text-[clamp(3.6rem,8vw,7.7rem)] font-semibold leading-[.86] tracking-[-.075em]">I build useful digital products<span className="text-gold">.</span></h1>
          <p className="settle settle-3 mt-6 max-w-[25rem] text-[clamp(1.05rem,1.8vw,1.3rem)] leading-snug text-muted">From the first workflow to a live, maintainable release.</p>
          <div className="settle settle-3 mt-8 flex flex-wrap gap-3">
            <a href="#work" className="btn btn-primary">View my work <ArrowDownRight size={16} aria-hidden="true" /></a>
            <a href="#contact" className="btn btn-quiet">Let&rsquo;s talk <ArrowUpRight size={16} aria-hidden="true" /></a>
          </div>
          <a href={`mailto:${SITE.email}`} className="mt-7 inline-flex items-center gap-2 font-display text-[.88rem] font-medium text-muted transition hover:text-ink"><Mail size={15} aria-hidden="true" />{SITE.email}</a>
        </div>
        <div className="settle settle-3 hero-portrait-stage relative min-h-[28rem] overflow-hidden rounded-[2.5rem] sm:min-h-[35rem] lg:min-h-[min(45rem,calc(100vh-9rem))]">
          <div className="hero-portrait-orb" aria-hidden="true" />
          <div className="absolute left-6 top-6 z-10 rounded-full border border-white/20 bg-black/20 px-3.5 py-2 font-display text-[.68rem] font-semibold uppercase tracking-[.18em] text-white backdrop-blur-md">Bereda Wako / 2026</div>
          <Image src={SITE.portrait} alt={`Portrait of ${SITE.name}`} fill priority sizes="(max-width: 1024px) 100vw, 55vw" className="hero-portrait object-contain object-bottom" />
          <div className="absolute bottom-5 left-5 right-5 z-10 flex items-end justify-between gap-4 rounded-[1.4rem] border border-white/15 bg-black/25 p-4 text-white backdrop-blur-md sm:p-5"><div><p className="font-display text-[.68rem] uppercase tracking-[.18em] text-white/60">Selected build</p><p className="mt-1 font-display text-lg font-semibold">Deborah / Education SaaS</p></div><span className="h-2.5 w-2.5 rounded-full bg-gold shadow-[0_0_0_6px_rgba(226,177,62,.18)]" aria-label="Live product" /></div>
        </div>
      </div>
    </section>
  );
}
