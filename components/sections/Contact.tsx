'use client';
import { useState } from 'react';
import { Github, Linkedin, Mail, Check } from 'lucide-react';
import FadeIn from '@/components/ui/FadeIn';
import ParallaxImage from '@/components/ui/ParallaxImage';
import { SITE } from '@/data/content';

const NEEDS = ['Web app', 'API / backend', 'SaaS product', 'AI feature', 'Something else'];
type Err = { field: 'name' | 'email' | 'msg' | 'form'; text: string } | null;

export default function Contact() {
  const [f, setF] = useState({ name: '', email: '', msg: '' });
  const [needs, setNeeds] = useState<string[]>([NEEDS[0]]);
  const [budget, setBudget] = useState(2000);
  const [err, setErr] = useState<Err>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [copied, setCopied] = useState(false);
  const money = `$${budget.toLocaleString()}${budget === 20000 ? '+' : ''}`;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = f.name.trim(), email = f.email.trim(), msg = f.msg.trim();
    if (!name) return setErr({ field: 'name', text: 'Please enter your name.' });
    if (!/^\S+@\S+\.\S+$/.test(email)) return setErr({ field: 'email', text: 'Enter a valid email address.' });
    if (msg.length < 10) return setErr({ field: 'msg', text: 'Please add a little more detail (10+ characters).' });
    setErr(null);
    setSending(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message: msg, needs, budget }),
      });
      const data: { ok?: true; error?: string } = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr({ field: 'form', text: data.error ?? 'Something went wrong. Please try again.' });
        return;
      }
      setSent(true);
    } catch {
      setErr({ field: 'form', text: 'Could not reach the server. Check your connection and try again.' });
    } finally {
      setSending(false);
    }
  };
  const copy = async () => { try { await navigator.clipboard.writeText(SITE.email); } catch {} setCopied(true); setTimeout(() => setCopied(false), 1600); };
  const cls = (k: string) => `fld${err?.field === k ? ' err' : ''}`;

  return (
    <section id="contact" className="rounded-t-[40px] sm:rounded-t-[50px] md:rounded-t-[60px] -mt-10 sm:-mt-12 md:-mt-14 z-20 relative overflow-clip px-5 sm:px-8 md:px-10 pt-20 sm:pt-24 md:pt-32 pb-10" style={{ background: '#0C0C0C' }}>
      <FadeIn y={40}><h2 className="h2 hero-heading mb-6">Contact</h2></FadeIn>
      <p className="text-center font-light uppercase tracking-wide text-[#D7E2EA] mb-12 sm:mb-16" style={{ fontSize: 'clamp(.85rem,1.6vw,1.3rem)' }}>
        <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-400 pulse mr-2" />Available for new projects
      </p>
      <FadeIn y={40} className="glow max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-5 rounded-[38px] overflow-hidden" style={{ background: '#0C0C0C' }}>
          <div className="lg:col-span-2 relative min-h-[320px] lg:min-h-full overflow-hidden">
            <ParallaxImage src="/images/frame-5.jpg" />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(rgba(12,12,12,.1),rgba(12,12,12,.85))' }} />
            <div className="absolute bottom-0 p-6 sm:p-8 text-[#D7E2EA]">
              <div className="font-black uppercase leading-none mb-3" style={{ fontSize: 'clamp(1.8rem,3.5vw,3rem)' }}>Let&apos;s build it</div>
              <p className="font-light mb-5 opacity-80">Tell me what you&apos;re making. I reply within 24 hours.</p>
              <button type="button" onClick={copy} className="chip mb-5" style={{ textTransform: 'none' }}>{copied ? 'Copied ✓' : `${SITE.email} · copy`}</button>
              <div className="flex gap-3">
                <a className="soc" href={SITE.github} aria-label="GitHub"><Github size={22} /></a>
                <a className="soc" href={SITE.linkedin} aria-label="LinkedIn"><Linkedin size={22} /></a>
                <a className="soc" href={`mailto:${SITE.email}`} aria-label="Email"><Mail size={22} /></a>
              </div>
            </div>
          </div>
          <div className="lg:col-span-3 p-6 sm:p-8 md:p-12 relative">
            <form onSubmit={submit} noValidate className="flex flex-col gap-5">
              <div className="grid sm:grid-cols-2 gap-5">
                <input className={cls('name')} placeholder="Your name" autoComplete="name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
                <input className={cls('email')} type="email" placeholder="Email address" autoComplete="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
              </div>
              <div>
                <div className="text-[#D7E2EA] text-sm uppercase tracking-widest opacity-70 mb-3">I need</div>
                <div className="flex flex-wrap gap-2">
                  {NEEDS.map((n) => <button key={n} type="button" className={`chip${needs.includes(n) ? ' on' : ''}`} onClick={() => setNeeds(needs.includes(n) ? needs.filter((x) => x !== n) : [...needs, n])}>{n}</button>)}
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[#D7E2EA] text-sm uppercase tracking-widest opacity-70 mb-3"><span>Budget</span><span className="font-medium opacity-100">{money}</span></div>
                <input type="range" min={500} max={20000} step={500} value={budget} onChange={(e) => setBudget(+e.target.value)} className="w-full" style={{ accentColor: '#B600A8' }} />
              </div>
              <div>
                <textarea className={cls('msg')} rows={5} maxLength={600} placeholder="Tell me about your project" style={{ resize: 'vertical' }} value={f.msg} onChange={(e) => setF({ ...f, msg: e.target.value })} />
                <div className="text-right text-xs text-[#D7E2EA] opacity-50 mt-1">{f.msg.length}/600</div>
              </div>
              <div className="text-sm min-h-[1.25rem]" style={{ color: '#ff5c7a' }}>{err?.text}</div>
              <button type="submit" disabled={sending} className="cbtn rounded-full text-white font-medium uppercase tracking-widest px-12 py-4 self-start hover:scale-[1.03] transition-transform disabled:opacity-60 disabled:hover:scale-100">
                {sending ? 'Sending…' : 'Send Message'}
              </button>
            </form>
            {sent && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 text-[#D7E2EA]" style={{ background: '#0C0C0C' }}>
                <Check size={64} className="mb-4" />
                <div className="font-black uppercase mb-2" style={{ fontSize: 'clamp(1.6rem,3vw,2.6rem)' }}>Message sent</div>
                <p className="font-light opacity-80 max-w-sm">Thanks — Bereda will get back to you soon.</p>
                <button className="chip mt-6" type="button" onClick={() => { setSent(false); setF({ name: '', email: '', msg: '' }); setBudget(2000); setNeeds([NEEDS[0]]); }}>Write another</button>
              </div>
            )}
          </div>
        </div>
      </FadeIn>
      <footer className="max-w-6xl mx-auto mt-16 flex flex-wrap justify-between gap-4 text-[#D7E2EA] text-sm uppercase tracking-widest opacity-60">
        <span>© {new Date().getFullYear()} Bereda</span><span>Full Stack Software Engineer</span><a href="#top" className="hover:opacity-70">Back to top ↑</a>
      </footer>
    </section>
  );
}
