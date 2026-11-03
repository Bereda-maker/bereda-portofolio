'use client';

import { useMemo } from 'react';

type Task = { startsAt: string; endsAt: string; status: string };
type Props = { tasks: Task[]; cursor: Date };
type Range = { label: string; start: Date; end: Date };

function startOfDay(date: Date) { const result = new Date(date); result.setHours(0, 0, 0, 0); return result; }
function startOfWeek(date: Date) { const result = startOfDay(date); result.setDate(result.getDate() - result.getDay()); return result; }
function addDays(date: Date, amount: number) { const result = new Date(date); result.setDate(result.getDate() + amount); return result; }
function durationMinutes(task: Task) { return Math.max(0, Math.round((new Date(task.endsAt).getTime() - new Date(task.startsAt).getTime()) / 60000)); }
function hours(minutes: number) { return `${Math.floor(minutes / 60)}h ${minutes % 60}m`; }

export default function PlanAnalytics({ tasks, cursor }: Props) {
  const ranges = useMemo<Range[]>(() => {
    const day = startOfDay(cursor);
    const week = startOfWeek(cursor);
    const month = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    return [
      { label: 'Today', start: day, end: addDays(day, 1) },
      { label: 'This week', start: week, end: addDays(week, 7) },
      { label: 'This month', start: month, end: new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1) },
    ];
  }, [cursor]);

  return <section className="plan-analytics"><div className="plan-analytics-heading"><div><p className="admin-eyebrow">Execution report</p><h2 className="text-xl font-semibold">How your plan is going</h2><p className="mt-1 text-sm text-[color:var(--admin-muted)]">Success is based on planned block time marked Done.</p></div></div><div className="plan-analytics-grid">{ranges.map((range) => {
    const scoped = tasks.filter((task) => { const start = new Date(task.startsAt); return start >= range.start && start < range.end && task.status !== 'cancelled'; });
    const plannedMinutes = scoped.reduce((sum, task) => sum + durationMinutes(task), 0);
    const doneMinutes = scoped.filter((task) => task.status === 'done').reduce((sum, task) => sum + durationMinutes(task), 0);
    const percentage = plannedMinutes ? Math.min(100, Math.round((doneMinutes / plannedMinutes) * 100)) : 0;
    const doneCount = scoped.filter((task) => task.status === 'done').length;
    const analysis = !scoped.length ? 'No planned blocks yet.' : percentage >= 80 ? 'Strong execution. Protect this rhythm.' : percentage >= 50 ? 'Good progress. Finish the highest-value block next.' : 'Start small: complete one focused block before adding more.';
    return <article className="plan-analytics-card" key={range.label}><div className="plan-ring" style={{ '--progress': `${percentage}%` } as React.CSSProperties}><div><strong>{percentage}%</strong><span>done</span></div></div><div className="plan-analytics-copy"><span className="plan-analytics-label">{range.label}</span><strong>{hours(doneMinutes)} <small>of {hours(plannedMinutes)}</small></strong><p>{doneCount} of {scoped.length} block{scoped.length === 1 ? '' : 's'} complete</p><em>{analysis}</em></div></article>;
  })}</div></section>;
}
