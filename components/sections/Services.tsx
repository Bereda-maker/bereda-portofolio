import FadeIn from '@/components/ui/FadeIn';
import ParallaxImage from '@/components/ui/ParallaxImage';
import { SERVICES } from '@/data/content';

export default function Services() {
  return (
    <section id="services" className="relative bg-white rounded-t-[40px] sm:rounded-t-[50px] md:rounded-t-[60px] px-5 sm:px-8 md:px-10 py-20 sm:py-24 md:py-32">
      <h2 className="h2 mb-16 sm:mb-20 md:mb-28" style={{ color: '#0C0C0C' }}>Services</h2>
      <FadeIn className="max-w-5xl mx-auto mb-10 sm:mb-14 rounded-[40px] sm:rounded-[50px] overflow-hidden relative bg-black">
        <div className="relative overflow-hidden" style={{ height: 'clamp(200px,32vw,400px)' }}>
          <ParallaxImage src="/images/frame-3.jpg" />
          <div className="absolute inset-0 flex items-end p-6 sm:p-10" style={{ background: 'linear-gradient(transparent 40%,rgba(0,0,0,.75))' }}>
            <p className="text-white font-medium uppercase tracking-wider" style={{ fontSize: 'clamp(.9rem,1.8vw,1.5rem)' }}>Idea to production, one engineer</p>
          </div>
        </div>
      </FadeIn>
      <div className="max-w-5xl mx-auto">
        {SERVICES.map((s, i) => (
          <FadeIn key={s.name} delay={i * 0.1}>
            <div className="flex gap-6 sm:gap-10 items-start py-8 sm:py-10 md:py-12" style={{ color: '#0C0C0C', borderTop: i ? '1px solid rgba(12,12,12,.15)' : undefined }}>
              <div className="num">0{i + 1}</div>
              <div className="flex flex-col gap-3">
                <h3 className="font-medium uppercase" style={{ fontSize: 'clamp(1rem,2.2vw,2.1rem)' }}>{s.name}</h3>
                <p className="font-light leading-relaxed max-w-2xl" style={{ fontSize: 'clamp(.85rem,1.6vw,1.25rem)', opacity: 0.6 }}>{s.text}</p>
              </div>
            </div>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}
