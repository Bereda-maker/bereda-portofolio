import FadeIn from '@/components/ui/FadeIn';
import AnimatedText from '@/components/ui/AnimatedText';
import ContactButton from '@/components/ui/ContactButton';
import ParallaxImage from '@/components/ui/ParallaxImage';

const B = 'https://shrug-person-78902957.figma.site/_components/v2/ebb2b8f25d8e24d5f0a5ca8af4c950de81aa2fd7/';
const DECOR = [
  { src: 'moon_icon.11395d36.png', cls: 'w-[120px] sm:w-[160px] md:w-[210px] top-[4%] left-[1%] sm:left-[2%] md:left-[4%]', d: 0.1, x: -80 },
  { src: 'p59_1.4659672e.png', cls: 'w-[100px] sm:w-[140px] md:w-[180px] bottom-[8%] left-[3%] sm:left-[6%] md:left-[10%]', d: 0.25, x: -80 },
  { src: 'lego_icon-1.703bb594.png', cls: 'w-[120px] sm:w-[160px] md:w-[210px] top-[4%] right-[1%] sm:right-[2%] md:right-[4%]', d: 0.15, x: 80 },
  { src: 'Group_134-1.2e04f3ce.png', cls: 'w-[130px] sm:w-[170px] md:w-[220px] bottom-[8%] right-[3%] sm:right-[6%] md:right-[10%]', d: 0.3, x: 80 },
];
const MASK = 'radial-gradient(ellipse 50% 60% at 50% 50%,#000 30%,transparent 100%)';

export default function About() {
  return (
    <section id="about" className="min-h-screen relative overflow-hidden flex items-center justify-center px-5 sm:px-8 md:px-10 py-20">
      <ParallaxImage src="/images/frame-2.jpg" style={{ opacity: 0.22, mixBlendMode: 'lighten', WebkitMaskImage: MASK, maskImage: MASK }} />
      {DECOR.map((d) => (
        <FadeIn key={d.src} delay={d.d} x={d.x} y={0} duration={0.9} className={`absolute ${d.cls}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={B + d.src} alt="" className="w-full" />
        </FadeIn>
      ))}
      <div className="flex flex-col items-center gap-16 sm:gap-20 md:gap-24 relative z-10">
        <div className="flex flex-col items-center gap-10 sm:gap-14 md:gap-16">
          <FadeIn y={40}><h2 className="h2 hero-heading">About me</h2></FadeIn>
          <AnimatedText className="font-medium text-center leading-relaxed max-w-[560px] text-[#D7E2EA]"
            text="I'm a full stack software engineer. I build complete products across TypeScript, Python, PHP, Go, Java and C#, from the database and API to the interface, and I pick the right stack for each problem. Let's build something incredible together!" />
        </div>
        <ContactButton />
      </div>
    </section>
  );
}
