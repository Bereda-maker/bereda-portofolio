import Hero from '@/components/sections/Hero';
import Work from '@/components/sections/Work';
import Capabilities from '@/components/sections/Capabilities';
import Proof from '@/components/sections/Proof';
import About from '@/components/sections/About';
import Extracurricular from '@/components/sections/Extracurricular';
import Explore from '@/components/sections/Explore';
import Contact from '@/components/sections/Contact';
import { SiteFooter, SiteHeader } from '@/components/SiteChrome';
import SectionDivider from '@/components/SectionDivider';
import { SITE } from '@/data/content';
import { getProjects } from '@/lib/projects';
import { getExperiences } from '@/lib/experiences';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const [projects, experiences] = await Promise.all([getProjects(), getExperiences()]);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: SITE.name,
    jobTitle: SITE.role,
    url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bereda-portofolio.onrender.com',
    email: SITE.email,
    sameAs: [SITE.github, SITE.linkedin].filter(Boolean),
  };
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} /><SiteHeader /><main className="home-flow"><Hero /><SectionDivider variant="flow" to="paper" /><Work projects={projects} /><SectionDivider variant="smooth" to="panel" /><Capabilities /><SectionDivider variant="organic" to="paper" /><Proof /><SectionDivider variant="topo" to="paper" /><About experiences={experiences} /><SectionDivider variant="ribbon" to="panel" overlay="down" /><Extracurricular /><SectionDivider variant="morph" to="paper" /><Explore /><SectionDivider variant="layered" to="panel" /><Contact /><SectionDivider variant="smooth" to="paper" flipX /></main><SiteFooter flush /></>;
}
