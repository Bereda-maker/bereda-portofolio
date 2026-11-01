'use client';

import { useEffect, useMemo, useState } from 'react';

type Type = { id: number; name: string; description: string | null; durationMinutes: number };
type Slot = { startsAt: string; endsAt: string; label: string };

export default function BookingForm() {
  const timezone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC', []);
  const [types, setTypes] = useState<Type[]>([]); const [typeId, setTypeId] = useState(''); const [date, setDate] = useState(''); const [slots, setSlots] = useState<Slot[]>([]); const [slot, setSlot] = useState<Slot | null>(null); const [form, setForm] = useState({ name: '', email: '', notes: '' }); const [loading, setLoading] = useState(false); const [message, setMessage] = useState(''); const [success, setSuccess] = useState(false);
  useEffect(() => { fetch('/api/appointments/types').then((res) => res.json()).then((data) => { setTypes(data.types || []); if (data.types?.[0]) setTypeId(String(data.types[0].id)); }).catch(() => setMessage('Meeting types are temporarily unavailable.')); }, []);
  useEffect(() => { if (!date || !typeId) return; setSlot(null); setMessage(''); fetch(`/api/appointments/availability?date=${date}&typeId=${typeId}&timezone=${encodeURIComponent(timezone)}`).then((res) => res.json()).then((data) => setSlots(data.slots || [])).catch(() => setMessage('Could not load available times.')); }, [date, typeId, timezone]);
  const selectedType = types.find((type) => String(type.id) === typeId);
  const today = new Date().toISOString().slice(0, 10);
  async function submit(event: React.FormEvent) { event.preventDefault(); if (!slot) { setMessage('Choose an available time.'); return; } setLoading(true); setMessage(''); try { const res = await fetch('/api/appointments', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...form, typeId, startsAt: slot.startsAt, endsAt: slot.endsAt, timezone }) }); const data = await res.json(); if (!res.ok) { setMessage(data.error || 'Booking could not be completed.'); return; } setSuccess(true); setMessage(data.meetingUrl ? `Booked. Your meeting link is ${data.meetingUrl}` : 'Booked. Check your email for confirmation details.'); } catch { setMessage('Could not reach the booking service. Please try again.'); } finally { setLoading(false); } }
  if (success) return <div className="admin-card p-6 sm:p-8"><p className="admin-eyebrow">Booking confirmed</p><h2 className="admin-title !text-3xl">You are all set.</h2><p className="admin-description">{message}</p></div>;
  return <form onSubmit={submit} className="admin-card grid gap-5 p-5 sm:p-8">
    <div><label className="mb-2 block text-xs font-bold uppercase tracking-widest text-[#aebedd]">Meeting purpose</label><select className="fld" value={typeId} onChange={(e) => setTypeId(e.target.value)}><option value="">Choose a meeting</option>{types.map((type) => <option key={type.id} value={type.id}>{type.name} · {type.durationMinutes} min</option>)}</select>{selectedType?.description && <p className="mt-2 text-sm text-[#aebedd]">{selectedType.description}</p>}</div>
    <div><label className="mb-2 block text-xs font-bold uppercase tracking-widest text-[#aebedd]">Date</label><input className="fld" type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} /></div>
    {date && <div><label className="mb-2 block text-xs font-bold uppercase tracking-widest text-[#aebedd]">Available times · {timezone}</label><div className="flex flex-wrap gap-2">{slots.length ? slots.map((item) => <button type="button" key={item.startsAt} onClick={() => setSlot(item)} className={`chip ${slot?.startsAt === item.startsAt ? 'on' : ''}`}>{item.label}</button>) : <p className="text-sm text-[#aebedd]">No available times on this date.</p>}</div></div>}
    <div className="grid gap-4 sm:grid-cols-2"><div><label className="mb-2 block text-xs font-bold uppercase tracking-widest text-[#aebedd]">Name</label><input className="fld" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div><div><label className="mb-2 block text-xs font-bold uppercase tracking-widest text-[#aebedd]">Email</label><input className="fld" required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div></div>
    <div><label className="mb-2 block text-xs font-bold uppercase tracking-widest text-[#aebedd]">Notes <span className="font-normal normal-case tracking-normal opacity-70">(optional)</span></label><textarea className="fld" rows={4} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
    {message && <p className="text-sm text-[#ff829b]">{message}</p>}<button className="admin-button w-fit" disabled={loading || !slot}>{loading ? 'Booking…' : 'Request this time'}</button>
  </form>;
}
