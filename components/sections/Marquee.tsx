import { TECH } from '@/data/content';
import TechIcon from '@/components/ui/TechIcon';

const FEATURED = ['TypeScript', 'Next.js', 'React', 'Python', 'Hono', 'PostgreSQL', 'Redis', 'Docker'];

export default function Marquee() {
  const items = FEATURED.map((name) => TECH.find(([label]) => label === name)).filter((item): item is [string, string] => Boolean(item));
  return (
    <section className="tech-section" aria-label="Core technologies">
      <div className="tech-shell">
        <span className="tech-label">TOOLS I REACH FOR</span>
        <div className="tech-list">
          {items.map(([name, icon]) => <span className="tech-item" key={name}><TechIcon k={icon} size={17} />{name}</span>)}
        </div>
      </div>
    </section>
  );
}
