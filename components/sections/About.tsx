import FadeIn from '@/components/ui/FadeIn';
import ContactButton from '@/components/ui/ContactButton';

export default function About() {
  return (
    <section id="about" className="about-section">
      <div className="section-kicker"><span>A LITTLE ABOUT HOW I WORK</span><i /></div>
      <div className="about-grid">
        <FadeIn y={30}><h2>Build the<br /><span>whole thing.</span></h2></FadeIn>
        <div className="about-copy">
          <FadeIn delay={0.12} y={24}>
            <p className="about-lead">I&apos;m Bereda—a full-stack engineer who likes turning ambitious ideas into products people can actually use.</p>
            <p>I work across interface, APIs, data and deployment, choosing tools for the problem at hand. I care about details users feel—and the decisions that keep a product reliable after launch.</p>
          </FadeIn>
          <div className="about-cta"><ContactButton /><span>From first sketch to first real user.</span></div>
        </div>
      </div>
      <div className="about-stats" aria-label="Areas of work"><span>01 <b>Product thinking</b></span><span>02 <b>End-to-end build</b></span><span>03 <b>Careful systems</b></span></div>
    </section>
  );
}
