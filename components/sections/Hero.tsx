import { ArrowDownRight, Download, Github, Mail } from 'lucide-react';
import { SITE } from '@/data/content';

export default function Hero() {
  return (
    <section id="top" className="site-grid overflow-hidden border-b border-rule">
      <div className="wrap grid min-h-[calc(100vh-4.5rem)] items-center gap-12 py-16 lg:grid-cols-[1.15fr_.85fr] lg:gap-20 lg:py-24">
        <div>
          <p className="settle eyebrow flex items-center gap-2.5"><span className="beacon h-2.5 w-2.5 rounded-full bg-forest" aria-hidden="true" />Available for new product work</p>
          <h1 className="settle settle-2 mt-6 max-w-[13ch] font-display text-[clamp(3.4rem,7.8vw,7.4rem)] font-semibold leading-[.9] tracking-[-.07em]">I build the parts that make ideas real<span className="text-gold">.</span></h1>
          <p className="settle settle-3 mt-8 max-w-[39rem] text-[clamp(1.15rem,2vw,1.5rem)] leading-relaxed text-muted">I&rsquo;m {SITE.name}, a full-stack product engineer in {SITE.location}. I scope the smallest useful release, choose a practical architecture, and carry the work from the first workflow to a deployed product.</p>
          <div className="settle settle-3 mt-9 flex flex-wrap gap-3">
            <a href="#work" className="btn btn-primary">See complete products <ArrowDownRight size={17} aria-hidden="true" /></a>
            <a href={SITE.cv} download className="btn btn-quiet"><Download size={16} aria-hidden="true" /> Download CV</a>
          </div>
          <div className="mt-10 flex flex-wrap gap-x-5 gap-y-2 font-display text-[.9rem] text-muted">
            <a href={`mailto:${SITE.email}`} className="inline-flex items-center gap-2 transition hover:text-ink"><Mail size={15} aria-hidden="true" />{SITE.email}</a>
            <a href={SITE.github} className="inline-flex items-center gap-2 transition hover:text-ink" rel="noopener noreferrer"><Github size={15} aria-hidden="true" />GitHub / Bereda-maker</a>
          </div>
        </div>
        <aside aria-label="Product proof" className="settle settle-3 surface-card relative overflow-hidden p-6 sm:p-8">
          <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-gold/15 blur-2xl" aria-hidden="true" />
          <p className="eyebrow">A product-minded stack</p>
          <p className="mt-4 max-w-[20rem] font-display text-[1.65rem] font-semibold leading-tight tracking-[-.035em]">Useful flows first. Technology in service of the outcome.</p>
          <dl className="mt-8 divide-y divide-rule font-display text-[.95rem]">
            <div className="flex justify-between gap-6 py-3"><dt className="text-muted">Flagship product</dt><dd className="font-semibold">Deborah</dd></div>
            <div className="flex justify-between gap-6 py-3"><dt className="text-muted">Ships with</dt><dd className="text-right font-semibold">TypeScript + React</dd></div>
            <div className="flex justify-between gap-6 py-3"><dt className="text-muted">Data layer</dt><dd className="font-semibold">Postgres / MongoDB</dd></div>
            <div className="flex justify-between gap-6 py-3"><dt className="text-muted">Response time</dt><dd className="font-semibold">Within 24 hours</dd></div>
          </dl>
          <p className="mt-6 text-[.95rem] text-muted">Read the build notes, open the live products, and start with the workflow you want to improve.</p>
        </aside>
      </div>
    </section>
  );
}
