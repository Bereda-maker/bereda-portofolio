'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';

type Data = { calendar: { connected: boolean; accountLabel?: string | null; calendarId?: string | null }; types: Array<{ id: number; name: string; slug: string; durationMinutes: number; isActive: boolean }>; availability: Array<{ id: number; weekday: number; startMinute: number; endMinute: number; timezone: string }>; appointments: Array<{ id: number; attendeeName: string; attendeeEmail: string; startsAt: string; endsAt: string; status: string; notes: string | null }> };
type CalendarEvent = { id: string; summary: string; description: string | null; htmlLink: string | null; startsAt: string | null; endsAt: string | null };
type PlanningTask = { id: number; title: string; startsAt: string; endsAt: string; status: 'planned' | 'in_progress' | 'done' | 'cancelled'; priority: 'low' | 'normal' | 'high'; notes: string | null };
type PlanningPlan = { id: number; period: 'week' | 'month'; periodStart: string; title: string; targetMinutes: number; targetLabel: string | null; notes: string | null };
type View = 'month' | 'week' | 'day';
type CalendarItem = { id: string; title: string; startsAt: string; endsAt: string; kind: 'google' | 'reservation' | 'planning'; href?: string | null; task?: PlanningTask };

const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const dayShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const timeSlots = Array.from({ length: 24 }, (_, index) => index * 60);
function toMinutes(value: string) { const [hour, minute] = value.split(':').map(Number); return hour * 60 + minute; }
function keyFor(date: Date) { const year = date.getFullYear(); const month = String(date.getMonth() + 1).padStart(2, '0'); const day = String(date.getDate()).padStart(2, '0'); return `${year}-${month}-${day}`; }
function startOfDay(date: Date) { const result = new Date(date); result.setHours(0, 0, 0, 0); return result; }
function startOfWeek(date: Date) { const result = startOfDay(date); result.setDate(result.getDate() - result.getDay()); return result; }
function addDays(date: Date, amount: number) { const result = new Date(date); result.setDate(result.getDate() + amount); return result; }
function formatTime(value: string) { return new Date(value).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); }
function localDateTime(date: Date, hour = 9, minute = 0) { const result = new Date(date); result.setHours(hour, minute, 0, 0); const pad = (value: number) => String(value).padStart(2, '0'); return `${result.getFullYear()}-${pad(result.getMonth() + 1)}-${pad(result.getDate())}T${pad(result.getHours())}:${pad(result.getMinutes())}`; }
function minutesBetween(startsAt: string, endsAt: string) { return Math.max(0, Math.round((new Date(endsAt).getTime() - new Date(startsAt).getTime()) / 60000)); }
function periodStartFor(date: Date, period: 'week' | 'month') { return period === 'week' ? startOfWeek(date) : new Date(date.getFullYear(), date.getMonth(), 1); }
function periodKey(date: Date, period: 'week' | 'month') { return `${period}:${keyFor(periodStartFor(date, period))}`; }
function periodLabel(date: Date, period: 'week' | 'month') { return period === 'week' ? `Week of ${periodStartFor(date, period).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}` : periodStartFor(date, period).toLocaleDateString([], { month: 'long', year: 'numeric' }); }

export default function AppointmentsPanel({ initialCalendarMessage = '' }: { initialCalendarMessage?: string }) {
  const [data, setData] = useState<Data | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [tasks, setTasks] = useState<PlanningTask[]>([]);
  const [plans, setPlans] = useState<PlanningPlan[]>([]);
  const [error, setError] = useState(initialCalendarMessage);
  const [view, setView] = useState<View>('week');
  const [cursor, setCursor] = useState(() => new Date());
  const [showPlanner, setShowPlanner] = useState(false);
  const [typeForm, setTypeForm] = useState({ name: '', slug: '', durationMinutes: '30', description: '' });
  const [hoursForm, setHoursForm] = useState({ weekday: '1', start: '09:00', end: '17:00', timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC' });
  const [taskForm, setTaskForm] = useState({ title: '', startsAt: localDateTime(new Date(), 9), endsAt: localDateTime(new Date(), 10), priority: 'normal', notes: '' });
  const [planForm, setPlanForm] = useState({ title: '', targetMinutes: '600', targetLabel: '', notes: '' });

  const visibleDays = useMemo(() => {
    if (view === 'day') return [new Date(cursor)];
    if (view === 'week') return Array.from({ length: 7 }, (_, index) => addDays(startOfWeek(cursor), index));
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    return Array.from({ length: 42 }, (_, index) => addDays(startOfWeek(first), index));
  }, [cursor, view]);
  const activePeriod = view === 'month' ? 'month' : 'week';
  const activePlan = plans.find((plan) => plan.period === activePeriod && periodKey(new Date(plan.periodStart), plan.period) === periodKey(cursor, plan.period));

  async function loadPlanning() {
    const from = startOfDay(visibleDays[0] || cursor);
    const to = addDays(startOfDay(visibleDays[visibleDays.length - 1] || cursor), 1);
    const response = await fetch(`/api/admin/calendar-plans?from=${encodeURIComponent(from.toISOString())}&to=${encodeURIComponent(to.toISOString())}`, { cache: 'no-store' });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Could not load planning blocks.');
    setTasks(result.tasks || []);
    setPlans(result.plans || []);
  }

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
    } else setEvents([]);
    await loadPlanning();
  }
  useEffect(() => { load().catch(() => setError('Could not load appointment settings.')); }, []);
  useEffect(() => { if (data) loadPlanning().catch(() => setError('Could not refresh planning blocks.')); }, [cursor, view]);
  useEffect(() => { setPlanForm({ title: activePlan?.title || '', targetMinutes: String(activePlan?.targetMinutes || 600), targetLabel: activePlan?.targetLabel || '', notes: activePlan?.notes || '' }); }, [activePlan?.id, activePeriod, cursor]);

  async function request(path: string, method: string, body?: unknown) {
    const response = await fetch(path, { method, headers: body ? { 'content-type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || 'Request failed.');
    return result;
  }
  async function post(path: string, body: unknown) { await request(path, 'POST', body); await loadPlanning(); }
  async function createType(e: FormEvent) { e.preventDefault(); try { await post('/api/admin/appointments/types', typeForm); setTypeForm({ name: '', slug: '', durationMinutes: '30', description: '' }); await load(); } catch (e) { setError(e instanceof Error ? e.message : 'Could not create type.'); } }
  async function createHours(e: FormEvent) { e.preventDefault(); try { await post('/api/admin/availability', { weekday: Number(hoursForm.weekday), startMinute: toMinutes(hoursForm.start), endMinute: toMinutes(hoursForm.end), timezone: hoursForm.timezone }); await load(); } catch (e) { setError(e instanceof Error ? e.message : 'Could not save hours.'); } }
  async function createTask(e: FormEvent) { e.preventDefault(); try { await post('/api/admin/calendar-plans', { kind: 'task', ...taskForm }); setTaskForm({ ...taskForm, title: '', notes: '' }); setShowPlanner(false); } catch (e) { setError(e instanceof Error ? e.message : 'Could not save planning block.'); } }
  async function savePlan(e: FormEvent) { e.preventDefault(); try { await post('/api/admin/calendar-plans', { kind: 'plan', period: activePeriod, periodStart: periodStartFor(cursor, activePeriod).toISOString(), ...planForm, targetMinutes: Number(planForm.targetMinutes) }); } catch (e) { setError(e instanceof Error ? e.message : 'Could not save planning target.'); } }
  async function deleteTask(id: number) { try { await request(`/api/admin/calendar-plans?id=${id}`, 'DELETE'); await loadPlanning(); } catch (e) { setError(e instanceof Error ? e.message : 'Could not delete planning block.'); } }
  async function changeTaskStatus(task: PlanningTask) { const next = task.status === 'planned' ? 'in_progress' : task.status === 'in_progress' ? 'done' : 'planned'; try { await request('/api/admin/calendar-plans', 'PATCH', { id: task.id, status: next }); await loadPlanning(); } catch (e) { setError(e instanceof Error ? e.message : 'Could not update planning block.'); } }

  const items = useMemo<CalendarItem[]>(() => [
    ...events.filter((event): event is CalendarEvent & { startsAt: string; endsAt: string } => Boolean(event.startsAt && event.endsAt)).map((event) => ({ id: `google-${event.id}`, title: event.summary, startsAt: event.startsAt, endsAt: event.endsAt, kind: 'google' as const, href: event.htmlLink })),
    ...(data?.appointments || []).map((appointment) => ({ id: `reservation-${appointment.id}`, title: `${appointment.attendeeName} · reservation`, startsAt: appointment.startsAt, endsAt: appointment.endsAt, kind: 'reservation' as const })),
    ...tasks.map((task) => ({ id: `task-${task.id}`, title: task.title, startsAt: task.startsAt, endsAt: task.endsAt, kind: 'planning' as const, task })),
  ], [events, data?.appointments, tasks]);
  function itemsFor(day: Date) { const dayKey = keyFor(day); return items.filter((item) => keyFor(new Date(item.startsAt)) === dayKey); }
  function tasksForSlot(day: Date, slot: number) { return tasks.filter((task) => keyFor(new Date(task.startsAt)) === keyFor(day) && new Date(task.startsAt).getHours() * 60 + new Date(task.startsAt).getMinutes() === slot); }
  function itemsForSlot(day: Date, slot: number) { return items.filter((item) => keyFor(new Date(item.startsAt)) === keyFor(day) && new Date(item.startsAt).getHours() * 60 + new Date(item.startsAt).getMinutes() === slot); }
  function move(amount: number) { const next = new Date(cursor); if (view === 'month') next.setMonth(next.getMonth() + amount); else if (view === 'week') next.setDate(next.getDate() + amount * 7); else next.setDate(next.getDate() + amount); setCursor(next); }
  function openPlanner(day: Date, hour = 9, minute = 0) { setTaskForm({ title: '', startsAt: localDateTime(day, hour, minute), endsAt: localDateTime(day, hour + 1, minute), priority: 'normal', notes: '' }); setShowPlanner(true); }
  const heading = view === 'month' ? cursor.toLocaleDateString([], { month: 'long', year: 'numeric' }) : view === 'week' ? `${visibleDays[0]?.toLocaleDateString([], { month: 'short', day: 'numeric' })} – ${visibleDays[6]?.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}` : cursor.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const progressMinutes = tasks.filter((task) => task.status !== 'cancelled' && new Date(task.startsAt) >= periodStartFor(cursor, activePeriod) && new Date(task.startsAt) < (activePeriod === 'week' ? addDays(periodStartFor(cursor, activePeriod), 7) : new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))).reduce((sum, task) => sum + minutesBetween(task.startsAt, task.endsAt), 0);

  if (!data) return <div className="admin-card p-6 text-sm text-[color:var(--admin-muted)]">Loading scheduling workspace…</div>;
  return <div className="grid gap-6">
    {error && <div className="admin-error" role="alert">{error}</div>}
    <section className="admin-card flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6"><div><p className="admin-eyebrow">Calendar connection</p><h2 className="text-xl font-semibold">{data.calendar.connected ? `Connected · ${data.calendar.accountLabel || 'Google Calendar'}` : 'Google Calendar is not connected'}</h2><p className="mt-1 text-sm text-[color:var(--admin-muted)]">{data.calendar.connected ? `Calendar ID: ${data.calendar.calendarId}` : 'Connect the calendar used for free/busy checks, bookings, and Google Meet links.'}</p></div><div className="flex gap-2">{data.calendar.connected ? <button className="admin-button-secondary" onClick={async () => { await request('/api/calendar/google/disconnect', 'POST'); await load(); }}>Disconnect</button> : <a className="admin-button" href="/api/calendar/google/connect">Connect Google Calendar</a>}</div></section>

    <section className="admin-card calendar-shell">
      <div className="calendar-toolbar"><div><p className="admin-eyebrow">Schedule / Calendar</p><h2 className="calendar-heading">{heading}</h2><p className="mt-1 text-sm text-[color:var(--admin-muted)]">{tasks.length} planned block{tasks.length === 1 ? '' : 's'} in view · 24-hour day · 1-hour slots</p></div><div className="calendar-controls"><button className="admin-button-secondary" onClick={() => setCursor(new Date())}>Today</button><button className="calendar-icon-button" aria-label="Previous period" onClick={() => move(-1)}>‹</button><button className="calendar-icon-button" aria-label="Next period" onClick={() => move(1)}>›</button><div className="calendar-view-switcher">{(['month', 'week', 'day'] as View[]).map((option) => <button key={option} className={view === option ? 'active' : ''} onClick={() => setView(option)}>{option}</button>)}</div><button className="admin-button" onClick={() => openPlanner(cursor)}>+ Plan time</button></div></div>{activePlan && <div className="calendar-plan-banner"><span className="calendar-plan-kicker">{activePeriod} plan</span><strong>{activePlan.title}</strong><span>{activePlan.targetMinutes ? `${Math.floor(activePlan.targetMinutes / 60)}h ${activePlan.targetMinutes % 60}m target` : 'No time target set'}{activePlan.targetLabel ? ` · ${activePlan.targetLabel}` : ''}</span></div>}
      {view === 'month' ? <div className="calendar-grid calendar-month">{dayShort.map((day) => <div key={day} className="calendar-weekday">{day}</div>)}{visibleDays.map((day) => <div role="button" tabIndex={0} key={keyFor(day)} onClick={() => openPlanner(day)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') openPlanner(day); }} className={`calendar-cell${day.getMonth() !== cursor.getMonth() ? ' outside' : ''}${keyFor(day) === keyFor(new Date()) ? ' today' : ''}`}><div className="calendar-date">{day.getDate()}</div><div className="calendar-events">{itemsFor(day).map((item) => item.href ? <a key={item.id} href={item.href} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()} className={`calendar-event ${item.kind}`}><strong>{item.title}</strong><span>{formatTime(item.startsAt)}</span></a> : <div key={item.id} className={`calendar-event ${item.kind}`}><strong>{item.title}</strong><span>{formatTime(item.startsAt)}</span></div>)}</div></div>)}</div> : <div className={`calendar-time-grid${view === 'day' ? ' single-day' : ''}`}><div className="calendar-time-head calendar-time-label">Time</div>{visibleDays.map((day) => <div key={keyFor(day)} className={`calendar-time-head${keyFor(day) === keyFor(new Date()) ? ' today' : ''}`}><strong>{dayShort[day.getDay()]}</strong><span>{day.getDate()}</span></div>)}{timeSlots.map((slot) => <div className="calendar-time-row" key={slot}><div className="calendar-time-label">{new Date(2000, 0, 1, Math.floor(slot / 60), slot % 60).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</div>{visibleDays.map((day) => <button type="button" key={`${keyFor(day)}-${slot}`} className="calendar-time-slot" onClick={() => openPlanner(day, Math.floor(slot / 60), slot % 60)}>{itemsForSlot(day, slot).map((item) => <span key={item.id} className={`calendar-task-chip calendar-event-chip ${item.kind}`}><strong>{item.title}</strong><small>{formatTime(item.startsAt)} · {item.kind === 'google' ? 'Google Calendar' : item.kind === 'reservation' ? 'Reservation' : 'Planning'}</small></span>)}{tasksForSlot(day, slot).map((task) => <span key={task.id} className={`calendar-task-chip priority-${task.priority} status-${task.status}`} onClick={(event) => { event.stopPropagation(); void changeTaskStatus(task); }} title="Click to advance status"><strong>{task.title}</strong><small>{formatTime(task.startsAt)} · {task.status.replace('_', ' ')}</small><i onClick={(event) => { event.stopPropagation(); void deleteTask(task.id); }} aria-label={`Delete ${task.title}`}>×</i></span>)}</button>)}</div>)}</div>}
      <div className="calendar-legend"><span><i className="legend-dot google" />Google Calendar</span><span><i className="legend-dot reservation" />Portfolio reservation</span><span><i className="legend-dot planning" />Planning block</span><span>Click a planning block to advance planned → in progress → done</span></div>
    </section>

    {showPlanner && <div className="planner-modal-backdrop" role="presentation" onMouseDown={() => setShowPlanner(false)}><section className="admin-card planner-modal" role="dialog" aria-modal="true" aria-labelledby="planner-modal-title" onMouseDown={(event) => event.stopPropagation()}><div className="admin-section-heading"><div><p className="planner-modal-kicker">Hourly planning</p><span id="planner-modal-title">Plan this time</span><small>{new Date(taskForm.startsAt).toLocaleString([], { weekday: 'long', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</small></div><button type="button" className="admin-button-secondary" onClick={() => setShowPlanner(false)}>Close</button></div><form onSubmit={createTask} className="planner-form">
          <label className="planner-field planner-field-wide"><span>What will you focus on?</span><input className="fld" required autoFocus placeholder="e.g. Draft the case study" value={taskForm.title} onChange={(event) => setTaskForm({ ...taskForm, title: event.target.value })} /></label>
          <div className="planner-form-row">
            <label className="planner-field"><span>Starts</span><input className="fld" required type="datetime-local" value={taskForm.startsAt} onChange={(event) => setTaskForm({ ...taskForm, startsAt: event.target.value })} /></label>
            <label className="planner-field"><span>Ends</span><input className="fld" required type="datetime-local" value={taskForm.endsAt} onChange={(event) => setTaskForm({ ...taskForm, endsAt: event.target.value })} /></label>
            <label className="planner-field"><span>Priority</span><select className="fld" value={taskForm.priority} onChange={(event) => setTaskForm({ ...taskForm, priority: event.target.value })}><option value="low">Low priority</option><option value="normal">Normal priority</option><option value="high">High priority</option></select></label>
          </div>
          <label className="planner-field planner-field-wide"><span>Notes <em>optional</em></span><textarea className="fld" rows={3} placeholder="Add an outcome, reminder, or next step" value={taskForm.notes} onChange={(event) => setTaskForm({ ...taskForm, notes: event.target.value })} /></label>
          <div className="planner-modal-actions"><button type="button" className="admin-button-secondary" onClick={() => setShowPlanner(false)}>Cancel</button><button className="admin-button">Save time block</button></div>
        </form></section></div>}

    <section className="admin-card p-5 sm:p-6"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="admin-eyebrow">Planning focus</p><h2 className="text-xl font-semibold">{periodLabel(cursor, activePeriod)}</h2><p className="mt-1 text-sm text-[color:var(--admin-muted)]">Give this {activePeriod} a title and a measurable target.</p></div><div className="planning-progress"><strong>{Math.floor(progressMinutes / 60)}h {progressMinutes % 60}m</strong><span>planned{activePlan?.targetMinutes ? ` of ${Math.floor(activePlan.targetMinutes / 60)}h ${activePlan.targetMinutes % 60}m` : ''}</span></div></div><form onSubmit={savePlan} className="mt-5 grid gap-3 md:grid-cols-[1.3fr_1fr_1fr_auto]"><input className="fld" required placeholder={activePeriod === 'week' ? 'Week title, e.g. Ship portfolio v2' : 'Month title, e.g. Build momentum'} value={planForm.title} onChange={(event) => setPlanForm({ ...planForm, title: event.target.value })} /><input className="fld" required type="number" min="0" max="10080" step="30" placeholder="Target minutes" value={planForm.targetMinutes} onChange={(event) => setPlanForm({ ...planForm, targetMinutes: event.target.value })} /><input className="fld" placeholder="Target label, e.g. 3 focused outcomes" value={planForm.targetLabel} onChange={(event) => setPlanForm({ ...planForm, targetLabel: event.target.value })} /><button className="admin-button">Save {activePeriod} plan</button><textarea className="fld md:col-span-4" rows={2} placeholder="Describe the outcome that makes this period successful" value={planForm.notes} onChange={(event) => setPlanForm({ ...planForm, notes: event.target.value })} /></form>{activePlan?.targetLabel && <p className="mt-3 text-sm text-[color:var(--admin-muted)]"><strong>Target:</strong> {activePlan.targetLabel}</p>}</section>

    <div className="grid gap-6 lg:grid-cols-2"><section className="admin-card p-5 sm:p-6"><div className="admin-section-heading">Meeting types</div>{data.types.length ? <div className="mb-5 grid gap-2">{data.types.map((type) => <div key={type.id} className="admin-list-item flex items-center justify-between"><span>{type.name}</span><span className="text-xs text-[color:var(--admin-muted)]">{type.durationMinutes} min</span></div>)}</div> : <p className="mb-5 text-sm text-[color:var(--admin-muted)]">Create the first meeting type.</p>}<form onSubmit={createType} className="grid gap-3"><input className="fld" required placeholder="Name, e.g. Discovery call" value={typeForm.name} onChange={(event) => setTypeForm({ ...typeForm, name: event.target.value, slug: event.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-') })} /><input className="fld" required placeholder="Slug" value={typeForm.slug} onChange={(event) => setTypeForm({ ...typeForm, slug: event.target.value })} /><input className="fld" required type="number" min="15" max="240" placeholder="Duration in minutes" value={typeForm.durationMinutes} onChange={(event) => setTypeForm({ ...typeForm, durationMinutes: event.target.value })} /><textarea className="fld" rows={2} placeholder="Short description" value={typeForm.description} onChange={(event) => setTypeForm({ ...typeForm, description: event.target.value })} /><button className="admin-button w-fit">Add meeting type</button></form></section>
    <section className="admin-card p-5 sm:p-6"><div className="admin-section-heading">Weekly availability</div>{data.availability.length ? <div className="mb-5 grid gap-2">{data.availability.map((row) => <div key={row.id} className="admin-list-item flex items-center justify-between"><span>{days[row.weekday]}</span><span className="text-xs text-[color:var(--admin-muted)]">{Math.floor(row.startMinute / 60).toString().padStart(2, '0')}:{(row.startMinute % 60).toString().padStart(2, '0')} – {Math.floor(row.endMinute / 60).toString().padStart(2, '0')}:{(row.endMinute % 60).toString().padStart(2, '0')}</span></div>)}</div> : <p className="mb-5 text-sm text-[color:var(--admin-muted)]">Add the hours when visitors can request meetings.</p>}<form onSubmit={createHours} className="grid gap-3"><select className="fld" value={hoursForm.weekday} onChange={(event) => setHoursForm({ ...hoursForm, weekday: event.target.value })}>{days.map((day, index) => <option key={day} value={index}>{day}</option>)}</select><div className="grid grid-cols-2 gap-3"><input className="fld" type="time" required value={hoursForm.start} onChange={(event) => setHoursForm({ ...hoursForm, start: event.target.value })} /><input className="fld" type="time" required value={hoursForm.end} onChange={(event) => setHoursForm({ ...hoursForm, end: event.target.value })} /></div><input className="fld" required value={hoursForm.timezone} onChange={(event) => setHoursForm({ ...hoursForm, timezone: event.target.value })} /><button className="admin-button w-fit">Add availability window</button></form></section></div>

    <section><div className="admin-section-heading">Upcoming reservations</div>{data.appointments.length ? <div className="admin-list">{data.appointments.map((appointment) => <div key={appointment.id} className="admin-list-item flex flex-wrap items-center justify-between gap-3"><div><strong>{appointment.attendeeName}</strong><p className="text-sm text-[color:var(--admin-muted)]">{appointment.attendeeEmail} · {new Date(appointment.startsAt).toLocaleString()}</p></div><span className="chip on">{appointment.status}</span></div>)}</div> : <div className="admin-card p-5 text-sm text-[color:var(--admin-muted)]">No upcoming reservations.</div>}</section>
  </div>;
}
