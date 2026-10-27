'use client';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import FadeIn from '@/components/ui/FadeIn';
import ContactButton from '@/components/ui/ContactButton';
import { NAV, ROLES, SITE } from '@/data/content';

export default function Hero() {
  const [i, setI] = useState(0);
  const [show, setShow] = useState(true);
  useEffect(() => {
    const t = setInterval(() => { setShow(false); setTimeout(() => { setI((n) => (n + 1) % ROLES.length); setShow(true); }, 260); }, 2600);
    return () => clearInterval(t);
  }, []);

  return (
    <section id="top" className="reference-hero relative min-h-screen overflow-hidden">
      <div className="reference-orb reference-orb-one" /><div className="reference-orb reference-orb-two" />
      <FadeIn y={-16} className="relative z-30">
        <nav className="reference-nav mx-auto mt-4 flex max-w-6xl items-center justify-between gap-4 px-5 py-3 sm:px-7">
          <a href="#top" className="reference-brand"><span className="reference-brand-mark">B</span><span>{SITE.name}</span></a>
          <div className="hidden items-center gap-6 text-xs uppercase tracking-[.16em] text-white/70 md:flex">
            {NAV.map((n) => <a key={n.label} href={n.href} className="reference-nav-link">{n.label}</a>)}
          </div>
          <a href="#contact" className="reference-nav-cta">Let&apos;s talk <span>↗</span></a>
        </nav>
      </FadeIn>

      <div className="reference-hero-grid relative z-10 mx-auto max-w-6xl px-5 pb-16 pt-20 sm:px-8 md:px-10 md:pt-28">
        <div className="reference-hero-copy">
          <FadeIn delay={0.1} y={24}><p className="reference-eyebrow">PRODUCT ENGINEER · ETHIOPIA</p></FadeIn>
          <FadeIn delay={0.16} y={28}><h1 className="reference-display">I build the<br /><span>parts</span> that make<br />ideas real<span className="reference-dot">.</span></h1></FadeIn>
          <FadeIn delay={0.25} y={20}><div className="reference-role" style={{ opacity: show ? 1 : 0 }}>{ROLES[i]}</div></FadeIn>
          <FadeIn delay={0.32} y={20}><p className="reference-lede">From the first sketch to the last deploy, I turn complicated product ideas into software that feels obvious to use.</p></FadeIn>
          <FadeIn delay={0.4} y={18} className="flex flex-wrap items-center gap-4"><a href="#projects" className="reference-primary-cta">Explore my work <span>↓</span></a><ContactButton className="reference-secondary-cta" /></FadeIn>
          <FadeIn delay={0.48} y={16}><div className="reference-social-proof"><span className="reference-live-dot" /> Available for thoughtful product work <span className="reference-divider" /> TypeScript · React · APIs</div></FadeIn>
        </div>
        <FadeIn delay={0.35} y={30} className="reference-hero-visual">
          <div className="reference-portrait-halo" /><div className="reference-code-chip reference-code-chip-one">&lt;/&gt;</div><div className="reference-code-chip reference-code-chip-two">{`{ }`}</div>
          <Image src="/images/hero.png" alt="Bereda Wako" width={1100} height={859} priority className="reference-portrait" />
        </FadeIn>
      </div>
      <a href="#about" className="reference-scroll-cue">SCROLL TO EXPLORE <span>↓</span></a>
    </section>
  );
}
