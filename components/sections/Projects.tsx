'use client';
import { useRef } from 'react';
import { motion, useScroll, useTransform, MotionValue } from 'framer-motion';
import { ArrowUpRight, Github } from 'lucide-react';
import { PROJECTS, STACK_ICON, type Project } from '@/data/content';
import TechIcon from '@/components/ui/TechIcon';
import PictureSlot from '@/components/ui/PictureSlot';

const R = 'rounded-[40px] sm:rounded-[50px] md:rounded-[60px]';

function Card({ p, i, n, progress }: { p: Project; i: number; n: number; progress: MotionValue<number> }) {
  const scale = useTransform(progress, [i / n, 1], [1, 1 - (n - 1 - i) * 0.03]);
  return (
    <div className="h-[85vh]">
      <div className="sticky top-24 md:top-32">
        <motion.div style={{ scale, marginTop: i * 28, transformOrigin: 'top center', background: 'rgba(12,12,12,.74)', backdropFilter: 'blur(16px)' }}
          className={`border-2 border-[#D7E2EA] ${R} p-5 sm:p-7 md:p-9`}>
          <div className="flex flex-wrap items-center justify-between gap-4 mb-5 text-[#D7E2EA]">
            <div className="num hero-heading">{String(i + 1).padStart(2, '0')}</div>
            <div className="uppercase">
              <div className="font-light tracking-widest text-xs sm:text-sm opacity-70">{p.category}</div>
              <div className="font-medium" style={{ fontSize: 'clamp(1rem,2.2vw,2.1rem)' }}>{p.title}</div>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#D7E2EA]/40 uppercase tracking-widest text-xs sm:text-sm px-5 py-2"><i className="w-2 h-2 rounded-full bg-green-400" />Completed</span>
          </div>
          <div className="grid md:grid-cols-2 gap-6 md:gap-8 items-center">
            <div>
              <p className="font-light leading-relaxed text-[#D7E2EA] mb-6" style={{ fontSize: 'clamp(.95rem,1.6vw,1.3rem)' }}>{p.description}</p>
              <div className="flex flex-wrap gap-2 mb-7">
                {p.stack.map((t) => (
                  <span key={t} className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs sm:text-sm uppercase tracking-wider text-[#D7E2EA]" style={{ background: 'rgba(215,226,234,.1)', border: '1px solid rgba(215,226,234,.12)' }}>
                    <TechIcon k={STACK_ICON[t]} />{t}
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap gap-3">
                <a href={p.demo} target="_blank" rel="noopener noreferrer" className="cbtn demo inline-flex items-center gap-2 rounded-full text-white font-medium uppercase tracking-widest px-8 py-3.5 text-sm sm:text-base">Live Demo <ArrowUpRight size={16} /></a>
                <a href={p.repo} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border-2 border-[#D7E2EA] text-[#D7E2EA] font-medium uppercase tracking-widest px-8 py-3.5 text-sm sm:text-base hover:bg-[#D7E2EA]/10 transition"><Github size={16} />Source</a>
              </div>
            </div>
            <PictureSlot p={p} hue={i * 36} />
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function Projects() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  return (
    <section id="projects" className="relative overflow-clip rounded-t-[40px] sm:rounded-t-[50px] md:rounded-t-[60px] -mt-10 sm:-mt-12 md:-mt-14 z-10 px-5 sm:px-8 md:px-10 py-20 sm:py-24 md:py-32" style={{ background: '#0C0C0C' }}>
      <div className="absolute inset-0 pointer-events-none">
        <div className="sticky top-0 h-screen overflow-hidden">
          <video autoPlay muted loop playsInline src="/video/projects-bg.mp4" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6, filter: 'saturate(1.2) brightness(1.35)' }} />
          <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 50% 40%,rgba(118,33,176,.35),transparent 62%),linear-gradient(#0C0C0C,transparent 18%,transparent 82%,#0C0C0C)' }} />
        </div>
      </div>
      <h2 className="h2 hero-heading mb-16 sm:mb-20 md:mb-28 relative">Projects</h2>
      <div ref={ref} className="max-w-6xl mx-auto relative">
        {PROJECTS.map((p, i) => <Card key={p.title} p={p} i={i} n={PROJECTS.length} progress={scrollYProgress} />)}
      </div>
    </section>
  );
}
