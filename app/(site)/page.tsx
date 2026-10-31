import Hero from '@/components/sections/Hero';
import Work from '@/components/sections/Work';
import Capabilities from '@/components/sections/Capabilities';
import About from '@/components/sections/About';
import Contact from '@/components/sections/Contact';
import { SiteFooter, SiteHeader } from '@/components/SiteChrome';
import { SITE } from '@/data/content';
import { getProjects } from '@/lib/projects';

// Re-render at most once every 60 seconds so edits made in /admin show up without a redeploy.
export const revalidate = 60;

export default async function Page() {
  const projects = await getProjects();
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: SITE.name,
    jobTitle: SITE.role,
    url: 'https://bereda-dev.vercel.app',
    sameAs: [SITE.github, SITE.linkedin].filter(Boolean),
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteHeader />
      <main>
        <Hero />
        <Work projects={projects} />
        <Capabilities />
        <About />
        <Contact />
      </main>
      <SiteFooter />
    </>
  );
}
