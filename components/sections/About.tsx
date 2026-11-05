import SectionDivider from '@/components/SectionDivider';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Briefcase, GraduationCap, Laptop, Megaphone } from 'lucide-react';
import { SITE } from '@/data/content';

const EXPERIENCE_ICONS = [Laptop, Megaphone, GraduationCap, Briefcase];


function ExperienceTimeline({ experiences }: { experiences: Array<{ slug:string; role:string; place:string; type:string; image:string; imageAlt:string; text:string; details:string[]; links:{label:string;href:string}[] }> }) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      {experiences.map((experience, index) => {
        const Icon = EXPERIENCE_ICONS[index] ?? Briefcase;
        const experienceId = `experience-${experience.slug}`;

        return (
          <article id={experienceId} key={experience.slug} className="experience-card scroll-mt-28 overflow-hidden p-0">
            <Link
              href={`/experience/${experience.slug}`}
              aria-label={`View details for ${experience.role} at ${experience.place}`}
              className="group relative block aspect-[16/9] overflow-hidden bg-forest"
            >
              <Image
                src={experience.image}
                alt={experience.imageAlt}
                fill
                unoptimized={/^https?:\/\//i.test(experience.image)}
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover transition-transform duration-500 group-hover:scale-[1.035]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-forest-dark/60 via-transparent to-transparent" aria-hidden="true" />
              <span className="absolute bottom-4 left-4 rounded-full border border-white/25 bg-forest-dark/75 px-3 py-1 font-display text-[.68rem] font-semibold uppercase tracking-[.14em] text-white">
                {experience.place}
              </span>
            </Link>

            <div className="flex h-full flex-col p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="experience-marker">
                  <Icon size={17} aria-hidden="true" />
                  <span>0{index + 1}</span>
                </div>
                <span className="font-display text-[.68rem] font-semibold uppercase tracking-[.16em] text-muted">
                  {experience.type.split(' · ')[0]}
                </span>
              </div>
              <p className="eyebrow mt-6">{experience.type}</p>
              <h3 className="mt-2 font-display text-[1.25rem] font-semibold leading-tight tracking-[-.02em]">
                {experience.role}
              </h3>
              <p className="mt-1 font-display text-[.92rem] font-semibold text-forest">{experience.place}</p>
              <p className="mt-4 text-[.98rem] text-muted">{experience.text}</p>

              {experience.links.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2">
                  {experience.links.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 font-display text-[.82rem] font-semibold text-forest underline decoration-forest/30 underline-offset-4 hover:decoration-forest"
                    >
                      {link.label}
                      <ArrowUpRight size={13} aria-hidden="true" />
                    </a>
                  ))}
                </div>
              )}

              <Link href={`/experience/${experience.slug}`} className="btn btn-primary mt-6 w-fit">
                View details
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </article>
        );
      })}
    </div>
  );
}

export default function About({ experiences }: { experiences: Array<{ slug:string; role:string; place:string; type:string; image:string; imageAlt:string; text:string; details:string[]; links:{label:string;href:string}[] }> }) {
  return (
    <>
      <section id="about">
        <div className="wrap grid gap-12 py-20 md:grid-cols-[.7fr_1.3fr] md:gap-20 md:py-28">
          <div className="about-portrait relative aspect-[4/5] w-full max-w-[21rem] overflow-hidden rounded-[1.65rem] bg-forest shadow-soft ring-1 ring-ink/10">
            <Image src={SITE.portrait} alt={`Portrait of ${SITE.name}`} fill sizes="(min-width: 768px) 336px, 100vw" className="object-cover object-[center_29%]" priority />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/90 via-ink/65 to-transparent px-5 pb-5 pt-12 font-display text-[.72rem] font-semibold uppercase tracking-[.15em] text-white/90 backdrop-blur-[2px]">Product engineer · Ethiopia</div>
          </div>
          <div>
            <p className="eyebrow">About</p>
            <h2 className="section-title mt-3 max-w-[15ch]">The work between an idea and a working product.</h2>
            <div className="mt-7 max-w-[43rem] space-y-5 text-[1.15rem] text-muted">
              <p>I&rsquo;m {SITE.name}, a full-stack product engineer based in {SITE.location}. I work across the data model, API, interface, integrations, deployment, and the documentation that lets a team keep moving.</p>
              <p>My work spans Deborah&rsquo;s learning loop, Negus Gebeya&rsquo;s buyer/seller flow, TenaSew&rsquo;s bounded wellness experience, EthioVista&rsquo;s travel discovery surface, and this portfolio platform itself. I like the details that make a workflow feel dependable: useful errors, explicit states, server-side rules, and honest release notes.</p>
            </div>
            <div className="mt-9 grid gap-4 sm:grid-cols-3">
              <div className="border-t border-rule pt-3"><p className="font-display text-2xl font-semibold text-ink">05</p><p className="mt-1 text-sm text-muted">completed works in the portfolio</p></div>
              <div className="border-t border-rule pt-3"><p className="font-display text-2xl font-semibold text-ink">E2E</p><p className="mt-1 text-sm text-muted">from schema to interface</p></div>
              <div className="border-t border-rule pt-3"><p className="font-display text-2xl font-semibold text-ink">QA</p><p className="mt-1 text-sm text-muted">evidence linked per case study</p></div>
            </div>
            <a href={SITE.cv} download className="btn btn-quiet mt-9">Download my CV <ArrowUpRight size={16} aria-hidden="true" /></a>
          </div>
        </div>
      </section>
      <SectionDivider variant="translucent" to="panel" />
      <section id="experience" className="bg-panel">
        <div className="wrap py-20 md:py-28">
          <div className="grid gap-5 md:grid-cols-[.8fr_1.2fr] md:items-end md:gap-16">
            <div><p className="eyebrow">Experience</p><h2 className="section-title mt-3 max-w-[12ch]">A path from teaching to building.</h2></div>
            <p className="max-w-[35rem] text-[1.15rem] text-muted">The products are only part of the story. Teaching, marketing, formal study, and startup leadership shaped how I understand people, systems, and the work required to make an idea useful.</p>
          </div>
          <div className="mt-12"><ExperienceTimeline experiences={experiences} /></div>
        </div>
      </section>
    </>
  );
}
