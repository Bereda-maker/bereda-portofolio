'use client';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import FadeIn from '@/components/ui/FadeIn';
import ContactButton from '@/components/ui/ContactButton';
import { NAV, ROLES, HERO_CHIPS, SITE } from '@/data/content';

export default function Hero() {
  const [i, setI] = useState(0);
  const [show, setShow] = useState(true);
  useEffect(() => {
    const t = setInterval(() => { setShow(false); setTimeout(() => { setI((n) => (n + 1) % ROLES.length); setShow(true); }, 350); }, 2400);
    return () => clearInterval(t);
  }, []);

  return (
    <section id="top" className="min-h-screen flex flex-col relative" style={{ overflowX: 'clip' }}>
      <FadeIn y={-20} className="relative z-20">
        <nav className="flex items-center justify-between px-6 md:px-10 pt-6 md:pt-8 text-sm md:text-lg font-medium uppercase tracking-wider text-[#D7E2EA]">
          <a href="#top" className="flex items-center gap-3 tracking-[.2em]"><span className="brand-mark" />{SITE.name}<span className="hidden sm:inline opacity-40">/ 26</span></a>
          <div className="hidden md:flex items-center gap-8">{NAV.map((n) => <a key={n.label} href={n.href} className="nav-link">{n.label}</a>)}</div>
          <span className="flex items-center gap-2 text-[.65rem] md:text-xs tracking-[.18em] opacity-70"><i className="status-dot" /> AVAILABLE</span>
        </nav>
      </FadeIn>

      <div className="hero-layout relative z-10 flex-1 px-6 md:px-10 pt-16 md:pt-20 pb-10">
        <div className="hero-copy">
          <FadeIn delay={0.12} y={30}><p className="eyebrow">01 / The short version</p></FadeIn>
          <FadeIn delay={0.18} y={35} className="overflow-visible">
            <h1 className="hero-heading hero-title font-black tracking-tight leading-[.86]">I build the<br /><em>parts</em> that make<br />ideas real<span className="hero-period">.</span></h1>
          </FadeIn>
          <FadeIn delay={0.28} y={24}>
            <div className="hero-role uppercase tracking-[.25em] text-[#D7E2EA] transition-all duration-300" style={{ opacity: show ? 1 : 0, transform: show ? 'none' : 'translateY(8px)' }}>{ROLES[i]}</div>
          </FadeIn>
          <FadeIn delay={0.36} y={20}>
            <p className="hero-description">From the first sketch to the last deploy, I turn complicated product ideas into software that feels obvious to use.</p>
          </FadeIn>
          <FadeIn delay={0.44} y={20} className="flex items-center gap-5 flex-wrap">
            <ContactButton /><a href="#projects" className="text-link">See the work <span>↘</span></a>
          </FadeIn>
        </div>
        <div className="hero-aside">
          <span className="aside-label">Currently building</span>
          <strong>Thoughtful<br />digital products</strong>
          <span className="aside-line" />
          <span className="aside-meta">TypeScript / APIs / AI<br />Based anywhere, working everywhere</span>
        </div>
        <div className="hero-scroll">SCROLL TO EXPLORE <span>↓</span></div>
      </div>

      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="gridbg" />
        <div className="orb" style={{ width: '38vw', height: '38vw', left: '12%', top: '25%', background: '#7621B0', opacity: 0.38 }} />
        <div className="orb" style={{ width: '30vw', height: '30vw', right: '8%', top: '35%', background: '#BE4C00', opacity: 0.28, animationDelay: '-4s' }} />
        <div className="orb" style={{ width: '26vw', height: '26vw', left: '38%', bottom: '-8%', background: '#B600A8', opacity: 0.3, animationDelay: '-7s' }} />
      </div>
      {HERO_CHIPS.map((c) => <span key={c.t} className="hchip" style={c.s}>{c.t}</span>)}

      <div className="hero-person absolute z-10 w-[360px] sm:w-[560px] md:w-[720px] lg:w-[900px] max-w-[130vw]">
        <FadeIn delay={0.6} y={30}>
          <Image src="/images/hero.png" alt="Bereda" width={1100} height={859} priority className="w-full h-auto" />
        </FadeIn>
      </div>
    </section>
  );
}
