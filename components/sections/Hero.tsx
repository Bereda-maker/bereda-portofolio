'use client';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import FadeIn from '@/components/ui/FadeIn';
import ContactButton from '@/components/ui/ContactButton';
import { NAV, ROLES, HERO_CHIPS } from '@/data/content';

export default function Hero() {
  const [i, setI] = useState(0);
  const [show, setShow] = useState(true);
  useEffect(() => {
    const t = setInterval(() => { setShow(false); setTimeout(() => { setI((n) => (n + 1) % ROLES.length); setShow(true); }, 350); }, 2400);
    return () => clearInterval(t);
  }, []);

  return (
    <section id="top" className="h-screen flex flex-col relative" style={{ overflowX: 'clip' }}>
      <FadeIn y={-20} className="relative z-20">
        <nav className="flex justify-between px-6 md:px-10 pt-6 md:pt-8 text-sm md:text-lg lg:text-[1.4rem] font-medium uppercase tracking-wider text-[#D7E2EA]">
          {NAV.map((n) => <a key={n.label} href={n.href} className="hover:opacity-70 transition-opacity duration-200">{n.label}</a>)}
        </nav>
      </FadeIn>

      <FadeIn delay={0.15} y={40} className="overflow-hidden relative z-0">
        <h1 className="hero-heading font-black uppercase tracking-tight leading-none whitespace-nowrap w-full text-[12vw] sm:text-[13vw] md:text-[14vw] lg:text-[15vw] mt-6 sm:mt-4 md:-mt-5">Hi, i&apos;m bereda</h1>
      </FadeIn>

      <div className="text-center mt-4 md:mt-6 uppercase tracking-[.35em] text-[#D7E2EA] text-[.7rem] sm:text-sm md:text-lg relative z-20 transition-all duration-300"
        style={{ opacity: show ? 1 : 0, transform: show ? 'none' : 'translateY(8px)' }}>{ROLES[i]}</div>

      <div className="mt-auto flex justify-between items-end px-6 md:px-10 pb-7 sm:pb-8 md:pb-10 relative z-20">
        <FadeIn delay={0.35} y={20}>
          <p className="font-light uppercase tracking-wide leading-snug text-[#D7E2EA] max-w-[160px] sm:max-w-[220px] md:max-w-[260px]" style={{ fontSize: 'clamp(.75rem,1.4vw,1.5rem)' }}>
            a full stack software engineer building complete products, end to end
          </p>
        </FadeIn>
        <FadeIn delay={0.5} y={20}><ContactButton /></FadeIn>
      </div>

      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="gridbg" />
        <div className="orb" style={{ width: '38vw', height: '38vw', left: '12%', top: '25%', background: '#7621B0', opacity: 0.38 }} />
        <div className="orb" style={{ width: '30vw', height: '30vw', right: '8%', top: '35%', background: '#BE4C00', opacity: 0.28, animationDelay: '-4s' }} />
        <div className="orb" style={{ width: '26vw', height: '26vw', left: '38%', bottom: '-8%', background: '#B600A8', opacity: 0.3, animationDelay: '-7s' }} />
      </div>
      {HERO_CHIPS.map((c) => <span key={c.t} className="hchip" style={c.s}>{c.t}</span>)}

      <div className="absolute left-1/2 -translate-x-1/2 z-10 w-[360px] sm:w-[560px] md:w-[720px] lg:w-[900px] max-w-[130vw] top-1/2 -translate-y-1/2 sm:top-auto sm:translate-y-0 sm:bottom-0">
        <FadeIn delay={0.6} y={30}>
          <Image src="/images/hero.png" alt="Bereda" width={1100} height={859} priority className="w-full h-auto" />
        </FadeIn>
      </div>
    </section>
  );
}
