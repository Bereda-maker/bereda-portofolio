'use client';

import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import AIPlanStudio from './AIPlanStudio';
import PlanAnalytics from './PlanAnalytics';

type Data = { calendar: { connected: boolean; accountLabel?: string | null; calendarId?: string | null }; types: Array<{ id: number; name: string; slug: string; durationMinutes: number; isActive: boolean }>; availability: Array<{ id: number; weekday: number; startMinute: number; endMinute: number; timezone: string }>; appointments: Array<{ id: number; attendeeName: string; attendeeEmail: string; startsAt: string; endsAt: string; timezone: string; status: string; notes: string | null; providerEventId: string | null }> };
type CalendarEvent = { id: string; summary: string; description: string | null; htmlLink: string | null; meetingUrl: string | null; startsAt: string | null; endsAt: string | null };
type PlanningTask = { id: number; title: string; startsAt: string; endsAt: string; status: 'planned' | 'confirmed' | 'in_progress' | 'done' | 'cancelled'; priority: 'low' | 'normal' | 'high'; notes: string | null };
type PlanningPlan = { id: number; period: 'week' | 'month'; periodStart: string; title: string; targetMinutes: number; targetLabel: string | null; notes: string | null };
type View = 'month' | 'week' | 'day';
type CalendarItem = { id: string; title: string; startsAt: string; endsAt: string; kind: 'google' | 'reservation' | 'planning'; href?: string | null; task?: PlanningTask };

const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const dayShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const timeSlots = Array.from({ length: 24 }, (_, index) => index * 60);
// Phones get the one-day-at-a-time calendar. Keep in sync with the 700px rules in appointments.css.
const MOBILE_QUERY = '(max-width: 700px)';
const EARLIEST_VISIBLE_HOUR = 7; // where an empty day's timeline opens, instead of midnight
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
function localNoonIso(date: Date) { const result = new Date(date); result.setHours(12, 0, 0, 0); return result.toISOString(); }
function hourSlot(value: string) { const date = new Date(value); return date.getHours() * 60; }
function periodLabel(date: Date, period: 'week' | 'month') { return period === 'week' ? `Week of ${periodStartFor(date, period).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}` : periodStartFor(date, period).toLocaleDateString([], { month: 'long', year: 'numeric' }); }

export default function AppointmentsPanel({ initialCalendarMessage = '' }: { initialCalendarMessage?: string }) {
  const [data, setData] = useState<Data | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [tasks, setTasks] = useState<PlanningTask[]>([]);
  const [plans, setPlans] = useState<PlanningPlan[]>([]);
  const [error, setError] = useState(initialCalendarMessage);
  const [view, setView] = useState<View>('week');
  const [cursor, setCursor] = useState(() => new Date());
  const [mobileFocusDate, setMobileFocusDate] = useState(() => new Date());
  const [isMobile, setIsMobile] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [showPlanner, setShowPlanner] = useState(false);
  const [typeForm, setTypeForm] = useState({ name: '', slug: '', durationMinutes: '30', description: '' });
  const [hoursForm, setHoursForm] = useState({ weekday: '1', start: '09:00', end: '17:00', timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC' });
  const [taskForm, setTaskForm] = useState({ title: '', startsAt: localDateTime(new Date(), 9), endsAt: localDateTime(new Date(), 10), priority: 'normal', notes: '' });
  const [planForm, setPlanForm] = useState({ title: '', targetMinutes: '600', targetLabel: '', notes: '' });
  const [selectedAppointment, setSelectedAppointment] = useState<Data['appointments'][number] | null>(null);
  const shellRef = useRef<HTMLElement>(null);
  const scrollMemo = useRef({ key: '', refined: false });

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
  useEffect(() => {
    setCursor(new Date());
    setMobileFocusDate(new Date());
    const mobileQuery = window.matchMedia(MOBILE_QUERY);
    const syncMobile = () => setIsMobile(mobileQuery.matches);
    syncMobile();
    if (mobileQuery.matches) setView('day');
    mobileQuery.addEventListener('change', syncMobile);
    setHydrated(true);
    return () => mobileQuery.removeEventListener('change', syncMobile);
  }, []);
  useEffect(() => { load().catch(() => setError('Could not load appointment settings.')); }, []);
  useEffect(() => {
    if (!showPlanner && !selectedAppointment) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') { setShowPlanner(false); setSelectedAppointment(null); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showPlanner, selectedAppointment]);
  useEffect(() => { if (data) loadPlanning().catch(() => setError('Could not refresh planning blocks.')); }, [cursor, view]);
  useEffect(() => { setMobileFocusDate(cursor); }, [cursor, view]);
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
  async function createTask(e: FormEvent) { e.preventDefault(); try { await post('/api/admin/calendar-plans', { kind: 'task', ...taskForm, startsAt: new Date(taskForm.startsAt).toISOString(), endsAt: new Date(taskForm.endsAt).toISOString() }); setTaskForm({ ...taskForm, title: '', notes: '' }); setShowPlanner(false); } catch (e) { setError(e instanceof Error ? e.message : 'Could not save planning block.'); } }
  async function savePlan(e: FormEvent) { e.preventDefault(); try { await post('/api/admin/calendar-plans', { kind: 'plan', period: activePeriod, periodStart: localNoonIso(periodStartFor(cursor, activePeriod)), ...planForm, targetMinutes: Number(planForm.targetMinutes) }); } catch (e) { setError(e instanceof Error ? e.message : 'Could not save planning target.'); } }
  async function deleteTask(id: number) { try { await request(`/api/admin/calendar-plans?id=${id}`, 'DELETE'); await loadPlanning(); } catch (e) { setError(e instanceof Error ? e.message : 'Could not delete planning block.'); } }
  async function changeTaskStatus(task: PlanningTask) { const next = task.status === 'planned' ? 'confirmed' : task.status === 'confirmed' ? 'done' : task.status === 'done' ? 'planned' : 'planned'; try { await request('/api/admin/calendar-plans', 'PATCH', { id: task.id, status: next }); await loadPlanning(); } catch (e) { setError(e instanceof Error ? e.message : 'Could not update planning block.'); } }

  const selectedCalendarEvent = selectedAppointment ? events.find((event) => event.id === selectedAppointment.providerEventId) : null;

  const items = useMemo<CalendarItem[]>(() => [
    ...events.filter((event): event is CalendarEvent & { startsAt: string; endsAt: string } => Boolean(event.startsAt && event.endsAt)).map((event) => ({ id: `google-${event.id}`, title: event.summary, startsAt: event.startsAt, endsAt: event.endsAt, kind: 'google' as const, href: event.htmlLink })),
    ...(data?.appointments || []).map((appointment) => ({ id: `reservation-${appointment.id}`, title: `${appointment.attendeeName} · reservation`, startsAt: appointment.startsAt, endsAt: appointment.endsAt, kind: 'reservation' as const })),
    ...tasks.map((task) => ({ id: `task-${task.id}`, title: task.title, startsAt: task.startsAt, endsAt: task.endsAt, kind: 'planning' as const, task })),
  ], [events, data?.appointments, tasks]);
  function itemsFor(day: Date) { const dayKey = keyFor(day); return items.filter((item) => keyFor(new Date(item.startsAt)) === dayKey); }
  function tasksForSlot(day: Date, slot: number) { return tasks.filter((task) => keyFor(new Date(task.startsAt)) === keyFor(day) && hourSlot(task.startsAt) === slot); }
  function itemsForSlot(day: Date, slot: number) { return items.filter((item) => item.kind !== 'planning' && keyFor(new Date(item.startsAt)) === keyFor(day) && hourSlot(item.startsAt) === slot); }
  function busyItemsForSlot(day: Date, slot: number) { const point = new Date(day); point.setHours(Math.floor(slot / 60), slot % 60, 0, 0); return items.filter((item) => new Date(item.startsAt) <= point && new Date(item.endsAt) > point); }
  function confirmedTasksForSlot(day: Date, slot: number) { const point = new Date(day); point.setHours(Math.floor(slot / 60), slot % 60, 0, 0); return tasks.filter((task) => ['confirmed', 'in_progress', 'done'].includes(task.status) && new Date(task.startsAt) <= point && new Date(task.endsAt) > point); }
  function move(amount: number) { const next = new Date(cursor); if (view === 'month') next.setMonth(next.getMonth() + amount); else if (view === 'week') next.setDate(next.getDate() + amount * 7); else next.setDate(next.getDate() + amount); setCursor(next); }
  function openPlanner(day: Date, hour = 9, minute = 0) { setTaskForm({ title: '', startsAt: localDateTime(day, hour, minute), endsAt: localDateTime(day, hour + 1, minute), priority: 'normal', notes: '' }); setShowPlanner(true); }
  const heading = view === 'month' ? cursor.toLocaleDateString([], { month: 'long', year: 'numeric' }) : view === 'week' ? `${visibleDays[0]?.toLocaleDateString([], { month: 'short', day: 'numeric' })} – ${visibleDays[6]?.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}` : cursor.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const progressMinutes = tasks.filter((task) => task.status !== 'cancelled' && new Date(task.startsAt) >= periodStartFor(cursor, activePeriod) && new Date(task.startsAt) < (activePeriod === 'week' ? addDays(periodStartFor(cursor, activePeriod), 7) : new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))).reduce((sum, task) => sum + minutesBetween(task.startsAt, task.endsAt), 0);
  const availabilityDays = view === 'day' ? [cursor] : Array.from({ length: 7 }, (_, index) => addDays(startOfWeek(cursor), index));
  const openAvailability = availabilityDays.flatMap((day) => timeSlots.filter((slot) => !busyItemsForSlot(day, slot).length && !confirmedTasksForSlot(day, slot).length).map((slot) => ({ day, slot })));

  // The time grid has 24 rows; opening at midnight buries the day under empty hours. Open one hour before
  // the first block in view (or at 7 AM when the range is empty), once per range, and refine once data arrives.
  useEffect(() => {
    if (!hydrated || !data) return;
    const grid = shellRef.current?.querySelector<HTMLElement>('.calendar-time-grid');
    if (!grid) return;
    const days = isMobile && view !== 'day' ? [mobileFocusDate] : visibleDays;
    const key = `${view}|${isMobile}|${days.map(keyFor).join(',')}`;
    const starts = days.flatMap((day) => itemsFor(day)).map((item) => new Date(item.startsAt).getHours());
    const memo = scrollMemo.current;
    if (memo.key === key && (memo.refined || !starts.length)) return;
    memo.key = key;
    memo.refined = starts.length > 0;
    const hour = starts.length ? Math.max(0, Math.min(...starts) - 1) : EARLIEST_VISIBLE_HOUR;
    const label = grid.querySelectorAll<HTMLElement>('.calendar-time-row > .calendar-time-label')[hour];
    const head = grid.querySelector<HTMLElement>('.calendar-time-head');
    if (label) grid.scrollTop = Math.max(0, label.offsetTop - (head?.offsetHeight ?? 0));
  }, [hydrated, data, view, isMobile, mobileFocusDate, visibleDays, items]);

  function renderMobileCalendar() {
    const periodDays = view === 'week' ? visibleDays : Array.from({ length: new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate() }, (_, index) => new Date(cursor.getFullYear(), cursor.getMonth(), index + 1));
    const focusDay = periodDays.find((day) => keyFor(day) === keyFor(mobileFocusDate)) || periodDays[0] || cursor;
    const leadingBlanks = view === 'month' ? new Date(cursor.getFullYear(), cursor.getMonth(), 1).getDay() : 0;
    const todayKey = keyFor(new Date());
    const focusItems = itemsFor(focusDay);
    return <div className={`mobile-period-calendar mobile-period-${view}`}>
      <div className="mobile-period-picker" role="group" aria-label={view === 'week' ? 'Choose a day this week' : 'Choose a day this month'}>
        {view === 'month' && dayShort.map((name) => <span key={name} className="mobile-period-weekday" aria-hidden="true">{name.slice(0, 2)}</span>)}
        {Array.from({ length: leadingBlanks }, (_, index) => <span key={`blank-${index}`} className="mobile-period-pad" aria-hidden="true" />)}
        {periodDays.map((day) => {
          const dayItems = itemsFor(day);
          const kinds = Array.from(new Set(dayItems.map((item) => item.kind)));
          const active = keyFor(day) === keyFor(focusDay);
          const label = `${day.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}${dayItems.length ? `, ${dayItems.length} item${dayItems.length === 1 ? '' : 's'}` : ''}`;
          return <button type="button" key={keyFor(day)} aria-label={label} aria-pressed={active} aria-current={keyFor(day) === todayKey ? 'date' : undefined} className={`mobile-period-day${active ? ' active' : ''}${keyFor(day) === todayKey ? ' today' : ''}`} onClick={() => setMobileFocusDate(day)}>
            {view === 'week' && <span className="mobile-period-dow">{dayShort[day.getDay()]}</span>}
            <strong>{day.getDate()}</strong>
            <span className="mobile-period-dots" aria-hidden="true">{kinds.map((kind) => <i key={kind} className={kind} />)}</span>
          </button>;
        })}
      </div>
      <div className="mobile-period-heading"><div><p className="admin-eyebrow">{view === 'week' ? 'Week schedule' : 'Month schedule'}</p><h3>{focusDay.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}</h3><span>{focusItems.length ? `${focusItems.length} scheduled item${focusItems.length === 1 ? '' : 's'}` : 'No events scheduled'}</span></div><button type="button" className="admin-button" onClick={() => openPlanner(focusDay)}><Plus size={16} aria-hidden="true" />Plan time</button></div>
      <div className="calendar-time-grid single-day mobile-period-timeline"><div className="calendar-time-head calendar-time-label">Time</div><div className={`calendar-time-head${keyFor(focusDay) === todayKey ? ' today' : ''}`}><strong>{dayShort[focusDay.getDay()]}</strong><span>{focusDay.getDate()}</span></div>{timeSlots.map((slot) => <div className="calendar-time-row" key={slot}><div className="calendar-time-label">{new Date(2000, 0, 1, Math.floor(slot / 60), slot % 60).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</div><button type="button" className="calendar-time-slot" aria-label={`Plan time at ${new Date(2000, 0, 1, Math.floor(slot / 60)).toLocaleTimeString([], { hour: 'numeric' })}`} onClick={() => openPlanner(focusDay, Math.floor(slot / 60), slot % 60)}>{itemsForSlot(focusDay, slot).map((item) => <span key={item.id} className={`calendar-task-chip calendar-event-chip ${item.kind}`}><strong>{item.title}</strong><small>{formatTime(item.startsAt)} · {item.kind === 'google' ? 'Google Calendar' : item.kind === 'reservation' ? 'Reservation' : 'Planning'}</small></span>)}{tasksForSlot(focusDay, slot).map((task) => <span key={task.id} className={`calendar-task-chip priority-${task.priority} status-${task.status}`} onClick={(event) => { event.stopPropagation(); void changeTaskStatus(task); }} title="Tap to advance status"><strong>{task.title}</strong><small>{formatTime(task.startsAt)} · {task.status.replace('_', ' ')}</small><i onClick={(event) => { event.stopPropagation(); void deleteTask(task.id); }} aria-label={`Delete ${task.title}`}>×</i></span>)}</button></div>)}</div>
    </div>;
  }

  if (!data || !hydrated) return <div className="admin-card p-6 text-sm text-[color:var(--admin-muted)]">Loading scheduling workspace…</div>;
  return <div className="appt-workspace">
    {error && <div className="admin-error" role="alert">{error}</div>}
    <section className="admin-card appt-connection p-5 sm:p-6"><div className="appt-connection-copy"><p className="admin-eyebrow">Calendar connection</p><h2 className="appt-connection-title">{data.calendar.connected ? `Connected · ${data.calendar.accountLabel || 'Google Calendar'}` : 'Google Calendar is not connected'}</h2><p className="appt-connection-sub">{data.calendar.connected ? `Calendar ID: ${data.calendar.calendarId}` : 'Connect the calendar used for free/busy checks, bookings, and Google Meet links.'}</p></div><div className="appt-connection-actions">{data.calendar.connected ? <button type="button" className="admin-button-secondary" onClick={async () => { await request('/api/calendar/google/disconnect', 'POST'); await load(); }}>Disconnect</button> : <a className="admin-button" href="/api/calendar/google/connect">Connect Google Calendar</a>}</div></section>

    <section ref={shellRef} className="admin-card calendar-shell">
      <div className="calendar-toolbar"><div className="calendar-title"><p className="admin-eyebrow">Schedule / Calendar</p><h2 className="calendar-heading">{heading}</h2><p className="calendar-meta">{tasks.length} planned block{tasks.length === 1 ? '' : 's'} in view · 24-hour day · 1-hour slots</p></div><div className="calendar-controls"><div className="calendar-nav" role="group" aria-label="Change period"><button type="button" className="admin-button-secondary calendar-today" onClick={() => setCursor(new Date())}>Today</button><button type="button" className="calendar-icon-button" aria-label="Previous period" onClick={() => move(-1)}><ChevronLeft size={18} aria-hidden="true" /></button><button type="button" className="calendar-icon-button" aria-label="Next period" onClick={() => move(1)}><ChevronRight size={18} aria-hidden="true" /></button></div><div className="calendar-view-switcher" role="group" aria-label="Calendar view">{(['month', 'week', 'day'] as View[]).map((option) => <button type="button" key={option} aria-pressed={view === option} className={view === option ? 'active' : ''} onClick={() => setView(option)}>{option}</button>)}</div><button type="button" className="admin-button calendar-plan-btn" onClick={() => openPlanner(cursor)}><Plus size={16} aria-hidden="true" />Plan time</button></div></div>{activePlan && <div className="calendar-plan-banner"><span className="calendar-plan-kicker">{activePeriod} plan</span><strong>{activePlan.title}</strong><span>{activePlan.targetMinutes ? `${Math.floor(activePlan.targetMinutes / 60)}h ${activePlan.targetMinutes % 60}m target` : 'No time target set'}{activePlan.targetLabel ? ` · ${activePlan.targetLabel}` : ''}</span></div>}
      {isMobile && view !== 'day' ? renderMobileCalendar() : view === 'month' ? <div className="calendar-grid calendar-month">{dayShort.map((day) => <div key={day} className="calendar-weekday">{day}</div>)}{visibleDays.map((day) => <div role="button" tabIndex={0} key={keyFor(day)} onClick={() => openPlanner(day)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') openPlanner(day); }} className={`calendar-cell${day.getMonth() !== cursor.getMonth() ? ' outside' : ''}${keyFor(day) === keyFor(new Date()) ? ' today' : ''}`}><div className="calendar-date">{day.getDate()}</div><div className="calendar-events">{itemsFor(day).map((item) => item.href ? <a key={item.id} href={item.href} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()} className={`calendar-event ${item.kind}`}><strong>{item.title}</strong><span>{formatTime(item.startsAt)}</span></a> : <div key={item.id} className={`calendar-event ${item.kind}`}><strong>{item.title}</strong><span>{formatTime(item.startsAt)}</span></div>)}</div></div>)}</div> : <div className={`calendar-time-grid${view === 'day' ? ' single-day' : ''}`}><div className="calendar-time-head calendar-time-label">Time</div>{visibleDays.map((day) => <div key={keyFor(day)} className={`calendar-time-head${keyFor(day) === keyFor(new Date()) ? ' today' : ''}`}><strong>{dayShort[day.getDay()]}</strong><span>{day.getDate()}</span></div>)}{timeSlots.map((slot) => <div className="calendar-time-row" key={slot}><div className="calendar-time-label">{new Date(2000, 0, 1, Math.floor(slot / 60), slot % 60).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</div>{visibleDays.map((day) => <button type="button" key={`${keyFor(day)}-${slot}`} className="calendar-time-slot" aria-label={`Plan time ${day.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })} at ${new Date(2000, 0, 1, Math.floor(slot / 60)).toLocaleTimeString([], { hour: 'numeric' })}`} onClick={() => openPlanner(day, Math.floor(slot / 60), slot % 60)}>{itemsForSlot(day, slot).map((item) => <span key={item.id} className={`calendar-task-chip calendar-event-chip ${item.kind}`}><strong>{item.title}</strong><small>{formatTime(item.startsAt)} · {item.kind === 'google' ? 'Google Calendar' : item.kind === 'reservation' ? 'Reservation' : 'Planning'}</small></span>)}{tasksForSlot(day, slot).map((task) => <span key={task.id} className={`calendar-task-chip priority-${task.priority} status-${task.status}`} onClick={(event) => { event.stopPropagation(); void changeTaskStatus(task); }} title="Click to advance status"><strong>{task.title}</strong><small>{formatTime(task.startsAt)} · {task.status.replace('_', ' ')}</small><i onClick={(event) => { event.stopPropagation(); void deleteTask(task.id); }} aria-label={`Delete ${task.title}`}>×</i></span>)}</button>)}</div>)}</div>}
      <div className="calendar-legend"><span><i className="legend-dot google" />Google Calendar</span><span><i className="legend-dot reservation" />Portfolio reservation</span><span><i className="legend-dot planning" />Planning block</span><span>Click a planning block to advance planned → in progress → done</span></div>
    </section>

    <PlanAnalytics tasks={tasks} cursor={cursor} />

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

    <section className="admin-card plan-focus p-5 sm:p-6"><div className="plan-focus-head"><div><p className="admin-eyebrow">Planning focus</p><h2 className="text-xl font-semibold">{periodLabel(cursor, activePeriod)}</h2><p className="mt-1 text-sm text-[color:var(--admin-muted)]">Give this {activePeriod} a title and a measurable target.</p></div><div className="planning-progress"><strong>{Math.floor(progressMinutes / 60)}h {progressMinutes % 60}m</strong><span>planned{activePlan?.targetMinutes ? ` of ${Math.floor(activePlan.targetMinutes / 60)}h ${activePlan.targetMinutes % 60}m` : ''}</span></div></div><div className="ai-plan-studio-grid"><AIPlanStudio period="day" anchorDate={keyFor(cursor)} existingTasks={tasks} onSaved={() => void loadPlanning()} /><AIPlanStudio period="week" anchorDate={keyFor(periodStartFor(cursor, 'week'))} existingTasks={tasks} onSaved={() => void loadPlanning()} /></div><form onSubmit={savePlan} className="plan-target-form">
          <label className="planner-field"><span>{activePeriod === 'week' ? 'Week title' : 'Month title'}</span><input className="fld" required placeholder={activePeriod === 'week' ? 'e.g. Ship portfolio v2' : 'e.g. Build momentum'} value={planForm.title} onChange={(event) => setPlanForm({ ...planForm, title: event.target.value })} /></label>
          <label className="planner-field"><span>Target minutes</span><input className="fld" required type="number" inputMode="numeric" min="0" max="10080" step="30" placeholder="600" value={planForm.targetMinutes} onChange={(event) => setPlanForm({ ...planForm, targetMinutes: event.target.value })} /></label>
          <label className="planner-field"><span>Target label <em>optional</em></span><input className="fld" placeholder="e.g. 3 focused outcomes" value={planForm.targetLabel} onChange={(event) => setPlanForm({ ...planForm, targetLabel: event.target.value })} /></label>
          <label className="planner-field plan-target-notes"><span>Success looks like <em>optional</em></span><textarea className="fld" rows={2} placeholder="Describe the outcome that makes this period successful" value={planForm.notes} onChange={(event) => setPlanForm({ ...planForm, notes: event.target.value })} /></label>
          <button className="admin-button plan-target-save">Save {activePeriod} plan</button>
        </form>{activePlan?.targetLabel && <p className="mt-3 text-sm text-[color:var(--admin-muted)]"><strong>Target:</strong> {activePlan.targetLabel}</p>}</section>

    <section className="admin-card availability-card p-5 sm:p-6"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="admin-eyebrow">Availability</p><h2 className="text-xl font-semibold">Open availability</h2><p className="mt-1 text-sm text-[color:var(--admin-muted)]">{view === 'day' ? 'Open hours for this day.' : 'Open hours grouped across this week.'} Confirmed plans and reservations are excluded.</p></div><span className="chip on">{openAvailability.length} open hour{openAvailability.length === 1 ? '' : 's'}</span></div><div className={`open-availability-board${view === 'day' ? ' is-day' : ''}`}>{availabilityDays.map((day) => { const slots = openAvailability.filter(({ day: slotDay }) => keyFor(slotDay) === keyFor(day)); return <div className="open-availability-day" key={keyFor(day)}><div className="open-availability-day-heading"><strong>{day.toLocaleDateString([], { weekday: 'short' })}</strong><span>{day.toLocaleDateString([], { month: 'short', day: 'numeric' })}</span></div><div className="open-availability-chips">{slots.map(({ slot }) => <button type="button" className="open-availability-chip" key={`${keyFor(day)}-${slot}`} onClick={() => openPlanner(day, Math.floor(slot / 60), slot % 60)}>{new Date(2000, 0, 1, Math.floor(slot / 60)).toLocaleTimeString([], { hour: 'numeric' })}</button>)}{!slots.length && <span className="open-availability-none">No open hours</span>}</div></div>; })}</div></section>

    <section className="reservations"><div className="admin-section-heading">Upcoming reservations</div>{data.appointments.length ? <div className="admin-list reservation-list">{data.appointments.map((appointment) => <div key={appointment.id} className="admin-list-item flex flex-wrap items-center justify-between gap-3"><div className="min-w-0"><strong className="break-words">{appointment.attendeeName}</strong><p className="reservation-meta">{appointment.attendeeEmail} · {new Date(appointment.startsAt).toLocaleString()}</p></div><div className="reservation-row-actions"><span className="chip on">{appointment.status}</span><button type="button" className="admin-button-secondary reservation-details-button" onClick={() => setSelectedAppointment(appointment)}>View details</button></div></div>)}</div> : <div className="admin-card p-5 text-sm text-[color:var(--admin-muted)]">No upcoming reservations.</div>}</section>
    {selectedAppointment && <div className="reservation-details-backdrop" role="presentation" onMouseDown={() => setSelectedAppointment(null)}><section className="admin-card reservation-details-modal" role="dialog" aria-modal="true" aria-labelledby="reservation-details-title" onMouseDown={(event) => event.stopPropagation()}><div className="admin-section-heading"><div><p className="admin-eyebrow">Upcoming reservation</p><span id="reservation-details-title">Client details</span></div><button type="button" className="admin-button-secondary" onClick={() => setSelectedAppointment(null)}>Close</button></div><dl className="reservation-details-grid"><div><dt>Client</dt><dd>{selectedAppointment.attendeeName}</dd></div><div><dt>Email</dt><dd><a href={`mailto:${selectedAppointment.attendeeEmail}`}>{selectedAppointment.attendeeEmail}</a></dd></div><div><dt>Date and time</dt><dd>{new Date(selectedAppointment.startsAt).toLocaleString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</dd></div><div><dt>End time</dt><dd>{new Date(selectedAppointment.endsAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</dd></div><div><dt>Timezone</dt><dd>{selectedAppointment.timezone || 'UTC'}</dd></div><div><dt>Status</dt><dd><span className="chip on">{selectedAppointment.status}</span></dd></div><div className="reservation-details-notes"><dt>Meeting links</dt><dd className="reservation-details-links">{selectedCalendarEvent?.meetingUrl && <a className="admin-button" href={selectedCalendarEvent.meetingUrl} target="_blank" rel="noreferrer">Join meeting</a>}{selectedCalendarEvent?.htmlLink && <a className="admin-button-secondary" href={selectedCalendarEvent.htmlLink} target="_blank" rel="noreferrer">Open calendar event</a>}{!selectedCalendarEvent?.meetingUrl && !selectedCalendarEvent?.htmlLink && <span>No meeting link is available yet.</span>}</dd></div><div className="reservation-details-notes"><dt>Notes</dt><dd>{selectedAppointment.notes || 'No notes provided.'}</dd></div></dl></section></div>}
  </div>;
}
