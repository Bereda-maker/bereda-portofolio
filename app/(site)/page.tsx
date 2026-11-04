import Hero from '@/components/sections/Hero';
import Work from '@/components/sections/Work';
import Capabilities from '@/components/sections/Capabilities';
import Proof from '@/components/sections/Proof';
import About from '@/components/sections/About';
import Extracurricular from '@/components/sections/Extracurricular';
import Explore from '@/components/sections/Explore';
import Contact from '@/components/sections/Contact';
import { SiteFooter, SiteHeader } from '@/components/SiteChrome';
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
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} /><SiteHeader /><main><Hero /><Work projects={projects} /><Capabilities /><Proof /><About experiences={experiences} /><Extracurricular /><Explore /><Contact /></main><SiteFooter /></>;
}
