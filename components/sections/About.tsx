import FadeIn from '@/components/ui/FadeIn';
import AnimatedText from '@/components/ui/AnimatedText';
import ContactButton from '@/components/ui/ContactButton';
import ParallaxImage from '@/components/ui/ParallaxImage';

export default function About() {
  return (
    <section id="about" className="min-h-screen relative overflow-hidden flex items-center justify-center px-5 sm:px-8 md:px-10 py-20">
      <ParallaxImage src="/images/frame-2.jpg" style={{ opacity: 0.2, mixBlendMode: 'lighten' }} />
      <div className="about-layout relative z-10">
        <FadeIn className="about-portrait"><div className="about-portrait-frame"><img src="/images/hero.png" alt="Bereda" /></div><span>Built with curiosity / 2026</span></FadeIn>
        <div className="flex flex-col items-start gap-10 sm:gap-14 md:gap-16">
          <div className="flex flex-col items-center gap-10 sm:gap-14 md:gap-16">
            <FadeIn y={40}><p className="eyebrow self-start">03 / The human behind the stack</p><h2 className="h2 hero-heading text-left">Not just<br />another<br /><span className="text-[#D7E2EA]">developer.</span></h2></FadeIn>
            <AnimatedText className="font-medium leading-relaxed max-w-[560px] text-[#D7E2EA]"
              text="I like the messy middle: turning a loose idea into a real product, making the hard technical choices disappear, and leaving behind a codebase the next person can actually enjoy. Full stack is the toolkit. Curiosity is the operating system." />
          </div>
          <ContactButton />
        </div>
      </div>
    </section>
  );
}
