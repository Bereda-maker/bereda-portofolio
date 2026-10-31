import Image from 'next/image';
import { ArrowUpRight, Briefcase, GraduationCap, Laptop, Megaphone } from 'lucide-react';
import { EXPERIENCE, SITE } from '@/data/content';

const EXPERIENCE_ICONS = [Laptop, Megaphone, GraduationCap, Briefcase];

function ExperienceTimeline() {
  return <div className="grid gap-5 md:grid-cols-2">{EXPERIENCE.map(({ role, place, type, text, links }, i) => { const Icon = EXPERIENCE_ICONS[i]; return <article key={role} className="experience-card"><div className="flex items-start justify-between gap-4"><div className="experience-marker"><Icon size={17} aria-hidden="true" /><span>0{i + 1}</span></div><span className="font-display text-[.68rem] font-semibold uppercase tracking-[.16em] text-muted">{type.split(' · ')[0]}</span></div><p className="eyebrow mt-7">{type}</p><h3 className="mt-2 font-display text-[1.25rem] font-semibold leading-tight tracking-[-.02em]">{role}</h3><p className="mt-1 font-display text-[.92rem] font-semibold text-forest">{place}</p><p className="mt-4 text-[.98rem] text-muted">{text}</p>{links.length > 0 && <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2">{links.map((link) => <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-display text-[.82rem] font-semibold text-forest underline decoration-forest/30 underline-offset-4 hover:decoration-forest">{link.label}<ArrowUpRight size={13} aria-hidden="true" /></a>)}</div>}</article> })}</div>;
}

export default function About() {
  return <>
    <section id="about" className="border-b border-rule">
      <div className="wrap grid gap-12 py-20 md:grid-cols-[.7fr_1.3fr] md:gap-20 md:py-28">
        <div className="relative aspect-[4/5] w-full max-w-[21rem] overflow-hidden rounded-[2rem] bg-forest shadow-soft">
          <Image src={SITE.portrait} alt={`Portrait of ${SITE.name}`} fill sizes="336px" className="object-cover object-[58%_center]" />
          <div className="absolute bottom-0 left-0 right-0 bg-ink/75 px-5 py-4 font-display text-[.75rem] uppercase tracking-[.18em] text-white/80">Product engineer · Ethiopia</div>
        </div>
        <div>
          <p className="eyebrow">About</p>
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
    <section id="experience" className="border-b border-rule bg-panel">
      <div className="wrap py-20 md:py-28">
        <div className="grid gap-5 md:grid-cols-[.8fr_1.2fr] md:items-end md:gap-16"><div><p className="eyebrow">Experience</p><h2 className="section-title mt-3 max-w-[12ch]">A path from teaching to building.</h2></div><p className="max-w-[35rem] text-[1.15rem] text-muted">The products are only part of the story. Teaching, marketing, formal study, and startup leadership shaped how I understand people, systems, and the work required to make an idea useful.</p></div>
        <div className="mt-12"><ExperienceTimeline /></div>
      </div>
    </section>
  </>;
}
