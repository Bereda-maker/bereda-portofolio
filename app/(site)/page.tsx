import Hero from '@/components/sections/Hero';
import Marquee from '@/components/sections/Marquee';
import About from '@/components/sections/About';
import Services from '@/components/sections/Services';
import Projects from '@/components/sections/Projects';
import Contact from '@/components/sections/Contact';
import ScrollProgress from '@/components/ScrollProgress';
import { getProjects } from '@/lib/projects';

// Re-render this page at most once every 60 seconds, picking up any project
// edits made from the admin dashboard without needing a full redeploy.
export const revalidate = 60;

export default async function Page() {
  const projects = await getProjects();
  return (
    <main style={{ overflowX: 'clip', background: '#0C0C0C' }}>
      <ScrollProgress />
      <Hero /><Marquee /><About /><Services /><Projects projects={projects} /><Contact />
    </main>
  );
}
