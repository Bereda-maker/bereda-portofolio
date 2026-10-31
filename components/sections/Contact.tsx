'use client';

import { useState } from 'react';
import { ArrowUpRight, Check, Copy, Github, Linkedin } from 'lucide-react';
import { SITE } from '@/data/content';

const NEEDS = ['Web app', 'API / backend', 'SaaS product', 'AI feature', 'Something else'];
const SCOPE_OPTIONS = ['Not sure yet', 'MVP / first release', 'Existing product improvement', 'Integration or backend', 'Something else'];
type Err = { field: 'name' | 'email' | 'msg' | 'form'; text: string } | null;

export default function Contact() {
  const [f, setF] = useState({ name: '', email: '', msg: '' });
  const [needs, setNeeds] = useState<string[]>([]);
  const [scope, setScope] = useState(SCOPE_OPTIONS[0]);
  const [err, setErr] = useState<Err>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [copied, setCopied] = useState(false);

  const mailtoFallback = () => {
    const body = `${f.msg}\n\nNeed: ${needs.join(', ') || 'Not specified'}\nScope: ${scope}\n\n${f.name}`;
    return `mailto:${SITE.email}?subject=${encodeURIComponent('Project enquiry')}&body=${encodeURIComponent(body)}`;
  };
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = f.name.trim(), email = f.email.trim(), msg = f.msg.trim();
    if (!name) return setErr({ field: 'name', text: 'Enter your name so I know who to reply to.' });
    if (!/^\S+@\S+\.\S+$/.test(email)) return setErr({ field: 'email', text: 'Enter a valid email address, like name@example.com.' });
    if (msg.length < 10) return setErr({ field: 'msg', text: 'Write at least a sentence about the project (10+ characters).' });
    setErr(null); setSending(true);
    try {
      const res = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, message: `${msg}\n\nScope: ${scope}`, needs }) });
      const data: { ok?: true; error?: string } = await res.json().catch(() => ({}));
      if (!res.ok) return setErr({ field: 'form', text: data.error ?? 'The message could not be sent.' });
      setSent(true);
    } catch { setErr({ field: 'form', text: 'Could not reach the server. You can send the same brief by email instead.' }); }
    finally { setSending(false); }
  };
  const copy = async () => { try { await navigator.clipboard.writeText(SITE.email); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch {} };
  const toggle = (n: string) => setNeeds((cur) => cur.includes(n) ? cur.filter((x) => x !== n) : [...cur, n]);
  const cls = (k: string) => `field${err?.field === k ? ' field-error' : ''}`;
  const lbl = 'mb-1.5 block font-display text-[.95rem] font-medium';

  return <section id="contact" className="border-t border-rule bg-panel"><div className="wrap grid gap-12 py-20 md:grid-cols-[.85fr_1.15fr] md:gap-20 md:py-28">
    <div><p className="eyebrow">Next step</p><h2 className="section-title mt-3 max-w-[12ch]">Tell me about your project.</h2><p className="mt-6 max-w-[28rem] text-[1.12rem] text-muted">Share the product idea, the people it is for, and the workflow that is currently hard. I&rsquo;ll help turn that into a discovery conversation, a scoped MVP, and a practical proposal.</p><ol className="mt-8 max-w-[29rem] space-y-4 font-display text-[.95rem]"><li className="flex gap-3"><span className="text-gold">01</span><span><strong>Discover.</strong> Clarify users, constraints, integrations, and what success should look like.</span></li><li className="flex gap-3"><span className="text-gold">02</span><span><strong>Scope.</strong> Separate the smallest useful release from later bets and risks.</span></li><li className="flex gap-3"><span className="text-gold">03</span><span><strong>Propose.</strong> Receive deliverables, a rough timeline, architecture choice, and next decision—not a fixed price pulled from thin air.</span></li></ol><div className="mt-9 flex flex-wrap items-center gap-3"><a href={`mailto:${SITE.email}`} className="font-display text-[1.05rem] font-semibold underline decoration-ink/30 underline-offset-4 hover:decoration-ink">{SITE.email}</a><button type="button" onClick={copy} className="btn btn-quiet !gap-1.5 !px-3 !py-2 !text-[.85rem]" aria-live="polite">{copied ? <><Check size={14} aria-hidden="true" />Copied</> : <><Copy size={14} aria-hidden="true" />Copy</>}</button></div><ul className="mt-6 flex gap-5 font-display text-[.95rem] font-medium"><li><a href={SITE.github} className="inline-flex items-center gap-1.5 underline decoration-ink/30 underline-offset-4 hover:decoration-ink" rel="noopener noreferrer"><Github size={16} aria-hidden="true" />GitHub</a></li>{SITE.linkedin && <li><a href={SITE.linkedin} className="inline-flex items-center gap-1.5 underline decoration-ink/30 underline-offset-4 hover:decoration-ink"><Linkedin size={16} aria-hidden="true" />LinkedIn</a></li>}</ul></div>
    <div className="rounded-[1.65rem] border border-rule bg-card p-6 shadow-soft sm:p-8">{sent ? <div role="status" className="py-8"><Check size={36} className="text-forest" aria-hidden="true" /><h3 className="mt-4 font-display text-2xl font-semibold">Message sent</h3><p className="mt-2 max-w-[24rem] text-muted">Thanks, {f.name.trim().split(' ')[0]}. I&rsquo;ll reply to {f.email.trim()} within 24 hours.</p><button type="button" className="btn btn-quiet mt-6" onClick={() => { setSent(false); setF({ name: '', email: '', msg: '' }); setNeeds([]); setScope(SCOPE_OPTIONS[0]); }}>Send another message</button></div> : <form onSubmit={submit} noValidate className="space-y-5"><div className="grid gap-5 sm:grid-cols-2"><div><label htmlFor="c-name" className={lbl}>Your name</label><input id="c-name" className={cls('name')} autoComplete="name" value={f.name} aria-invalid={err?.field === 'name'} onChange={(e) => setF({ ...f, name: e.target.value })} /></div><div><label htmlFor="c-email" className={lbl}>Email</label><input id="c-email" type="email" className={cls('email')} autoComplete="email" value={f.email} aria-invalid={err?.field === 'email'} onChange={(e) => setF({ ...f, email: e.target.value })} /></div></div><fieldset><legend className={lbl}>What do you need? <span className="font-normal text-muted">(pick any)</span></legend><div className="flex flex-wrap gap-2">{NEEDS.map((n) => <label key={n} className="cursor-pointer"><input type="checkbox" className="peer sr-only" checked={needs.includes(n)} onChange={() => toggle(n)} /><span className="inline-block rounded-full border border-ink/20 bg-card px-3.5 py-2 font-display text-[.9rem] transition-colors hover:border-ink peer-checked:border-forest peer-checked:bg-forest peer-checked:text-white peer-focus-visible:outline peer-focus-visible:outline-[3px] peer-focus-visible:outline-offset-2 peer-focus-visible:outline-gold">{n}</span></label>)}</div></fieldset><div><label htmlFor="c-scope" className={lbl}>Where are you in the process?</label><select id="c-scope" className="field" value={scope} onChange={(e) => setScope(e.target.value)}>{SCOPE_OPTIONS.map((s) => <option key={s}>{s}</option>)}</select></div><div><label htmlFor="c-msg" className={lbl}>About the project</label><textarea id="c-msg" rows={6} maxLength={800} className={`${cls('msg')} resize-y`} placeholder="What are you trying to make easier for your users?" value={f.msg} aria-invalid={err?.field === 'msg'} onChange={(e) => setF({ ...f, msg: e.target.value })} /><p className="mt-1 text-right font-display text-[.8rem] text-muted">{f.msg.length}/800</p></div><div id="c-err" role="alert" className="min-h-[1.25rem] font-display text-[.95rem] text-[#B3261E]">{err?.text}{err?.field === 'form' && <> <a href={mailtoFallback()} className="font-semibold underline underline-offset-2">Email it instead</a>.</>}</div><button type="submit" disabled={sending} className="btn btn-primary">{sending ? 'Sending…' : <>Start the conversation <ArrowUpRight size={16} aria-hidden="true" /></>}</button></form>}</div>
  </div></section>;
}
