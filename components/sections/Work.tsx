import Link from 'next/link';
import { ArrowUpRight, Github, LockKeyhole } from 'lucide-react';
import { STACK_ICON, SITE, type Project } from '@/data/content';
import TechIcon from '@/components/ui/TechIcon';
import { slugify } from '@/lib/slug';

const real = (url: string) => url && url !== '#';
const linkCls = 'inline-flex items-center gap-1.5 font-display text-[.88rem] font-semibold text-forest underline decoration-forest/30 underline-offset-4 hover:decoration-forest';

export default function Work({ projects }: { projects: Project[] }) {
  return (
    <section id="work" className="border-b border-rule">
      <div className="wrap py-20 md:py-28">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div><p className="eyebrow">Selected work</p><h2 className="section-title mt-3 max-w-[13ch]">Complete products, real workflows.</h2></div>
          <p className="max-w-[31rem] text-[1.1rem] text-muted">Open the live site, inspect the source, or read the case study to see how the product was scoped, built, tested, and prepared for handoff.</p>
        </div>
        <div className="mt-12 grid gap-7 lg:grid-cols-2">
          {projects.map((p, i) => <article key={p.title} className={`project-card group overflow-hidden rounded-[1.65rem] border border-rule bg-card shadow-soft ${i === 0 ? 'lg:col-span-2 lg:grid lg:grid-cols-[1.1fr_.9fr]' : ''}`}>
            <Link href={`/projects/${slugify(p.title)}`} className="block overflow-hidden bg-panel" aria-label={`Read the ${p.title} case study`}>
              <img src={p.image} alt={p.alt} className={`project-image ${i === 0 ? 'lg:aspect-auto lg:h-full lg:min-h-[24rem]' : ''}`} />
            </Link>
            <div className="flex flex-col p-6 sm:p-8">
              <div className="flex items-start justify-between gap-5"><div><p className="eyebrow">{p.category}</p><h3 className="mt-3 font-display text-[clamp(1.65rem,3vw,2.35rem)] font-semibold leading-tight tracking-[-.04em]"><Link href={`/projects/${slugify(p.title)}`} className="hover:text-forest">{p.title}</Link></h3></div><span className="shrink-0 rounded-full border border-forest/25 bg-forest/10 px-3 py-1 font-display text-[.72rem] font-semibold uppercase tracking-[.12em] text-forest">{p.status}</span></div>
              <p className="mt-4 max-w-[37rem] text-[1.08rem] leading-relaxed text-muted">{p.description}</p>
              <p className="mt-5 max-w-[38rem] text-[.92rem] text-muted"><span className="font-display font-semibold text-ink">My contribution:</span> {p.role}</p>
              <ul className="mt-6 flex flex-wrap gap-2" aria-label="Built with">{p.stack.map((t) => <li key={t} className="tag"><TechIcon k={STACK_ICON[t]} size={14} />{t}</li>)}</ul>
              <div className="mt-auto flex flex-wrap gap-x-5 gap-y-3 border-t border-rule pt-6 sm:mt-8">
                <Link href={`/projects/${slugify(p.title)}`} className={linkCls}>Read case study <ArrowUpRight size={15} aria-hidden="true" /></Link>
                {real(p.demo) && <a href={p.demo} className={linkCls} target="_blank" rel="noopener noreferrer">Live site <ArrowUpRight size={15} aria-hidden="true" /></a>}
                {real(p.repo) ? <a href={p.repo} className={linkCls} target="_blank" rel="noopener noreferrer"><Github size={15} aria-hidden="true" />Repository</a> : <span className="inline-flex items-center gap-1.5 font-display text-[.88rem] text-muted"><LockKeyhole size={14} aria-hidden="true" />Source not provided</span>}
              </div>
            </div>
          </article>)}
        </div>
        <p className="mt-8 font-display text-[.92rem] text-muted">More public code and experiments live on <a href={SITE.github} className="font-semibold text-forest underline decoration-forest/30 underline-offset-4 hover:decoration-forest" rel="noopener noreferrer">GitHub</a>.</p>
      </div>
    </section>
  );
}
