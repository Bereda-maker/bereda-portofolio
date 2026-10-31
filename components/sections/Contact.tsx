'use client';
import { useState } from 'react';
import { Check, Copy, Github, Linkedin } from 'lucide-react';
import { SITE } from '@/data/content';

const NEEDS = ['Web app', 'API / backend', 'SaaS product', 'AI feature', 'Something else'];
const BUDGETS = ['Not sure yet', 'Up to $1,000', '$1,000 – $3,000', '$3,000 – $7,000', '$7,000 – $15,000', '$15,000 or more'];
type Err = { field: 'name' | 'email' | 'msg' | 'form'; text: string } | null;

export default function Contact() {
  const [f, setF] = useState({ name: '', email: '', msg: '' });
  const [needs, setNeeds] = useState<string[]>([]);
  const [budget, setBudget] = useState(BUDGETS[0]);
  const [err, setErr] = useState<Err>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [copied, setCopied] = useState(false);

  const mailtoFallback = () => {
    const body = `${f.msg}\n\nNeed: ${needs.join(', ') || 'Not specified'}\nBudget: ${budget}\n\n${f.name}`;
    return `mailto:${SITE.email}?subject=${encodeURIComponent('Project enquiry')}&body=${encodeURIComponent(body)}`;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = f.name.trim(), email = f.email.trim(), msg = f.msg.trim();
    if (!name) return setErr({ field: 'name', text: 'Enter your name so I know who to reply to.' });
    if (!/^\S+@\S+\.\S+$/.test(email)) return setErr({ field: 'email', text: 'Enter a valid email address, like name@example.com.' });
    if (msg.length < 10) return setErr({ field: 'msg', text: 'Write at least a sentence about the project (10+ characters).' });
    setErr(null);
    setSending(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message: `${msg}\n\nBudget range: ${budget}`, needs }),
      });
      const data: { ok?: true; error?: string } = await res.json().catch(() => ({}));
      if (!res.ok) return setErr({ field: 'form', text: data.error ?? 'The message could not be sent.' });
      setSent(true);
    } catch {
      setErr({ field: 'form', text: 'Could not reach the server. Check your connection.' });
    } finally {
      setSending(false);
    }
  };

  const copy = async () => {
    try { await navigator.clipboard.writeText(SITE.email); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch {}
  };
  const toggle = (n: string) => setNeeds((cur) => (cur.includes(n) ? cur.filter((x) => x !== n) : [...cur, n]));
  const cls = (k: string) => `field${err?.field === k ? ' field-error' : ''}`;
  const lbl = 'mb-1.5 block font-display text-[.95rem] font-medium';

  return (
    <section id="contact" className="border-t border-rule bg-panel">
      <div className="wrap grid gap-12 py-20 md:grid-cols-[1fr_1.3fr] md:gap-20 md:py-28">
        <div>
          <h2 className="section-title max-w-[14ch]">Tell me what you&rsquo;re making</h2>
          <p className="mt-6 max-w-[26rem] text-muted">I reply within 24 hours. A few lines about the project and what you need is enough to start.</p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a href={`mailto:${SITE.email}`} className="font-display text-[1.1rem] font-semibold underline decoration-ink/30 underline-offset-4 hover:decoration-ink">{SITE.email}</a>
            <button type="button" onClick={copy} className="btn btn-quiet !gap-1.5 !px-3 !py-2 !text-[.85rem]" aria-live="polite">
              {copied ? <><Check size={14} aria-hidden="true" />Copied</> : <><Copy size={14} aria-hidden="true" />Copy</>}
            </button>
          </div>
          <ul className="mt-6 flex gap-5 font-display text-[.95rem] font-medium">
            <li><a href={SITE.github} className="inline-flex items-center gap-1.5 underline decoration-ink/30 underline-offset-4 hover:decoration-ink" rel="noopener noreferrer"><Github size={16} aria-hidden="true" />GitHub</a></li>
            {SITE.linkedin && <li><a href={SITE.linkedin} className="inline-flex items-center gap-1.5 underline decoration-ink/30 underline-offset-4 hover:decoration-ink" rel="noopener noreferrer"><Linkedin size={16} aria-hidden="true" />LinkedIn</a></li>}
          </ul>
        </div>

        <div className="rounded-lg border border-rule bg-paper p-6 sm:p-8">
          {sent ? (
            <div role="status" className="py-8">
              <Check size={36} className="text-forest" aria-hidden="true" />
              <h3 className="mt-4 font-display text-2xl font-semibold">Message sent</h3>
              <p className="mt-2 max-w-[24rem] text-muted">Thanks, {f.name.trim().split(' ')[0]}. I&rsquo;ll reply to {f.email.trim()} within 24 hours.</p>
              <button type="button" className="btn btn-quiet mt-6" onClick={() => { setSent(false); setF({ name: '', email: '', msg: '' }); setNeeds([]); setBudget(BUDGETS[0]); }}>Send another message</button>
            </div>
          ) : (
            <form onSubmit={submit} noValidate className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="c-name" className={lbl}>Your name</label>
                  <input id="c-name" className={cls('name')} autoComplete="name" value={f.name} aria-invalid={err?.field === 'name'} aria-describedby={err?.field === 'name' ? 'c-err' : undefined} onChange={(e) => setF({ ...f, name: e.target.value })} />
                </div>
                <div>
                  <label htmlFor="c-email" className={lbl}>Email</label>
                  <input id="c-email" type="email" className={cls('email')} autoComplete="email" value={f.email} aria-invalid={err?.field === 'email'} aria-describedby={err?.field === 'email' ? 'c-err' : undefined} onChange={(e) => setF({ ...f, email: e.target.value })} />
                </div>
              </div>

              <fieldset>
                <legend className={lbl}>What do you need? <span className="font-normal text-muted">(pick any)</span></legend>
                <div className="flex flex-wrap gap-2">
                  {NEEDS.map((n) => (
                    <label key={n} className="cursor-pointer">
                      <input type="checkbox" className="peer sr-only" checked={needs.includes(n)} onChange={() => toggle(n)} />
                      <span className="inline-block rounded-md border border-ink/30 bg-white px-3.5 py-2 font-display text-[.9rem] transition-colors hover:border-ink peer-checked:border-forest peer-checked:bg-forest peer-checked:text-white peer-focus-visible:outline peer-focus-visible:outline-[3px] peer-focus-visible:outline-offset-2 peer-focus-visible:outline-gold">{n}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <div>
                <label htmlFor="c-budget" className={lbl}>Budget</label>
                <select id="c-budget" className="field" value={budget} onChange={(e) => setBudget(e.target.value)}>
                  {BUDGETS.map((b) => <option key={b}>{b}</option>)}
                </select>
              </div>

              <div>
                <label htmlFor="c-msg" className={lbl}>About the project</label>
                <textarea id="c-msg" rows={5} maxLength={600} className={`${cls('msg')} resize-y`} value={f.msg} aria-invalid={err?.field === 'msg'} aria-describedby={err?.field === 'msg' ? 'c-err' : undefined} onChange={(e) => setF({ ...f, msg: e.target.value })} />
                <p className="mt-1 text-right font-display text-[.8rem] text-muted">{f.msg.length}/600</p>
              </div>

              <div id="c-err" role="alert" className="min-h-[1.25rem] font-display text-[.95rem] text-[#B3261E]">
                {err?.text}
                {err?.field === 'form' && <> You can <a href={mailtoFallback()} className="font-semibold underline underline-offset-2">send it by email instead</a>.</>}
              </div>

              <button type="submit" disabled={sending} className="btn btn-primary disabled:opacity-60">{sending ? 'Sending…' : 'Send message'}</button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
