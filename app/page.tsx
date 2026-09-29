import Hero from '@/components/sections/Hero';
import Marquee from '@/components/sections/Marquee';
import About from '@/components/sections/About';
import Services from '@/components/sections/Services';
import Projects from '@/components/sections/Projects';
import Contact from '@/components/sections/Contact';
import ScrollProgress from '@/components/ScrollProgress';

export default function Page() {
  return (
    <main style={{ overflowX: 'clip', background: '#0C0C0C' }}>
      <ScrollProgress />
      <Hero /><Marquee /><About /><Services /><Projects /><Contact />
    </main>
  );
}
