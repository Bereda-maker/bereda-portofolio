import Image from 'next/image';
import { ArrowUpRight, Github, Mail } from 'lucide-react';
import { SITE } from '@/data/content';

export default function Hero() {
  return (
    <section id="top" className="hero-shell overflow-hidden">
      <div className="hero-panel relative isolate overflow-hidden">
        <div className="hero-panel-grid" aria-hidden="true" />
        <div className="hero-panel-glow" aria-hidden="true" />
        <div className="wrap relative z-10 grid items-center gap-7 px-5 py-10 sm:gap-10 sm:px-8 sm:py-14 lg:grid-cols-[.9fr_1.1fr] lg:gap-0 lg:py-16">
          <div className="hero-copy relative z-10 max-w-[39rem] lg:pb-6">
            <div className="settle flex flex-wrap items-center gap-3">
              <p className="hero-kicker"><span className="beacon" aria-hidden="true" />Full-stack product engineer</p>
              <span className="hero-location">Ethiopia · available for thoughtful builds</span>
            </div>
            <h1 className="settle settle-2 hero-title mt-5">Hi, I&rsquo;m <span>Bereda Wako</span><strong>.</strong></h1>
            <p className="settle settle-3 hero-lede mt-5">I turn hard workflows into useful web products&mdash;from the first interaction to a live, maintainable release.</p>
            <div className="settle settle-3 mt-7 flex flex-wrap gap-3">
              <a href="#work" className="btn hero-btn-primary">View selected work <ArrowUpRight size={16} aria-hidden="true" /></a>
              <a href="#contact" className="btn hero-btn-quiet">Start a conversation <ArrowUpRight size={16} aria-hidden="true" /></a>
            </div>
            <div className="settle settle-3 mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 text-[.86rem] text-white/65">
              <a href={`mailto:${SITE.email}`} className="inline-flex items-center gap-2 transition hover:text-white"><Mail size={15} aria-hidden="true" />{SITE.email}</a>
              <a href={SITE.github} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 transition hover:text-white"><Github size={15} aria-hidden="true" />GitHub</a>
            </div>
          </div>
          <div className="settle settle-3 hero-stage relative">
            <div className="hero-stage-grid" aria-hidden="true" />
            <div className="hero-stage-orbit" aria-hidden="true" />
            <div className="hero-stage-label">Bereda Wako / 2026</div>
            <Image src="/images/hero-laptop.png" alt={`Portrait of ${SITE.name} holding a laptop`} fill priority sizes="(max-width: 1024px) 100vw, 55vw" className="hero-stage-image" />
          </div>
        </div>
        <div className="hero-metrics relative z-10 grid gap-5 px-5 pb-7 sm:grid-cols-3 sm:px-8 sm:pb-9 lg:grid-cols-[.8fr_.8fr_.8fr_1.65fr] lg:gap-0 lg:px-[max(2rem,calc((100vw-68rem)/2))]">
          <div className="hero-metric"><strong>04</strong><span>products in the showcase</span></div>
          <div className="hero-metric"><strong>E2E</strong><span>schema to interface</span></div>
          <div className="hero-metric"><strong>QA</strong><span>evidence linked per project</span></div>
          <div className="hero-capabilities"><p>What I can own</p><div><span>Product UI</span><span>Typed APIs</span><span>Data + deploy</span></div></div>
        </div>
      </div>
    </section>
  );
}
