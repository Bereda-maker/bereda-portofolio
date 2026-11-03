'use client';

import { useState } from 'react';

type ExistingTask = { title: string; startsAt: string; endsAt: string; status: string };
type DraftBlock = { dayOffset: number; startHour: number; durationHours: number; title: string; priority: 'low' | 'normal' | 'high'; rationale: string };
type Draft = { title: string; summary: string; blocks: DraftBlock[] };

type Props = {
  period: 'day' | 'week';
  anchorDate: string;
  existingTasks: ExistingTask[];
  onSaved: () => void;
};

function displayHour(hour: number) { return new Date(2000, 0, 1, hour).toLocaleTimeString([], { hour: 'numeric' }); }
function localIso(anchorDate: string, offset: number, hour: number) {
  const date = new Date(`${anchorDate}T00:00:00`);
  date.setDate(date.getDate() + offset + Math.floor(hour / 24));
  date.setHours(hour % 24, 0, 0, 0);
  return date.toISOString();
}

export default function AIPlanStudio({ period, anchorDate, existingTasks, onSaved }: Props) {
  const [open, setOpen] = useState(false);
  const [intakeOpen, setIntakeOpen] = useState(false);
  const [feelings, setFeelings] = useState('');
  const [classes, setClasses] = useState('');
  const [workMood, setWorkMood] = useState('');
  const [mustDo, setMustDo] = useState('');
  const [draft, setDraft] = useState<Draft | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function generate() {
    setLoading(true); setError('');
    try {
      const response = await fetch('/api/admin/ai-plan', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ period, startDate: anchorDate, existingTasks, preferences: `How I feel: ${feelings || 'Not specified'}\nClasses or fixed commitments: ${classes || 'None provided'}\nMy work energy/mood: ${workMood || 'Not specified'}\nMust-do outcomes: ${mustDo || 'None specified'}` }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not generate an AI plan.');
      setDraft(result); setIntakeOpen(false); setOpen(true);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not generate an AI plan.'); }
    finally { setLoading(false); }
  }

  async function confirmPlan() {
    if (!draft) return;
    setSaving(true); setError('');
    try {
      for (const block of draft.blocks) {
        await fetch('/api/admin/calendar-plans', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ kind: 'task', title: block.title, startsAt: localIso(anchorDate, block.dayOffset, block.startHour), endsAt: localIso(anchorDate, block.dayOffset, block.startHour + block.durationHours), priority: block.priority, status: 'confirmed', notes: `AI rationale: ${block.rationale}` }) }).then(async (response) => { if (!response.ok) throw new Error((await response.json()).error || 'Could not save an AI block.'); });
      }
      setOpen(false); setDraft(null); onSaved();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not save the AI plan.'); }
    finally { setSaving(false); }
  }

  function updateBlock(index: number, patch: Partial<DraftBlock>) { setDraft((current) => current ? { ...current, blocks: current.blocks.map((block, blockIndex) => blockIndex === index ? { ...block, ...patch } : block) } : current); }
  function removeBlock(index: number) { setDraft((current) => current ? { ...current, blocks: current.blocks.filter((_, blockIndex) => blockIndex !== index) } : current); }

  return <>
    <div className="ai-plan-actions">
      <div><p className="ai-plan-kicker">AI planning studio</p><strong>Build a plan that fits how you work</strong><span>Generate a draft, edit every block, then confirm it.</span></div>
      <div className="ai-plan-buttons"><button type="button" className="admin-button-secondary" onClick={() => setIntakeOpen(true)} disabled={loading}>{loading ? 'Thinking…' : `Plan my ${period}`}</button></div>
    </div>
    {error && <p className="ai-plan-error" role="alert">{error}</p>}
    {intakeOpen && <div className="planner-modal-backdrop" role="presentation" onMouseDown={() => !loading && setIntakeOpen(false)}><section className="admin-card ai-checkin-modal" role="dialog" aria-modal="true" aria-labelledby="ai-checkin-title" onMouseDown={(event) => event.stopPropagation()}>
      <div className="ai-plan-modal-head"><div><p className="planner-modal-kicker">A quick check-in before we plan</p><h3 id="ai-checkin-title">How are you arriving today?</h3><p>I’ll use your answers to make a plan that works with your real energy, classes, and priorities.</p></div><button type="button" className="admin-button-secondary" onClick={() => setIntakeOpen(false)}>Close</button></div>
      <form className="ai-checkin-form" onSubmit={(event) => { event.preventDefault(); void generate(); }}>
        <label><span>How are you feeling?</span><textarea className="fld" rows={2} placeholder="Tired, excited, overwhelmed, focused…" value={feelings} onChange={(event) => setFeelings(event.target.value)} /></label>
        <label><span>Do you have classes or fixed commitments?</span><textarea className="fld" rows={2} placeholder="Class at 10 AM, commute, family time, appointment…" value={classes} onChange={(event) => setClasses(event.target.value)} /></label>
        <label><span>What kind of work mood or energy do you have?</span><textarea className="fld" rows={2} placeholder="Deep-focus mood, low energy, creative, only small tasks…" value={workMood} onChange={(event) => setWorkMood(event.target.value)} /></label>
        <label><span>What must feel accomplished?</span><textarea className="fld" rows={2} placeholder="The one outcome that would make this day or week meaningful…" value={mustDo} onChange={(event) => setMustDo(event.target.value)} /></label>
        <div className="ai-plan-modal-actions"><button type="button" className="admin-button-secondary" onClick={() => setIntakeOpen(false)}>Not now</button><button className="admin-button" disabled={loading}>{loading ? 'Listening…' : `Create my ${period} plan`}</button></div>
      </form>
    </section></div>}
    {open && draft && <div className="planner-modal-backdrop" role="presentation" onMouseDown={() => !saving && setOpen(false)}><section className="admin-card ai-plan-modal" role="dialog" aria-modal="true" aria-labelledby="ai-plan-title" onMouseDown={(event) => event.stopPropagation()}>
      <div className="ai-plan-modal-head"><div><p className="planner-modal-kicker">AI draft · editable before confirmation</p><h3 id="ai-plan-title">{draft.title}</h3><p>{draft.summary}</p></div><button type="button" className="admin-button-secondary" onClick={() => setOpen(false)} disabled={saving}>Close</button></div>
      <div className="ai-plan-draft-meta"><span>{draft.blocks.length} blocks</span><span>{period === 'day' ? '24-hour day' : '7-day week'}</span><span className="ai-status-pill">Draft</span></div>
      <div className="ai-plan-blocks">{draft.blocks.map((block, index) => <article className="ai-plan-block" key={`${block.dayOffset}-${block.startHour}-${index}`}><div className="ai-plan-block-index">{String(index + 1).padStart(2, '0')}</div><div className="ai-plan-block-fields"><div className="ai-plan-block-top"><input className="fld" value={block.title} onChange={(event) => updateBlock(index, { title: event.target.value })} aria-label={`Block ${index + 1} title`} /><button type="button" className="ai-remove-block" onClick={() => removeBlock(index)} aria-label={`Remove ${block.title}`}>Remove</button></div><div className="ai-plan-inline-fields"><label>Day<input className="fld" type="number" min="0" max={period === 'day' ? 0 : 6} value={block.dayOffset} onChange={(event) => updateBlock(index, { dayOffset: Number(event.target.value) })} /></label><label>Start<input className="fld" type="number" min="0" max="23" value={block.startHour} onChange={(event) => updateBlock(index, { startHour: Number(event.target.value) })} /></label><label>Hours<input className="fld" type="number" min="1" max="12" value={block.durationHours} onChange={(event) => updateBlock(index, { durationHours: Number(event.target.value) })} /></label><label>Priority<select className="fld" value={block.priority} onChange={(event) => updateBlock(index, { priority: event.target.value as DraftBlock['priority'] })}><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option></select></label></div><small>{displayHour(block.startHour)} · {block.durationHours} hour{block.durationHours === 1 ? '' : 's'} · {block.rationale}</small></div></article>)}</div>
      <div className="ai-plan-modal-actions"><button type="button" className="admin-button-secondary" onClick={() => setOpen(false)} disabled={saving}>Keep editing later</button><button type="button" className="admin-button" onClick={() => void confirmPlan()} disabled={saving || !draft.blocks.length}>{saving ? 'Adding to calendar…' : 'Confirm & add to calendar'}</button></div>
    </section></div>}
  </>;
}
