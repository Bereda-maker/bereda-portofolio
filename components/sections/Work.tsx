import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { STACK_ICON, SITE, type Project } from '@/data/content';
import TechIcon from '@/components/ui/TechIcon';
import { slugify } from '@/lib/slug';

const linkCls = 'inline-flex items-center gap-1 font-display text-[.95rem] font-semibold text-forest underline decoration-forest/30 underline-offset-4 hover:decoration-forest';
const real = (url: string) => url && url !== '#';

export default function Work({ projects }: { projects: Project[] }) {
  return (
    <section id="work" className="border-t border-rule">
      <div className="wrap py-20 md:py-28">
        <div className="grid gap-4 md:grid-cols-[1fr_1.1fr] md:gap-16">
          <h2 className="section-title">Selected work</h2>
          <p className="max-w-[32rem] text-muted">Projects I&rsquo;ve built, with a live site and source code wherever they&rsquo;re public.</p>
        </div>

        <ul className="mt-12 divide-y divide-rule border-y border-rule">
          {projects.slice(0, 6).map((p) => (
            <li key={p.title} className="grid gap-4 py-8 md:grid-cols-[1.3fr_1fr_6.5rem] md:items-start md:gap-10">
              <div>
                <p className="font-display text-[.85rem] text-muted">{p.category}</p>
                <h3 className="mt-1 font-display text-[1.35rem] font-semibold leading-tight tracking-[-.01em]">
                  <Link href={`/projects/${slugify(p.title)}`} className="hover:text-forest">{p.title}</Link>
                </h3>
                <p className="mt-2 max-w-[32rem] text-[1.05rem] text-muted">{p.description}</p>
              </div>
              <ul className="flex flex-wrap content-start gap-2" aria-label="Built with">
                {p.stack.slice(0, 5).map((t) => (
                  <li key={t} className="tag"><TechIcon k={STACK_ICON[t]} size={14} />{t}</li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-x-5 gap-y-2 md:flex-col md:items-start md:gap-y-2.5">
                <Link href={`/projects/${slugify(p.title)}`} className={linkCls}>Build log</Link>
                {real(p.demo) && <a href={p.demo} className={linkCls} target="_blank" rel="noopener noreferrer">Live site <ArrowUpRight size={15} aria-hidden="true" /><span className="sr-only">(opens in a new tab)</span></a>}
                {real(p.repo) && <a href={p.repo} className={linkCls} target="_blank" rel="noopener noreferrer">Source <ArrowUpRight size={15} aria-hidden="true" /><span className="sr-only">(opens in a new tab)</span></a>}
              </div>
            </li>
          ))}
        </ul>

        <p className="mt-8 font-display text-[.95rem] text-muted">
          More code on <a href={SITE.github} className="font-semibold text-forest underline decoration-forest/30 underline-offset-4 hover:decoration-forest" rel="noopener noreferrer">GitHub</a>.
        </p>
      </div>
    </section>
  );
}
