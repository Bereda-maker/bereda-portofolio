'use client';

import { useEffect, useMemo, useState } from 'react';

type Data = { calendar: { connected: boolean; accountLabel?: string | null; calendarId?: string | null }; types: Array<{ id: number; name: string; slug: string; durationMinutes: number; isActive: boolean }>; availability: Array<{ id: number; weekday: number; startMinute: number; endMinute: number; timezone: string }>; appointments: Array<{ id: number; attendeeName: string; attendeeEmail: string; startsAt: string; endsAt: string; status: string; notes: string | null }> };
type CalendarEvent = { id: string; summary: string; description: string | null; htmlLink: string | null; startsAt: string | null; endsAt: string | null };
type View = 'month' | 'week' | 'day';
type CalendarItem = { id: string; title: string; startsAt: string; endsAt: string; kind: 'google' | 'reservation'; href?: string | null };

const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const dayShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
function toMinutes(value: string) { const [hour, minute] = value.split(':').map(Number); return hour * 60 + minute; }
function keyFor(date: Date) { const year = date.getFullYear(); const month = String(date.getMonth() + 1).padStart(2, '0'); const day = String(date.getDate()).padStart(2, '0'); return `${year}-${month}-${day}`; }
function startOfWeek(date: Date) { const result = new Date(date); result.setHours(0, 0, 0, 0); result.setDate(result.getDate() - result.getDay()); return result; }
function addDays(date: Date, amount: number) { const result = new Date(date); result.setDate(result.getDate() + amount); return result; }
function formatTime(value: string) { return new Date(value).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); }

export default function AppointmentsPanel({ initialCalendarMessage = '' }: { initialCalendarMessage?: string }) {
  const [data, setData] = useState<Data | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [error, setError] = useState(initialCalendarMessage);
  const [view, setView] = useState<View>('month');
  const [cursor, setCursor] = useState(() => new Date());
  const [typeForm, setTypeForm] = useState({ name: '', slug: '', durationMinutes: '30', description: '' });
  const [hoursForm, setHoursForm] = useState({ weekday: '1', start: '09:00', end: '17:00', timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC' });

  async function load() {
    const res = await fetch('/api/admin/appointments', { cache: 'no-store' });
    const next = await res.json();
    if (!res.ok) { setError(next.error || 'Could not load appointments.'); return; }
    setData(next);
    if (next.calendar?.connected) {
      const calendarRes = await fetch('/api/calendar/google/events', { cache: 'no-store' });
      const calendarData = await calendarRes.json();
      if (calendarRes.ok) setEvents(calendarData.events || []);
      else setError(calendarData.error || 'Could not load Google Calendar events.');
    }
  }
  useEffect(() => { load().catch(() => setError('Could not load appointment settings.')); }, []);

  async function post(path: string, body: unknown) {
    const res = await fetch(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Request failed.');
    await load();
  }
  async function createType(e: React.FormEvent) { e.preventDefault(); try { await post('/api/admin/appointments/types', typeForm); setTypeForm({ name: '', slug: '', durationMinutes: '30', description: '' }); } catch (e) { setError(e instanceof Error ? e.message : 'Could not create type.'); } }
  async function createHours(e: React.FormEvent) { e.preventDefault(); try { await post('/api/admin/availability', { weekday: Number(hoursForm.weekday), startMinute: toMinutes(hoursForm.start), endMinute: toMinutes(hoursForm.end), timezone: hoursForm.timezone }); } catch (e) { setError(e instanceof Error ? e.message : 'Could not save hours.'); } }

  const items = useMemo<CalendarItem[]>(() => [
    ...events.filter((event): event is CalendarEvent & { startsAt: string; endsAt: string } => Boolean(event.startsAt && event.endsAt)).map((event) => ({ id: `google-${event.id}`, title: event.summary, startsAt: event.startsAt, endsAt: event.endsAt, kind: 'google' as const, href: event.htmlLink })),
    ...(data?.appointments || []).map((appointment) => ({ id: `reservation-${appointment.id}`, title: `${appointment.attendeeName} · reservation`, startsAt: appointment.startsAt, endsAt: appointment.endsAt, kind: 'reservation' as const })),
  ], [events, data?.appointments]);

  const visibleDays = useMemo(() => {
    if (view === 'day') return [new Date(cursor)];
    if (view === 'week') return Array.from({ length: 7 }, (_, index) => addDays(startOfWeek(cursor), index));
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const gridStart = startOfWeek(first);
    return Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
  }, [cursor, view]);
  function itemsFor(day: Date) { const dayKey = keyFor(day); return items.filter((item) => keyFor(new Date(item.startsAt)) === dayKey); }
  function move(amount: number) { const next = new Date(cursor); if (view === 'month') next.setMonth(next.getMonth() + amount); else if (view === 'week') next.setDate(next.getDate() + amount * 7); else next.setDate(next.getDate() + amount); setCursor(next); }
  const heading = view === 'month' ? cursor.toLocaleDateString([], { month: 'long', year: 'numeric' }) : view === 'week' ? `${visibleDays[0]?.toLocaleDateString([], { month: 'short', day: 'numeric' })} – ${visibleDays[6]?.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}` : cursor.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  if (!data) return <div className="admin-card p-6 text-sm text-[#aebedd]">Loading scheduling workspace…</div>;
  return <div className="grid gap-6">
    {error && <div className="admin-error">{error}</div>}
    <section className="admin-card flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6"><div><p className="admin-eyebrow">Calendar connection</p><h2 className="text-xl font-semibold">{data.calendar.connected ? `Connected · ${data.calendar.accountLabel || 'Google Calendar'}` : 'Google Calendar is not connected'}</h2><p className="mt-1 text-sm text-[#aebedd]">{data.calendar.connected ? `Calendar ID: ${data.calendar.calendarId}` : 'Connect the calendar used for free/busy checks, bookings, and Google Meet links.'}</p></div><div className="flex gap-2">{data.calendar.connected ? <button className="admin-button-secondary" onClick={async () => { await fetch('/api/calendar/google/disconnect', { method: 'POST' }); await load(); }}>Disconnect</button> : <a className="admin-button" href="/api/calendar/google/connect">Connect Google Calendar</a>}</div></section>

    <section className="admin-card calendar-shell">
      <div className="calendar-toolbar"><div><p className="admin-eyebrow">Schedule / Calendar</p><h2 className="calendar-heading">{heading}</h2></div><div className="calendar-controls"><button className="admin-button-secondary" onClick={() => setCursor(new Date())}>Today</button><button className="calendar-icon-button" aria-label="Previous period" onClick={() => move(-1)}>‹</button><button className="calendar-icon-button" aria-label="Next period" onClick={() => move(1)}>›</button><div className="calendar-view-switcher">{(['month', 'week', 'day'] as View[]).map((option) => <button key={option} className={view === option ? 'active' : ''} onClick={() => setView(option)}>{option}</button>)}</div></div></div>
      <div className={`calendar-grid calendar-${view}`}>
        {(view !== 'day' ? dayShort : [cursor.toLocaleDateString([], { weekday: 'short' })]).map((day) => <div key={day} className="calendar-weekday">{day}</div>)}
        {visibleDays.map((day) => <div key={keyFor(day)} className={`calendar-cell${day.getMonth() !== cursor.getMonth() && view === 'month' ? ' outside' : ''}${keyFor(day) === keyFor(new Date()) ? ' today' : ''}`}><div className="calendar-date">{day.getDate()}</div><div className="calendar-events">{itemsFor(day).map((item) => item.href ? <a key={item.id} href={item.href} target="_blank" rel="noreferrer" className={`calendar-event ${item.kind}`}><strong>{item.title}</strong><span>{formatTime(item.startsAt)}</span></a> : <div key={item.id} className={`calendar-event ${item.kind}`}><strong>{item.title}</strong><span>{formatTime(item.startsAt)}</span></div>)}</div></div>)}
      </div>
      <div className="calendar-legend"><span><i className="legend-dot google" />Google Calendar</span><span><i className="legend-dot reservation" />Portfolio reservation</span></div>
    </section>

    <div className="grid gap-6 lg:grid-cols-2"><section className="admin-card p-5 sm:p-6"><div className="admin-section-heading">Meeting types</div>{data.types.length ? <div className="mb-5 grid gap-2">{data.types.map((type) => <div key={type.id} className="admin-list-item flex items-center justify-between"><span>{type.name}</span><span className="text-xs text-[#aebedd]">{type.durationMinutes} min</span></div>)}</div> : <p className="mb-5 text-sm text-[#aebedd]">Create the first meeting type.</p>}<form onSubmit={createType} className="grid gap-3"><input className="fld" required placeholder="Name, e.g. Discovery call" value={typeForm.name} onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-') })} /><input className="fld" required placeholder="Slug" value={typeForm.slug} onChange={(e) => setTypeForm({ ...typeForm, slug: e.target.value })} /><input className="fld" required type="number" min="15" max="240" placeholder="Duration in minutes" value={typeForm.durationMinutes} onChange={(e) => setTypeForm({ ...typeForm, durationMinutes: e.target.value })} /><textarea className="fld" rows={2} placeholder="Short description" value={typeForm.description} onChange={(e) => setTypeForm({ ...typeForm, description: e.target.value })} /><button className="admin-button w-fit">Add meeting type</button></form></section>
    <section className="admin-card p-5 sm:p-6"><div className="admin-section-heading">Weekly availability</div>{data.availability.length ? <div className="mb-5 grid gap-2">{data.availability.map((row) => <div key={row.id} className="admin-list-item flex items-center justify-between"><span>{days[row.weekday]}</span><span className="text-xs text-[#aebedd]">{Math.floor(row.startMinute / 60).toString().padStart(2, '0')}:{(row.startMinute % 60).toString().padStart(2, '0')} – {Math.floor(row.endMinute / 60).toString().padStart(2, '0')}:{(row.endMinute % 60).toString().padStart(2, '0')}</span></div>)}</div> : <p className="mb-5 text-sm text-[#aebedd]">Add the hours when visitors can request meetings.</p>}<form onSubmit={createHours} className="grid gap-3"><select className="fld" value={hoursForm.weekday} onChange={(e) => setHoursForm({ ...hoursForm, weekday: e.target.value })}>{days.map((day, index) => <option key={day} value={index}>{day}</option>)}</select><div className="grid grid-cols-2 gap-3"><input className="fld" type="time" required value={hoursForm.start} onChange={(e) => setHoursForm({ ...hoursForm, start: e.target.value })} /><input className="fld" type="time" required value={hoursForm.end} onChange={(e) => setHoursForm({ ...hoursForm, end: e.target.value })} /></div><input className="fld" required value={hoursForm.timezone} onChange={(e) => setHoursForm({ ...hoursForm, timezone: e.target.value })} /><button className="admin-button w-fit">Add availability window</button></form></section></div>

    <section><div className="admin-section-heading">Upcoming reservations</div>{data.appointments.length ? <div className="admin-list">{data.appointments.map((appointment) => <div key={appointment.id} className="admin-list-item flex flex-wrap items-center justify-between gap-3"><div><strong>{appointment.attendeeName}</strong><p className="text-sm text-[#aebedd]">{appointment.attendeeEmail} · {new Date(appointment.startsAt).toLocaleString()}</p></div><span className="chip on">{appointment.status}</span></div>)}</div> : <div className="admin-card p-5 text-sm text-[#aebedd]">No upcoming reservations.</div>}</section>
  </div>;
}
