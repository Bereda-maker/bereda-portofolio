import FadeIn from '@/components/ui/FadeIn';
import ContactButton from '@/components/ui/ContactButton';

export default function About() {
  return (
    <section id="about" className="about-section section-shell">
      <div className="section-kicker"><span>01 / HOW I THINK</span><i /></div>
      <div className="about-grid">
        <FadeIn y={24}><h2>Good software<br /><span>feels obvious.</span></h2></FadeIn>
        <div className="about-copy">
          <FadeIn delay={0.1} y={20}>
            <p className="about-lead">I&apos;m Bereda. I work across product, frontend and backend to make the full experience feel considered.</p>
            <p>I care about the details people notice and the engineering they don&apos;t: clear flows, dependable data, accessible interfaces and sensible systems that are ready to grow.</p>
          </FadeIn>
          <div className="about-cta"><ContactButton /><span>Thoughtful from first sketch to first release.</span></div>
        </div>
      </div>
      <div className="about-stats" aria-label="Engineering approach">
        <span>01 <b>Understand the problem</b></span>
        <span>02 <b>Build across the stack</b></span>
        <span>03 <b>Ship and improve</b></span>
      </div>
    </section>
  );
}
