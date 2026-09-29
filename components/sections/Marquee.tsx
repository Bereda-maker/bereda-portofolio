'use client';
import { useEffect, useRef } from 'react';
import { TECH } from '@/data/content';
import ICONS from '@/data/icons';
import TechIcon from '@/components/ui/TechIcon';
import ParallaxImage from '@/components/ui/ParallaxImage';

const row = (items: [string, string][]) =>
  [...items, ...items, ...items].map(([name, k], j) => (
    <div key={j} style={{ background: `radial-gradient(circle at 50% 38%,#${ICONS[k][1]}33,#0C0C0C 72%)` }}>
      <TechIcon k={k} size={96} /><span>{name}</span>
    </div>
  ));

export default function Marquee() {
  const sec = useRef<HTMLElement>(null), r1 = useRef<HTMLDivElement>(null), r2 = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const f = () => {
      if (!sec.current || !r1.current || !r2.current) return;
      const top = sec.current.getBoundingClientRect().top + window.scrollY;
      const o = (window.scrollY - top + window.innerHeight) * 0.3;
      r1.current.style.transform = `translateX(${o - 200}px)`;
      r2.current.style.transform = `translateX(${-(o - 200)}px)`;
    };
    f();
    window.addEventListener('scroll', f, { passive: true });
    return () => window.removeEventListener('scroll', f);
  }, []);

  return (
    <section ref={sec} className="pt-24 sm:pt-32 md:pt-40 pb-24 flex flex-col gap-3 relative overflow-hidden" style={{ background: '#0C0C0C' }}>
      <ParallaxImage src="/images/frame-1.jpg" style={{ opacity: 0.28, mixBlendMode: 'lighten', filter: 'blur(2px)' }} />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(#0C0C0C,transparent 25%,transparent 75%,#0C0C0C)' }} />
      <div ref={r1} className="mq relative" style={{ willChange: 'transform' }}>{row(TECH.slice(0, 11))}</div>
      <div ref={r2} className="mq relative" style={{ willChange: 'transform' }}>{row(TECH.slice(11))}</div>
    </section>
  );
}
