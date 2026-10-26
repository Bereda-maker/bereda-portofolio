import { ArrowUpRight, Boxes, Code2, Database, Network, Sparkles } from 'lucide-react';
import FadeIn from '@/components/ui/FadeIn';
import { SERVICES } from '@/data/content';

const ICONS = [Boxes, Code2, Network, Database, Sparkles];

export default function Services() {
  return (
    <section id="services" className="services-section section-shell">
      <div className="section-kicker"><span>02 / CAPABILITIES</span><i /></div>
      <div className="services-heading">
        <h2>From first<br /><em>principles.</em></h2>
        <p>One engineer across the layers that make a product feel complete.</p>
      </div>
      <div className="services-grid">
        {SERVICES.map((service, index) => {
          const Icon = ICONS[index];
          return (
            <FadeIn key={service.name} delay={index * 0.06} y={18}>
              <article className="service-card">
                <div className="service-top"><span>0{index + 1}</span><Icon size={21} strokeWidth={1.6} /></div>
                <h3>{service.name}</h3>
                <p>{service.text}</p>
                <ArrowUpRight className="service-arrow" size={17} />
              </article>
            </FadeIn>
          );
        })}
      </div>
    </section>
  );
}
