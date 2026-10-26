'use client';
import { useState } from 'react';
import { ArrowUpRight, Check, Copy, Github, Mail } from 'lucide-react';
import FadeIn from '@/components/ui/FadeIn';
import { SITE } from '@/data/content';

type Err = { field: 'name' | 'email' | 'message' | 'form'; text: string } | null;

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [error, setError] = useState<Err>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [copied, setCopied] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = form.name.trim();
    const email = form.email.trim();
    const message = form.message.trim();
    if (!name) return setError({ field: 'name', text: 'Please enter your name.' });
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError({ field: 'email', text: 'Enter a valid email address.' });
    if (message.length < 10) return setError({ field: 'message', text: 'Add a little more detail (10+ characters).' });
    setError(null);
    setSending(true);
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message }),
      });
      const data: { ok?: true; error?: string } = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError({ field: 'form', text: data.error ?? 'Something went wrong. Please try again.' });
        return;
      }
      setSent(true);
    } catch {
      setError({ field: 'form', text: 'Could not reach the server. Please try again.' });
    } finally {
      setSending(false);
    }
  };

  const copyEmail = async () => {
    try { await navigator.clipboard.writeText(SITE.email); } catch { /* Keep the address visible if clipboard permission is unavailable. */ }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const fieldClass = (field: 'name' | 'email' | 'message') => `contact-field${error?.field === field ? ' has-error' : ''}`;

  return (
    <section id="contact" className="contact-section section-shell">
      <div className="section-kicker"><span>04 / START A CONVERSATION</span><i /></div>
      <div className="contact-grid">
        <FadeIn y={22}>
          <div className="contact-copy">
            <h2>Have a good<br /><em>problem?</em></h2>
            <p>Tell me what you&apos;re building, where you&apos;re stuck, or what you want to make possible. Let&apos;s work out the right next step.</p>
            <div className="contact-email-label">DIRECT LINE</div>
            <button className="email-copy" onClick={copyEmail} type="button"><span>{SITE.email}</span>{copied ? <Check size={17} /> : <Copy size={16} />}</button>
            <div className="contact-socials">
              <a href={SITE.github} target="_blank" rel="noopener noreferrer"><Github size={17} /> GitHub <ArrowUpRight size={14} /></a>
              <a href={`mailto:${SITE.email}`}><Mail size={17} /> Email <ArrowUpRight size={14} /></a>
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={0.1} y={22}>
          <div className="contact-form-card">
            {sent ? (
              <div className="contact-success" role="status"><span className="success-icon"><Check size={24} /></span><h3>Message received.</h3><p>Thanks for reaching out. I&apos;ll get back to you soon.</p><button type="button" className="text-button" onClick={() => { setSent(false); setForm({ name: '', email: '', message: '' }); }}>Send another <ArrowUpRight size={15} /></button></div>
            ) : (
              <form onSubmit={submit} noValidate>
                <div className="form-card-heading"><span>YOUR NOTE</span><span>01 — 03</span></div>
                <div className="form-row">
                  <label>Name<input className={fieldClass('name')} autoComplete="name" placeholder="Your name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
                  <label>Email<input className={fieldClass('email')} type="email" autoComplete="email" placeholder="you@example.com" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
                </div>
                <label className="message-label">What are you working on?<textarea className={fieldClass('message')} rows={5} maxLength={4000} placeholder="A little context helps me reply thoughtfully…" value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} /><span className="character-count">{form.message.length}/4000</span></label>
                {error && <p className="form-error" role="alert">{error.text}</p>}
                <button type="submit" className="submit-button" disabled={sending}>{sending ? 'Sending…' : 'Send message'} <ArrowUpRight size={17} /></button>
              </form>
            )}
          </div>
        </FadeIn>
      </div>
      <footer className="site-footer"><span>© {new Date().getFullYear()} {SITE.name}</span><span>Full-stack product engineer</span><a href="#top">Back to top ↑</a></footer>
    </section>
  );
}
