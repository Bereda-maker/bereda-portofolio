import { Github, Linkedin } from 'lucide-react';
import { SITE } from '@/data/content';

export default function Hero() {
  return (
    <section id="top" className="wrap pb-20 pt-14 sm:pt-20 md:pb-28">
      <div className="grid gap-12 md:grid-cols-[1.4fr_1fr] md:items-start md:gap-16">
        <div>
          <p className="settle flex items-center gap-2.5 font-display text-[.95rem] font-medium text-forest">
            <span className="beacon h-2.5 w-2.5 rounded-full bg-forest" aria-hidden="true" />
            Available for new projects
          </p>
          <h1 className="settle settle-2 mt-5 font-display text-[clamp(2.3rem,4.7vw,3.5rem)] font-semibold leading-[1.02] tracking-[-.035em]">
            I build web applications, from the database to the interface.
          </h1>
          <p className="settle settle-3 mt-7 max-w-[34rem] text-[1.2rem] leading-relaxed text-muted">
            I&rsquo;m {SITE.name}, a full-stack developer in {SITE.location}. I work mostly in TypeScript, React and PostgreSQL, and I take a project from the first sketch to a deployed product.
          </p>
          <div className="settle settle-3 mt-9 flex flex-wrap gap-3">
            <a href={`mailto:${SITE.email}`} className="btn btn-primary">Email me</a>
            <a href="#work" className="btn btn-quiet">See my work</a>
          </div>
        </div>

        <aside aria-label="Quick facts" className="settle settle-3 rounded-lg border border-rule bg-panel p-6 sm:p-7">
          <dl className="divide-y divide-rule font-display text-[.95rem]">
            <div className="flex justify-between gap-6 pb-3.5"><dt className="text-muted">Based in</dt><dd className="font-medium">{SITE.location}</dd></div>
            <div className="flex justify-between gap-6 py-3.5"><dt className="text-muted">Replies</dt><dd className="font-medium">Within 24 hours</dd></div>
            <div className="flex justify-between gap-6 py-3.5"><dt className="shrink-0 text-muted">Mostly uses</dt><dd className="text-right font-medium">TypeScript, React, PostgreSQL</dd></div>
            <div className="flex justify-between gap-6 pt-3.5">
              <dt className="text-muted">Elsewhere</dt>
              <dd className="flex gap-4 font-medium">
                <a href={SITE.github} className="inline-flex items-center gap-1.5 underline decoration-ink/30 underline-offset-4 hover:decoration-ink" rel="noopener noreferrer"><Github size={16} aria-hidden="true" />GitHub</a>
                {SITE.linkedin && <a href={SITE.linkedin} className="inline-flex items-center gap-1.5 underline decoration-ink/30 underline-offset-4 hover:decoration-ink" rel="noopener noreferrer"><Linkedin size={16} aria-hidden="true" />LinkedIn</a>}
              </dd>
            </div>
          </dl>
        </aside>
      </div>
    </section>
  );
}
