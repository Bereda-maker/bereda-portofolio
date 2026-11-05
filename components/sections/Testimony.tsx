'use client';

import Image from 'next/image';
import { ArrowLeft, ArrowRight, ArrowUpRight, Phone, Quote, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { TESTIMONIALS, type Testimonial } from '@/data/content';

function TestimonyCard({ item, index, onOpen }: { item: Testimonial; index: number; onOpen: () => void }) {
  return (
    <article className="testimony-card" style={{ ['--testimony-accent' as string]: item.accent }}>
      <div className="testimony-card-glow" aria-hidden="true" />
      <div className="testimony-card-top">
        <span className="testimony-card-index">0{index + 1} / 06</span>
        <Quote size={22} strokeWidth={1.6} aria-hidden="true" />
      </div>
      <span className="testimony-card-company">{item.company}</span>
      <blockquote>“{item.quote}”</blockquote>
      <button type="button" className="testimony-profile" onClick={onOpen} aria-label={`Read more about ${item.name}`}>
        <Image src={item.image} alt={item.imageAlt} width={52} height={52} unoptimized className="testimony-avatar" />
        <span className="min-w-0 text-left"><strong>{item.name}</strong><small>{item.role}</small></span>
        <ArrowUpRight size={17} aria-hidden="true" />
      </button>
    </article>
  );
}

export default function Testimony() {
  const [selected, setSelected] = useState<Testimonial | null>(null);

  useEffect(() => {
    if (!selected) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelected(null);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [selected]);

  return (
    <section id="testimony" className="testimony-section" aria-labelledby="testimony-title">
      <div className="wrap py-20 md:py-28">
        <div className="testimony-signal" aria-hidden="true"><span>Voices / 2026</span><i /><span>Proof in motion</span></div>
        <div className="testimony-heading">
          <div>
            <p className="eyebrow">Testimony</p>
            <h2 id="testimony-title" className="section-title mt-3 max-w-[12ch]">Good work travels through people.</h2>
          </div>
          <div className="testimony-intro">
            <p>Some of the best proof is not a metric. It is what collaborators remember after the work is shipped.</p>
            <div className="testimony-controls" aria-label="Testimony carousel controls">
              <button type="button" onClick={() => document.getElementById('testimony-track')?.scrollBy({ left: -360, behavior: 'smooth' })} aria-label="Scroll testimonies left"><ArrowLeft size={17} /></button>
              <button type="button" onClick={() => document.getElementById('testimony-track')?.scrollBy({ left: 360, behavior: 'smooth' })} aria-label="Scroll testimonies right"><ArrowRight size={17} /></button>
            </div>
          </div>
        </div>
        <div className="testimony-rule" aria-hidden="true"><span>01</span><i /><span>06</span></div>
        <div id="testimony-track" className="testimony-track" tabIndex={0} aria-label="Testimonies from collaborators">
          {TESTIMONIALS.map((item, index) => <TestimonyCard key={item.name} item={item} index={index} onOpen={() => setSelected(item)} />)}
        </div>
        <p className="testimony-hint">Scroll or drag to explore · Select a profile to read the full story</p>
      </div>

      {selected && (
        <div className="testimony-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}>
          <section className="testimony-modal" role="dialog" aria-modal="true" aria-labelledby="testimony-modal-title">
            <button type="button" className="testimony-modal-close" onClick={() => setSelected(null)} aria-label="Close testimony details"><X size={20} /></button>
            <div className="testimony-modal-accent" style={{ backgroundColor: selected.accent }} />
            <Image src={selected.image} alt={selected.imageAlt} width={88} height={88} unoptimized className="testimony-modal-avatar" />
            <p className="eyebrow mt-6">A collaborator’s perspective</p>
            <h3 id="testimony-modal-title" className="mt-2 font-display text-[clamp(1.8rem,4vw,2.75rem)] font-semibold leading-tight tracking-[-.04em]">{selected.name}</h3>
            <p className="mt-1 font-display text-sm font-semibold text-forest">{selected.role} · {selected.company}</p>
            <div className="testimony-modal-about"><span>About this person</span><p>{selected.description}</p></div>
            <blockquote className="testimony-modal-quote">“{selected.quote}”</blockquote>
            <p className="mt-6 text-[1rem] leading-relaxed text-muted">{selected.story}</p>
            <div className="testimony-modal-contact-row">
              <a className="testimony-modal-phone" href={`tel:${selected.phone.replace(/[^+\d]/g, '')}`}><Phone size={16} aria-hidden="true" /><span><small>Phone</small><strong>{selected.phone}</strong></span></a>
              <a className="testimony-modal-contact" href={selected.contact.href}>{selected.contact.label}<ArrowUpRight size={16} aria-hidden="true" /></a>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
