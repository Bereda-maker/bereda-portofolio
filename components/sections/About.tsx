import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';
import { SITE } from '@/data/content';

export default function About() {
  return (
    <section id="about" className="border-b border-rule">
      <div className="wrap grid gap-12 py-20 md:grid-cols-[.7fr_1.3fr] md:gap-20 md:py-28">
        <div className="relative aspect-[4/5] w-full max-w-[21rem] overflow-hidden rounded-[2rem] bg-forest shadow-soft">
          <Image src={SITE.portrait} alt={`Portrait of ${SITE.name}`} fill sizes="336px" className="object-cover object-[50%_12%]" />
          <div className="absolute bottom-0 left-0 right-0 bg-ink/75 px-5 py-4 font-display text-[.75rem] uppercase tracking-[.18em] text-white/80">Product engineer · Ethiopia</div>
        </div>
        <div>
          <p className="eyebrow">About + experience</p>
          <h2 className="section-title mt-3 max-w-[15ch]">The work between an idea and a working product.</h2>
          <div className="mt-7 max-w-[43rem] space-y-5 text-[1.15rem] text-muted">
            <p>I&rsquo;m {SITE.name}, a full-stack product engineer based in {SITE.location}. I work across the data model, API, interface, integrations, deployment, and the documentation that lets a team keep moving.</p>
            <p>My strongest work is product-shaped: Deborah&rsquo;s learning loop, Negus Gebeya&rsquo;s buyer/seller flow, TenaSew&rsquo;s bounded wellness experience, and EthioVista&rsquo;s travel discovery surface. I like the details that make a workflow feel dependable: useful errors, explicit states, server-side rules, and honest release notes.</p>
          </div>
          <div className="mt-9 grid gap-4 sm:grid-cols-3">
            <div className="border-t border-rule pt-3"><p className="font-display text-2xl font-semibold text-ink">04</p><p className="mt-1 text-sm text-muted">products led by the workflow</p></div>
            <div className="border-t border-rule pt-3"><p className="font-display text-2xl font-semibold text-ink">E2E</p><p className="mt-1 text-sm text-muted">from schema to interface</p></div>
            <div className="border-t border-rule pt-3"><p className="font-display text-2xl font-semibold text-ink">QA</p><p className="mt-1 text-sm text-muted">evidence linked per case study</p></div>
          </div>
          <a href={SITE.cv} download className="btn btn-quiet mt-9">Download the one-page CV <ArrowUpRight size={16} aria-hidden="true" /></a>
        </div>
      </div>
    </section>
  );
}
