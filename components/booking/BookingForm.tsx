'use client';

import { useEffect, useMemo, useState } from 'react';

type Type = { id: number; name: string; description: string | null; durationMinutes: number };
type Slot = { startsAt: string; endsAt: string; label: string };
type Audience = { label: string; agendas: string[] };

const AUDIENCES: Audience[] = [
  { label: 'Employers & Recruiters', agendas: ['Job Interview', 'Technical Interview', 'Initial Screening Call', 'Hiring Manager Interview', 'Portfolio Review', 'Career Discussion', 'Recruiter Introduction Call', 'Salary and Offer Discussion', 'Contract Employment Discussion', 'Internship Interview'] },
  { label: 'Freelance Clients & Businesses', agendas: ['Client Discovery Call', 'Project Briefing', 'Requirements Gathering Meeting', 'Project Planning Meeting', 'Technical Consultation', 'Proposal Presentation', 'Project Cost Estimation Meeting', 'Project Demonstration', 'Progress Review Meeting', 'Project Handoff Meeting', 'Website Review Meeting', 'Maintenance and Support Discussion'] },
  { label: 'Startup Founders & Entrepreneurs', agendas: ['Startup Introduction Call', 'Startup Idea Discussion', 'Product Discovery Meeting', 'Idea Validation Session', 'MVP Planning Meeting', 'Technical Feasibility Assessment', 'Product Strategy Session', 'Prototype Demonstration', 'Product Roadmap Planning', 'Startup Collaboration Discussion', 'Technical Consultation', 'Startup Launch Planning'] },
  { label: 'Investors & Venture Capital Firms', agendas: ['Investor Introduction Call', 'Startup Pitch Meeting', 'Investment Opportunity Discussion', 'Product Demonstration', 'Fundraising Strategy Meeting', 'Business Model Presentation', 'Market Opportunity Discussion', 'Traction and Growth Review', 'Investor Due Diligence Meeting', 'Funding Negotiation', 'Investment Partnership Discussion', 'Follow-Up Investor Meeting'] },
  { label: 'Technical & Business Co-Founders', agendas: ['Co-Founder Introduction Call', 'Co-Founder Compatibility Discussion', 'Business Idea Brainstorming', 'Technical Skills Assessment', 'Product Vision Alignment', 'Startup Planning Session', 'Roles and Responsibilities Discussion', 'Equity and Ownership Discussion', 'Founder Agreement Discussion', 'Business Model Planning', 'Product Development Planning', 'Long-Term Vision Meeting'] },
  { label: 'Startups & Technology Companies', agendas: ['Company Introduction Call', 'Software Engineering Interview', 'Technical Assessment Discussion', 'Engineering Team Introduction', 'Product Development Meeting', 'Software Architecture Review', 'Code Review Discussion', 'API Integration Planning', 'Technical Consultation', 'Remote Work Opportunity Discussion', 'Product Collaboration Meeting', 'Technology Partnership Discussion'] },
  { label: 'Internship & Training Programs', agendas: ['Internship Introduction Call', 'Internship Interview', 'Technical Skills Assessment', 'Portfolio Evaluation', 'Training Program Interview', 'Apprenticeship Discussion', 'Mentorship Introduction', 'Learning Goals Discussion', 'Career Development Session', 'Training Progress Review', 'Internship Performance Review', 'Program Application Discussion'] },
  { label: 'Agencies & Consulting Firms', agendas: ['Agency Introduction Call', 'Partnership Introduction Meeting', 'Client Project Briefing', 'Contractor Interview', 'Project Scope Discussion', 'Development Proposal Review', 'Outsourcing Opportunity Discussion', 'White-Label Development Discussion', 'Resource and Capacity Planning', 'Project Estimation Meeting', 'Project Handoff Meeting', 'Long-Term Collaboration Discussion'] },
  { label: 'Mentors & Professional Networks', agendas: ['Mentor Introduction Call', 'Career Guidance Session', 'Technical Mentorship Session', 'Portfolio Review', 'GitHub Profile Review', 'CV and Resume Review', 'Interview Preparation Session', 'Software Engineering Roadmap Discussion', 'Skill Development Planning', 'Professional Networking Call', 'Career Opportunity Discussion', 'Referral Discussion'] },
  { label: 'Strategic Partners & Collaborators', agendas: ['Partnership Introduction Call', 'Strategic Partnership Meeting', 'Collaboration Brainstorming', 'Joint Product Development Planning', 'Technology Integration Discussion', 'Business Development Meeting', 'Educational Content Collaboration', 'Open-Source Collaboration Meeting', 'Marketing Partnership Discussion', 'Audience Growth Collaboration', 'Joint Venture Discussion', 'Partnership Proposal Review', 'Partnership Agreement Discussion', 'Long-Term Strategy Meeting'] },
];

export default function BookingForm() {
  const timezone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC', []);
  const [types, setTypes] = useState<Type[]>([]);
  const [typeId, setTypeId] = useState('');
  const [audience, setAudience] = useState('');
  const [agenda, setAgenda] = useState('');
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slot, setSlot] = useState<Slot | null>(null);
  const [form, setForm] = useState({ name: '', email: '', notes: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch('/api/appointments/types').then((res) => res.json()).then((data) => {
      setTypes(data.types || []);
      if (data.types?.[0]) setTypeId(String(data.types[0].id));
    }).catch(() => setMessage('Meeting types are temporarily unavailable.'));
  }, []);

  useEffect(() => {
    if (!date || !typeId) return;
    setSlot(null);
    setMessage('');
    fetch(`/api/appointments/availability?date=${date}&typeId=${typeId}&timezone=${encodeURIComponent(timezone)}`)
      .then((res) => res.json())
      .then((data) => setSlots(data.slots || []))
      .catch(() => setMessage('Could not load available times.'));
  }, [date, typeId, timezone]);

  const selectedType = types.find((type) => String(type.id) === typeId);
  const selectedAudience = AUDIENCES.find((item) => item.label === audience);
  const today = new Date().toISOString().slice(0, 10);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!audience) { setMessage('Choose who you are.'); return; }
    if (!agenda) { setMessage('Choose a meeting format.'); return; }
    if (!slot) { setMessage('Choose an available time.'); return; }
    setLoading(true);
    setMessage('');
    const conversationNotes = [`Identity: ${audience}`, `Meeting format: ${agenda}`, form.notes.trim() ? `Additional context: ${form.notes.trim()}` : ''].filter(Boolean).join('\n');
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...form, notes: conversationNotes, typeId, startsAt: slot.startsAt, endsAt: slot.endsAt, timezone }),
      });
      const data = await res.json();
      if (!res.ok) { setMessage(data.error || 'Booking could not be completed.'); return; }
      setSuccess(true);
      setMessage(data.meetingUrl ? `Booked. Your meeting link is ${data.meetingUrl}` : 'Booked. Check your email for confirmation details.');
    } catch {
      setMessage('Could not reach the booking service. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (success) return <div className="admin-card p-6 sm:p-8"><p className="admin-eyebrow">Booking confirmed</p><h2 className="admin-title !text-3xl">You are all set.</h2><p className="admin-description">{message}</p></div>;

  return <form onSubmit={submit} className="admin-card grid gap-5 p-5 sm:p-8">
    <div>
      <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-[#aebedd]">I am a...</label>
      <select className="fld" required value={audience} onChange={(event) => { setAudience(event.target.value); setAgenda(''); }}>
        <option value="">Choose your identity</option>
        {AUDIENCES.map((item) => <option key={item.label} value={item.label}>{item.label}</option>)}
      </select>
    </div>
    {selectedAudience && <div>
      <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-[#aebedd]">Meeting format</label>
      <select className="fld" required value={agenda} onChange={(event) => setAgenda(event.target.value)}>
        <option value="">Choose a meeting format</option>
        {selectedAudience.agendas.map((item) => <option key={item} value={item}>{item}</option>)}
      </select>
    </div>}
    <div>
      <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-[#aebedd]">Meeting format</label>
      <select className="fld" value={typeId} onChange={(event) => setTypeId(event.target.value)}><option value="">Choose a meeting</option>{types.map((type) => <option key={type.id} value={type.id}>{type.name} · {type.durationMinutes} min</option>)}</select>
      {selectedType?.description && <p className="mt-2 text-sm text-[#aebedd]">{selectedType.description}</p>}
    </div>
    <div><label className="mb-2 block text-xs font-bold uppercase tracking-widest text-[#aebedd]">Date</label><input className="fld" type="date" min={today} value={date} onChange={(event) => setDate(event.target.value)} /></div>
    {date && <div><label className="mb-2 block text-xs font-bold uppercase tracking-widest text-[#aebedd]">Available times · {timezone}</label><div className="flex flex-wrap gap-2">{slots.length ? slots.map((item) => <button type="button" key={item.startsAt} onClick={() => setSlot(item)} className={`chip ${slot?.startsAt === item.startsAt ? 'on' : ''}`}>{item.label}</button>) : <p className="text-sm text-[#aebedd]">No available times on this date.</p>}</div></div>}
    <div className="grid gap-4 sm:grid-cols-2"><div><label className="mb-2 block text-xs font-bold uppercase tracking-widest text-[#aebedd]">Name</label><input className="fld" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></div><div><label className="mb-2 block text-xs font-bold uppercase tracking-widest text-[#aebedd]">Email</label><input className="fld" required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></div></div>
    <div><label className="mb-2 block text-xs font-bold uppercase tracking-widest text-[#aebedd]">Additional context <span className="font-normal normal-case tracking-normal opacity-70">(optional)</span></label><textarea className="fld" rows={4} maxLength={1800} placeholder="Share a little about your situation, project, or goals." value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></div>
    {message && <p className="text-sm text-[#ff829b]" role="alert">{message}</p>}<button className="admin-button w-fit" disabled={loading || !slot || !audience || !agenda}>{loading ? 'Booking…' : 'Request this conversation'}</button>
  </form>;
}
