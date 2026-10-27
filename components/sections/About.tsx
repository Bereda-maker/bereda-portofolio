import FadeIn from '@/components/ui/FadeIn';
import ContactButton from '@/components/ui/ContactButton';
import ParallaxImage from '@/components/ui/ParallaxImage';

const CAPABILITIES = ['Product thinking', 'Full-stack systems', 'Accessible interfaces'];

export default function About() {
  return (
    <section id="about" className="reference-section reference-about relative overflow-hidden px-5 py-24 sm:px-8 md:px-10 md:py-36">
      <ParallaxImage src="/images/frame-2.jpg" style={{ opacity: 0.12, mixBlendMode: 'screen' }} />
      <div className="reference-section-inner relative z-10 mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-[.8fr_1.2fr] md:gap-20">
        <FadeIn className="reference-about-portrait"><div className="reference-about-ring"><img src="/images/hero.png" alt="Bereda Wako" /></div><p>Developer / builder / learner</p></FadeIn>
        <div className="reference-about-copy">
          <FadeIn y={24}><p className="reference-eyebrow">01 / ABOUT THE BUILDER</p><h2 className="reference-section-title">Turning ideas into <span>digital reality.</span></h2></FadeIn>
          <FadeIn y={20}><p className="reference-body-copy">I&apos;m Bereda Wako, a product-focused developer building digital experiences, useful software, and full-stack products from idea to deployment. I care about the choices between the headline and the backend: clarity, reliability, and a product people can actually use.</p></FadeIn>
          <div className="reference-capability-grid">{CAPABILITIES.map((item, index) => <FadeIn key={item} delay={index * .08} y={12}><div className="reference-capability"><span>0{index + 1}</span>{item}</div></FadeIn>)}</div>
          <FadeIn y={16}><ContactButton /></FadeIn>
        </div>
      </div>
    </section>
  );
}
