import FadeIn from '@/components/ui/FadeIn';
import { SERVICES } from '@/data/content';

const ICONS = ['✦', '⌘', '◈', '↗', '✺'];

export default function Services() {
  return (
    <section id="services" className="reference-section reference-services relative px-5 py-24 sm:px-8 md:px-10 md:py-36">
      <div className="reference-section-inner relative z-10 mx-auto max-w-6xl">
        <FadeIn y={22}><p className="reference-eyebrow">02 / EXPERTISE</p><h2 className="reference-section-title max-w-3xl">The tools change.<br /><span>The thinking stays.</span></h2><p className="reference-body-copy mt-6 max-w-2xl">A practical toolkit for turning ambiguous product ideas into clear interfaces, dependable systems, and software that can grow with the people using it.</p></FadeIn>
        <div className="reference-service-grid mt-12">{SERVICES.map((service, i) => <FadeIn key={service.name} delay={i * .06} y={18} className="reference-service-card"><div className="reference-service-icon">{ICONS[i]}</div><div><p className="reference-service-index">0{i + 1}</p><h3>{service.name}</h3><p>{service.text}</p></div><span className="reference-card-arrow">↗</span></FadeIn>)}</div>
      </div>
    </section>
  );
}
