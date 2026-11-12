'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  EMPTY_PROFILE,
  PROFILE_CATEGORIES,
  PROFILE_CATEGORY_INFO,
  type ProfileCategory,
  type ProfileData,
} from '@/lib/life-ai-profile-contract';

type AnyProfileData = ProfileData[ProfileCategory];
type ProfileApiResponse = {
  sections: Partial<Record<ProfileCategory, { data: unknown; updatedAt: string }>>;
  settings: { aiContextEnabled: boolean; updatedAt: string | null };
  permissions: Record<string, { aiEnabled: boolean; consentedAt: string | null; updatedAt: string }>;
};
type SectionTimes = Partial<Record<ProfileCategory, string>>;
type ProfileMessage = { role: 'user' | 'assistant'; content: string };
type FieldSpec = { key: string; label: string; list?: boolean; multiline?: boolean };

const SIMPLE_FIELDS: Partial<Record<ProfileCategory, FieldSpec[]>> = {
  about: [
    { key: 'preferredName', label: 'Preferred name' },
    { key: 'introduction', label: 'A little about me', multiline: true },
    { key: 'location', label: 'Location or home base' },
    { key: 'background', label: 'Background', multiline: true },
    { key: 'languages', label: 'Languages', list: true },
    { key: 'personalContext', label: 'Personal context I want my AI to know', multiline: true },
  ],
  professional: [
    { key: 'currentRole', label: 'Current role' },
    { key: 'background', label: 'Professional background', multiline: true },
    { key: 'skills', label: 'Skills', list: true },
    { key: 'careerAmbitions', label: 'Career ambitions', multiline: true },
    { key: 'currentProjects', label: 'Current projects', list: true },
    { key: 'learningObjectives', label: 'Learning objectives', list: true },
    { key: 'businessAmbitions', label: 'Business ambitions', multiline: true },
    { key: 'challenges', label: 'Current professional challenges', multiline: true },
  ],
  relationships: [
    { key: 'importantPeople', label: 'Important people (use only details you are comfortable storing)', list: true },
    { key: 'familyCommitments', label: 'Family commitments', multiline: true },
    { key: 'friendships', label: 'Friendships and social connections', multiline: true },
    { key: 'socialGoals', label: 'Social goals', list: true },
    { key: 'importantDates', label: 'Important dates', list: true },
    { key: 'sharedActivities', label: 'Shared activities', list: true },
    { key: 'preferencesAndBoundaries', label: 'Preferences and boundaries', multiline: true },
  ],
  wellbeing: [
    { key: 'fitnessGoals', label: 'Fitness goals', multiline: true },
    { key: 'preferredActivities', label: 'Preferred activities', list: true },
    { key: 'sleepAndRest', label: 'Sleep and rest preferences', multiline: true },
    { key: 'recreation', label: 'Recreation', list: true },
    { key: 'stressManagement', label: 'Stress management preferences', multiline: true },
    { key: 'moodBoosters', label: 'Things that lift my mood', list: true },
    { key: 'makeMoreTimeFor', label: 'Things I want to make more time for', list: true },
  ],
  interests: [
    { key: 'hobbies', label: 'Hobbies', list: true },
    { key: 'favoriteActivities', label: 'Favorite activities', list: true },
    { key: 'booksAndReading', label: 'Books and reading', list: true },
    { key: 'entertainment', label: 'Entertainment', list: true },
    { key: 'travel', label: 'Travel', list: true },
    { key: 'creativeInterests', label: 'Creative interests', list: true },
    { key: 'explore', label: 'Things I would like to explore', list: true },
  ],
  spiritual: [
    { key: 'spiritualPriorities', label: 'Spiritual priorities', multiline: true },
    { key: 'personalDevelopment', label: 'Personal development', list: true },
    { key: 'learningGoals', label: 'Learning goals', list: true },
    { key: 'reflectionPractices', label: 'Reflection practices', list: true },
    { key: 'communityInvolvement', label: 'Community involvement', multiline: true },
    { key: 'mentorshipAndContribution', label: 'Mentorship and contribution', multiline: true },
  ],
  lifestyle: [
    { key: 'dailyRoutine', label: 'Daily routine', multiline: true },
    { key: 'workingHours', label: 'Working hours' },
    { key: 'workLifeBalance', label: 'Work-life balance', multiline: true },
    { key: 'planningStyle', label: 'Planning style' },
    { key: 'socialPreferences', label: 'Social preferences', multiline: true },
    { key: 'recreationPreferences', label: 'Recreation preferences', multiline: true },
    { key: 'communicationPreferences', label: 'Communication preferences', multiline: true },
    { key: 'thingsToAvoid', label: 'Things to avoid', multiline: true },
    { key: 'fulfillingLife', label: 'What a fulfilling life means to me', multiline: true },
  ],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hydrateProfile(payload: ProfileApiResponse): { data: ProfileData; updatedAt: SectionTimes } {
  const data = { ...EMPTY_PROFILE } as ProfileData;
  const updatedAt: SectionTimes = {};
  for (const category of PROFILE_CATEGORIES) {
    const section = payload.sections?.[category];
    if (!section) continue;
    if (isRecord(section.data)) {
      (data as unknown as Record<ProfileCategory, unknown>)[category] = {
        ...(EMPTY_PROFILE[category] as unknown as Record<string, unknown>),
        ...section.data,
      };
    }
    updatedAt[category] = section.updatedAt;
  }
  return { data, updatedAt };
}

function freshId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `item-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function moveItem<T>(items: T[], index: number, offset: number): T[] {
  const destination = index + offset;
  if (destination < 0 || destination >= items.length) return items;
  const reordered = [...items];
  [reordered[index], reordered[destination]] = [reordered[destination], reordered[index]];
  return reordered;
}

function hasContent(value: unknown): boolean {
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number') return value > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (isRecord(value)) return Object.values(value).some(hasContent);
  return value !== null && value !== undefined;
}

function categoryCompletion(data: ProfileData): { complete: number; total: number; percent: number } {
  let complete = 0;
  let total = 0;
  for (const category of PROFILE_CATEGORIES) {
    for (const value of Object.values(data[category] as unknown as Record<string, unknown>)) {
      total += 1;
      if (hasContent(value)) complete += 1;
    }
  }
  return { complete, total, percent: total ? Math.round((complete / total) * 100) : 0 };
}

function readableLabel(key: string): string {
  return key.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/^./, (letter) => letter.toUpperCase());
}

function Field({ label, value, onChange, multiline = false }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
}) {
  return <label className="admin-field life-profile-field">
    <span>{label}</span>
    {multiline
      ? <textarea className="fld" value={value} onChange={(event) => onChange(event.target.value)} rows={3} />
      : <input className="fld" type="text" value={value} onChange={(event) => onChange(event.target.value)} />}
  </label>;
}

function ListField({ label, values, onChange, hint }: {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  hint?: string;
}) {
  return <label className="admin-field life-profile-field">
    <span>{label}</span>
    <textarea className="fld" value={values.join('\n')} onChange={(event) => onChange(event.target.value.split('\n').map((item) => item.trim()).filter(Boolean).slice(0, 40))} rows={3} aria-describedby={hint ? `${label.replace(/[^a-z0-9]/gi, '-')}-hint` : undefined} />
    {hint && <small id={`${label.replace(/[^a-z0-9]/gi, '-')}-hint`}>{hint}</small>}
  </label>;
}

function ReadOnlyValue({ value }: { value: unknown }) {
  if (typeof value === 'string') return value.trim() ? <p>{value}</p> : null;
  if (typeof value === 'number') return <p>{value}{value <= 100 ? '%' : ''}</p>;
  if (typeof value === 'boolean') return <p>{value ? 'Completed' : 'Not completed'}</p>;
  if (Array.isArray(value)) {
    if (!value.length) return null;
    if (value.every((entry) => typeof entry === 'string')) return <ul className="life-profile-read-list">{value.map((entry, index) => <li key={`${entry}-${index}`}>{entry}</li>)}</ul>;
    return <div className="life-profile-read-items">{value.map((entry, index) => {
      if (!isRecord(entry)) return <p key={index}>{String(entry)}</p>;
      return <article className="life-profile-read-item" key={typeof entry.id === 'string' ? entry.id : index}>
        {Object.entries(entry).filter(([key, child]) => key !== 'id' && hasContent(child)).map(([key, child]) => <div className="life-profile-read-detail" key={key}><strong>{readableLabel(key)}</strong><ReadOnlyValue value={child} /></div>)}
      </article>;
    })}</div>;
  }
  if (isRecord(value)) return <div className="life-profile-read-items">{Object.entries(value).filter(([key, child]) => key !== 'id' && hasContent(child)).map(([key, child]) => <div className="life-profile-read-detail" key={key}><strong>{readableLabel(key)}</strong><ReadOnlyValue value={child} /></div>)}</div>;
  return null;
}

function ProfileEditor({ category, value, onChange }: {
  category: ProfileCategory;
  value: AnyProfileData;
  onChange: (next: AnyProfileData) => void;
}) {
  const record = value as unknown as Record<string, unknown>;
  const setField = (key: string, next: unknown) => onChange({ ...record, [key]: next } as AnyProfileData);

  if (category === 'values') {
    const items = (value as ProfileData['values']).values;
    return <div className="life-profile-editor-stack"><p className="life-profile-editor-hint">Add only values that feel true to you. Use the arrows to set their order of importance.</p>
      {items.map((item, index) => <article className="life-profile-item-card" key={item.id}>
        <div className="life-profile-item-top"><span className="life-profile-item-number">{String(index + 1).padStart(2, '0')}</span><div className="life-profile-item-actions"><button type="button" className="admin-button-secondary" aria-label={`Move ${item.name || 'value'} up`} disabled={index === 0} onClick={() => onChange({ values: moveItem(items, index, -1) } as AnyProfileData)}>Move up</button><button type="button" className="admin-button-secondary" aria-label={`Move ${item.name || 'value'} down`} disabled={index === items.length - 1} onClick={() => onChange({ values: moveItem(items, index, 1) } as AnyProfileData)}>Move down</button><button type="button" className="admin-button-secondary" onClick={() => onChange({ values: items.filter((_, itemIndex) => itemIndex !== index) } as AnyProfileData)}>Remove</button></div></div>
        <Field label={`Value ${index + 1}`} value={item.name} onChange={(name) => onChange({ values: items.map((entry, itemIndex) => itemIndex === index ? { ...entry, name } : entry) } as AnyProfileData)} />
      </article>)}
      <button type="button" className="admin-button-secondary" onClick={() => onChange({ values: [...items, { id: freshId(), name: '' }] } as AnyProfileData)}>Add a value</button>
    </div>;
  }

  if (category === 'priorities') {
    const items = (value as ProfileData['priorities']).items;
    return <div className="life-profile-editor-stack"><p className="life-profile-editor-hint">Describe the areas that deserve your attention now. Reorder these to reflect what comes first.</p>
      {items.map((item, index) => <article className="life-profile-item-card" key={item.id}>
        <div className="life-profile-item-top"><span className="life-profile-item-number">Priority {index + 1}</span><div className="life-profile-item-actions"><button type="button" className="admin-button-secondary" aria-label={`Move ${item.title || 'priority'} up`} disabled={index === 0} onClick={() => onChange({ items: moveItem(items, index, -1) } as AnyProfileData)}>Move up</button><button type="button" className="admin-button-secondary" aria-label={`Move ${item.title || 'priority'} down`} disabled={index === items.length - 1} onClick={() => onChange({ items: moveItem(items, index, 1) } as AnyProfileData)}>Move down</button><button type="button" className="admin-button-secondary" onClick={() => onChange({ items: items.filter((_, itemIndex) => itemIndex !== index) } as AnyProfileData)}>Remove</button></div></div>
        <Field label="Priority" value={item.title} onChange={(title) => onChange({ items: items.map((entry, itemIndex) => itemIndex === index ? { ...entry, title } : entry) } as AnyProfileData)} />
        <label className="admin-field life-profile-field"><span>Importance</span><select className="admin-select" value={item.level} onChange={(event) => onChange({ items: items.map((entry, itemIndex) => itemIndex === index ? { ...entry, level: event.target.value as typeof entry.level } : entry) } as AnyProfileData)}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label>
        <Field label="Why this matters" value={item.description} multiline onChange={(description) => onChange({ items: items.map((entry, itemIndex) => itemIndex === index ? { ...entry, description } : entry) } as AnyProfileData)} />
        <Field label="Current focus" value={item.currentFocus} multiline onChange={(currentFocus) => onChange({ items: items.map((entry, itemIndex) => itemIndex === index ? { ...entry, currentFocus } : entry) } as AnyProfileData)} />
        <Field label="Notes" value={item.notes} multiline onChange={(notes) => onChange({ items: items.map((entry, itemIndex) => itemIndex === index ? { ...entry, notes } : entry) } as AnyProfileData)} />
      </article>)}
      <button type="button" className="admin-button-secondary" onClick={() => onChange({ items: [...items, { id: freshId(), title: '', level: 'medium', description: '', currentFocus: '', notes: '' }] } as AnyProfileData)}>Add a priority</button>
    </div>;
  }

  if (category === 'goals') {
    const items = (value as ProfileData['goals']).items;
    return <div className="life-profile-editor-stack"><p className="life-profile-editor-hint">Shape goals around what matters to you. Progress and milestones are yours to update at any time.</p>
      {items.map((goal, index) => <article className="life-profile-item-card life-profile-goal-card" key={goal.id}>
        <div className="life-profile-item-top"><span className="life-profile-item-number">Goal {index + 1}</span><div className="life-profile-item-actions"><button type="button" className="admin-button-secondary" aria-label={`Move ${goal.title || 'goal'} up`} disabled={index === 0} onClick={() => onChange({ items: moveItem(items, index, -1) } as AnyProfileData)}>Move up</button><button type="button" className="admin-button-secondary" aria-label={`Move ${goal.title || 'goal'} down`} disabled={index === items.length - 1} onClick={() => onChange({ items: moveItem(items, index, 1) } as AnyProfileData)}>Move down</button><button type="button" className="admin-button-secondary" onClick={() => onChange({ items: items.filter((_, itemIndex) => itemIndex !== index) } as AnyProfileData)}>Remove</button></div></div>
        <Field label="Goal" value={goal.title} onChange={(title) => onChange({ items: items.map((entry, itemIndex) => itemIndex === index ? { ...entry, title } : entry) } as AnyProfileData)} />
        <Field label="What this goal means to me" value={goal.description} multiline onChange={(description) => onChange({ items: items.map((entry, itemIndex) => itemIndex === index ? { ...entry, description } : entry) } as AnyProfileData)} />
        <div className="life-profile-form-row">
          <Field label="Category" value={goal.category} onChange={(categoryValue) => onChange({ items: items.map((entry, itemIndex) => itemIndex === index ? { ...entry, category: categoryValue } : entry) } as AnyProfileData)} />
          <label className="admin-field life-profile-field"><span>Priority</span><select className="admin-select" value={goal.priority} onChange={(event) => onChange({ items: items.map((entry, itemIndex) => itemIndex === index ? { ...entry, priority: event.target.value as typeof entry.priority } : entry) } as AnyProfileData)}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label>
        </div>
        <div className="life-profile-form-row">
          <label className="admin-field life-profile-field"><span>Timeframe</span><select className="admin-select" value={goal.timeframe} onChange={(event) => onChange({ items: items.map((entry, itemIndex) => itemIndex === index ? { ...entry, timeframe: event.target.value as typeof entry.timeframe } : entry) } as AnyProfileData)}><option value="short">Short term</option><option value="medium">Medium term</option><option value="long">Long term</option></select></label>
          <label className="admin-field life-profile-field"><span>Target date</span><input className="fld" type="date" value={goal.targetDate} onChange={(event) => onChange({ items: items.map((entry, itemIndex) => itemIndex === index ? { ...entry, targetDate: event.target.value } : entry) } as AnyProfileData)} /></label>
        </div>
        <label className="admin-field life-profile-field"><span>Status</span><select className="admin-select" value={goal.status} onChange={(event) => onChange({ items: items.map((entry, itemIndex) => itemIndex === index ? { ...entry, status: event.target.value as typeof entry.status } : entry) } as AnyProfileData)}><option value="not_started">Not started</option><option value="in_progress">In progress</option><option value="paused">Paused</option><option value="completed">Completed</option></select></label>
        <label className="admin-field life-profile-field"><span>Progress: {goal.progressPercent}%</span><input className="fld" type="range" min="0" max="100" step="1" value={goal.progressPercent} onChange={(event) => onChange({ items: items.map((entry, itemIndex) => itemIndex === index ? { ...entry, progressPercent: Number(event.target.value) } : entry) } as AnyProfileData)} /><input className="fld" type="number" min="0" max="100" step="1" value={goal.progressPercent} aria-label={`Progress percentage for ${goal.title || `goal ${index + 1}`}`} onChange={(event) => onChange({ items: items.map((entry, itemIndex) => itemIndex === index ? { ...entry, progressPercent: Math.min(100, Math.max(0, Number(event.target.value) || 0)) } : entry) } as AnyProfileData)} /></label>
        <fieldset className="life-profile-milestones"><legend>Milestones</legend>
          {goal.milestones.map((milestone, milestoneIndex) => <div className="life-profile-milestone-row" key={milestone.id}><label className="admin-field life-profile-field"><span>Milestone {milestoneIndex + 1}</span><input className="fld" type="text" value={milestone.title} onChange={(event) => onChange({ items: items.map((entry, itemIndex) => itemIndex === index ? { ...entry, milestones: entry.milestones.map((step, stepIndex) => stepIndex === milestoneIndex ? { ...step, title: event.target.value } : step) } : entry) } as AnyProfileData)} /></label><label className="life-profile-check"><input type="checkbox" checked={milestone.completed} onChange={(event) => onChange({ items: items.map((entry, itemIndex) => itemIndex === index ? { ...entry, milestones: entry.milestones.map((step, stepIndex) => stepIndex === milestoneIndex ? { ...step, completed: event.target.checked } : step) } : entry) } as AnyProfileData)} /><span>Completed</span></label><button type="button" className="admin-button-secondary" onClick={() => onChange({ items: items.map((entry, itemIndex) => itemIndex === index ? { ...entry, milestones: entry.milestones.filter((_, stepIndex) => stepIndex !== milestoneIndex) } : entry) } as AnyProfileData)}>Remove</button></div>)}
          <button type="button" className="admin-button-secondary" onClick={() => onChange({ items: items.map((entry, itemIndex) => itemIndex === index ? { ...entry, milestones: [...entry.milestones, { id: freshId(), title: '', completed: false }] } : entry) } as AnyProfileData)}>Add a milestone</button>
        </fieldset>
        <Field label="Notes" value={goal.notes} multiline onChange={(notes) => onChange({ items: items.map((entry, itemIndex) => itemIndex === index ? { ...entry, notes } : entry) } as AnyProfileData)} />
      </article>)}
      <button type="button" className="admin-button-secondary" onClick={() => onChange({ items: [...items, { id: freshId(), title: '', description: '', category: '', priority: 'medium', targetDate: '', timeframe: 'short', status: 'not_started', progressPercent: 0, milestones: [], notes: '' }] } as AnyProfileData)}>Add a goal</button>
    </div>;
  }

  const fields = SIMPLE_FIELDS[category] ?? [];
  return <div className="life-profile-fields-grid">{fields.map((field) => {
    const fieldValue = record[field.key];
    if (field.list) return <ListField key={field.key} label={field.label} values={Array.isArray(fieldValue) ? fieldValue.filter((entry): entry is string => typeof entry === 'string') : []} onChange={(next) => setField(field.key, next)} />;
    return <Field key={field.key} label={field.label} value={typeof fieldValue === 'string' ? fieldValue : ''} multiline={field.multiline} onChange={(next) => setField(field.key, next)} />;
  })}</div>;
}

export default function LifeAIProfileWorkspace() {
  const [profile, setProfile] = useState<ProfileData>({ ...EMPTY_PROFILE });
  const [sectionTimes, setSectionTimes] = useState<SectionTimes>({});
  const [settings, setSettings] = useState<ProfileApiResponse['settings']>({ aiContextEnabled: false, updatedAt: null });
  const [permissions, setPermissions] = useState<ProfileApiResponse['permissions']>({});
  const [selected, setSelected] = useState<ProfileCategory>('about');
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<AnyProfileData>(EMPTY_PROFILE.about);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState('');
  const [notice, setNotice] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiDraft, setAiDraft] = useState('');
  const [aiMessages, setAiMessages] = useState<ProfileMessage[]>([]);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState('');
  const [copyNotice, setCopyNotice] = useState('');
  const [insertField, setInsertField] = useState('');

  useEffect(() => {
    let alive = true;
    const requestedSection = new URLSearchParams(window.location.search).get('section');
    if (requestedSection && PROFILE_CATEGORIES.includes(requestedSection as ProfileCategory)) setSelected(requestedSection as ProfileCategory);
    void fetch('/api/admin/life-ai/profile').then(async (response) => {
      const payload = await response.json() as ProfileApiResponse & { error?: string };
      if (!response.ok) throw new Error(payload.error || 'Your profile could not be loaded.');
      if (!alive) return;
      const hydrated = hydrateProfile(payload);
      setProfile(hydrated.data);
      setSectionTimes(hydrated.updatedAt);
      setSettings(payload.settings ?? { aiContextEnabled: false, updatedAt: null });
      setPermissions(payload.permissions ?? {});
    }).catch((cause: unknown) => {
      if (alive) {
        const message = cause instanceof Error ? cause.message : 'Your profile could not be loaded.';
        setError(message);
        setLoadError(message);
      }
    }).finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const completion = useMemo(() => categoryCompletion(profile), [profile]);
  const lastUpdated = useMemo(() => {
    const dates = Object.values(sectionTimes).filter((date): date is string => Boolean(date)).map((date) => new Date(date).getTime()).filter(Number.isFinite);
    return dates.length ? new Date(Math.max(...dates)) : null;
  }, [sectionTimes]);
  const selectedInfo = PROFILE_CATEGORY_INFO[selected];
  const selectedPermission = permissions[selected];
  const activeGoals = profile.goals.items.filter((goal) => goal.status !== 'completed');
  const activeProfileCategories = PROFILE_CATEGORIES.filter((category) => Boolean(settings.aiContextEnabled && permissions[category]?.aiEnabled)).length;
  const profileContextActive = settings.aiContextEnabled && activeProfileCategories > 0;
  const selectedRecord = profile[selected] as unknown as Record<string, unknown>;
  const insertableFields = (SIMPLE_FIELDS[selected] ?? []).filter((field) => !field.list);
  const selectedFilledCount = Object.values(selectedRecord).filter(hasContent).length;

  function beginEdit() {
    setDraft(profile[selected] as AnyProfileData);
    setEditing(true);
    setNotice('');
    setError('');
    setInsertField(insertableFields[0]?.key ?? '');
  }

  function cancelEdit() {
    setDraft(profile[selected] as AnyProfileData);
    setEditing(false);
    setError('');
  }

  function selectCategory(category: ProfileCategory) {
    setSelected(category);
    setEditing(false);
    setDraft(EMPTY_PROFILE[category] as AnyProfileData);
    setAiDraft('');
    setAiMessages([]);
    setAiPrompt('');
    setAiError('');
    setNotice('');
    setError('');
  }

  async function saveSection(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const response = await fetch('/api/admin/life-ai/profile', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ category: selected, data: draft }),
      });
      const payload = await response.json().catch(() => ({})) as { error?: string; section?: { updatedAt?: string } };
      if (!response.ok) throw new Error(payload.error || 'This section could not be saved.');
      setProfile((current) => ({ ...current, [selected]: draft }) as ProfileData);
      setSectionTimes((current) => ({ ...current, [selected]: payload.section?.updatedAt ?? new Date().toISOString() }));
      setEditing(false);
      setNotice(`${selectedInfo.label} saved.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'This section could not be saved.');
    } finally {
      setSaving(false);
    }
  }

  async function deleteSection() {
    if (!window.confirm(`Delete your saved ${selectedInfo.label.toLowerCase()} section? This cannot be undone.`)) return;
    setDeleting(true);
    setError('');
    setNotice('');
    try {
      const response = await fetch(`/api/admin/life-ai/profile?category=${encodeURIComponent(selected)}`, { method: 'DELETE' });
      const payload = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(payload.error || 'This section could not be deleted.');
      setProfile((current) => ({ ...current, [selected]: EMPTY_PROFILE[selected] }) as ProfileData);
      setSectionTimes((current) => { const next = { ...current }; delete next[selected]; return next; });
      setDraft(EMPTY_PROFILE[selected] as AnyProfileData);
      setEditing(false);
      setAiDraft('');
      setAiMessages([]);
      setNotice(`${selectedInfo.label} deleted.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'This section could not be deleted.');
    } finally {
      setDeleting(false);
    }
  }

  async function requestAiDraft(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = aiPrompt.trim();
    if (!content || aiBusy) return;
    const messages: ProfileMessage[] = [...aiMessages, { role: 'user' as const, content }].slice(-8);
    setAiBusy(true);
    setAiError('');
    setAiDraft('');
    setCopyNotice('');
    setAiMessages(messages);
    setAiPrompt('');
    try {
      const response = await fetch('/api/admin/life-ai/profile/draft', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ category: selected, messages }),
      });
      const payload = await response.json() as { draft?: string; error?: string };
      if (!response.ok) throw new Error(payload.error || 'AI draft assistance is unavailable right now.');
      if (typeof payload.draft !== 'string') throw new Error('The AI response did not include a draft.');
      setAiDraft(payload.draft);
      const completedMessages: ProfileMessage[] = [...messages, { role: 'assistant' as const, content: payload.draft }].slice(-8);
      setAiMessages(completedMessages);
    } catch (cause) {
      setAiError(cause instanceof Error ? cause.message : 'AI draft assistance is unavailable right now.');
    } finally {
      setAiBusy(false);
    }
  }

  async function copyAiDraft() {
    try {
      await navigator.clipboard.writeText(aiDraft);
      setCopyNotice('Draft copied.');
    } catch {
      setCopyNotice('Clipboard access is unavailable in this browser.');
    }
  }

  function insertAiDraft() {
    if (!editing || !insertField || !aiDraft.trim()) return;
    const existing = (draft as unknown as Record<string, unknown>)[insertField];
    const next = typeof existing === 'string' && existing.trim() ? `${existing.trim()}\n\n${aiDraft.trim()}` : aiDraft.trim();
    setDraft({ ...(draft as unknown as Record<string, unknown>), [insertField]: next } as AnyProfileData);
    setNotice('Draft inserted into your unsaved changes. Save the section when you are ready.');
  }

  return <main className="life-profile-page">
    <header className="life-profile-header">
      <div className="life-profile-heading"><p className="admin-eyebrow">Your Life AI · Private profile</p><h1 className="admin-title">My Life Profile</h1><p className="admin-description">A thoughtful picture of what matters to you, shaped entirely on your terms.</p></div>
      <a className="admin-button-secondary life-profile-export" href="/api/admin/life-ai/profile/export">Export my profile</a>
    </header>

    <section className="admin-panel life-profile-explainer" aria-label="About My Life Profile">
      <p>My Life Profile helps Your Life AI understand what matters to you, personalize its recommendations, and support the life you want to build. You control what information is stored and what the AI can access.</p>
    </section>

    <section className="admin-panel life-profile-overview" aria-label="Profile completion and status">
      <div className="life-profile-completion"><div className="life-profile-overview-title"><div><span className="admin-eyebrow">Profile completion</span><strong>{completion.percent}%</strong></div><span className="life-profile-completion-detail">{completion.complete} of {completion.total} profile fields have information</span></div><progress value={completion.percent} max="100" aria-label={`Profile ${completion.percent}% complete`} /></div>
      <div className="life-profile-overview-meta"><div><span className="admin-eyebrow">Last updated</span><strong>{lastUpdated ? lastUpdated.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Not yet updated'}</strong></div><div><span className="admin-eyebrow">AI context</span><strong className={profileContextActive ? 'life-profile-status-on' : 'life-profile-status-off'}>{profileContextActive ? `Enabled for ${activeProfileCategories} categor${activeProfileCategories === 1 ? 'y' : 'ies'}` : 'Not active'}</strong></div></div>
    </section>

    <section className="life-profile-highlights" aria-label="Profile overview">
      <article className="admin-panel life-profile-highlight"><span className="admin-eyebrow">About me</span><p>{profile.about.introduction || 'Your introduction will appear here when you add it.'}</p></article>
      <article className="admin-panel life-profile-highlight"><span className="admin-eyebrow">Core values</span>{profile.values.values.length ? <ul>{profile.values.values.slice(0, 5).map((value) => <li key={value.id}>{value.name || 'Untitled value'}</li>)}</ul> : <p>No values added yet.</p>}</article>
      <article className="admin-panel life-profile-highlight"><span className="admin-eyebrow">Life priorities</span>{profile.priorities.items.length ? <ul>{profile.priorities.items.slice(0, 4).map((item) => <li key={item.id}>{item.title || 'Untitled priority'}</li>)}</ul> : <p>No priorities added yet.</p>}</article>
      <article className="admin-panel life-profile-highlight"><span className="admin-eyebrow">Current goals</span><strong className="life-profile-highlight-count">{activeGoals.length}</strong><p>{activeGoals.length ? activeGoals.slice(0, 2).map((goal) => goal.title || 'Untitled goal').join(' · ') : 'No active goals yet.'}</p></article>
      <article className="admin-panel life-profile-highlight"><span className="admin-eyebrow">Interests</span>{profile.interests.hobbies.length || profile.interests.favoriteActivities.length ? <p>{[...profile.interests.hobbies, ...profile.interests.favoriteActivities].slice(0, 5).join(' · ')}</p> : <p>No interests added yet.</p>}</article>
      <article className="admin-panel life-profile-highlight"><span className="admin-eyebrow">Lifestyle preferences</span><p>{profile.lifestyle.fulfillingLife || profile.lifestyle.planningStyle || 'Your preferences will appear here when you add them.'}</p></article>
    </section>

    {error && <div className="admin-error life-profile-alert" role="alert">{error}</div>}
    {notice && <div className="life-profile-notice" role="status">{notice}</div>}

    <div className="life-profile-layout">
      <nav className="admin-panel life-profile-selector" aria-label="Profile sections">
        <span className="admin-eyebrow">Profile sections</span>
        {PROFILE_CATEGORIES.map((category) => {
          const info = PROFILE_CATEGORY_INFO[category];
          const filled = Object.values(profile[category] as unknown as Record<string, unknown>).filter(hasContent).length;
          return <button type="button" key={category} className={`life-profile-category${selected === category ? ' is-selected' : ''}`} aria-current={selected === category ? 'page' : undefined} aria-controls="life-profile-section" onClick={() => selectCategory(category)}><span className="life-profile-category-copy"><strong>{info.label}</strong><small>{filled ? `${filled} field${filled === 1 ? '' : 's'} with information` : 'Not filled in'}</small></span><span className={`life-profile-category-indicator${filled ? ' is-filled' : ''}`} aria-hidden="true" /></button>;
        })}
        <p className="life-profile-selector-note">Choose a section to view or update. You can leave any section empty.</p>
      </nav>

      <section id="life-profile-section" className="admin-panel life-profile-section" aria-labelledby="life-profile-section-title" aria-busy={loading || saving || deleting}>
        {loading ? <div className="life-profile-loading" role="status"><span className="life-profile-loading-mark" aria-hidden="true" />Loading your profile…</div> : loadError ? <div className="life-profile-empty"><h2 id="life-profile-section-title">Profile unavailable</h2><p>Your saved sections could not be loaded, so editing is paused to protect your information. Reload this page to try again.</p></div> : <>
          <div className="life-profile-section-head"><div><p className="admin-eyebrow">{selectedInfo.sensitive ? 'Personal · sensitive' : 'Personal profile'}</p><h2 id="life-profile-section-title">{selectedInfo.label}</h2><p>{selectedInfo.description}</p></div>{!editing && <div className="life-profile-section-actions"><button type="button" className="admin-button" onClick={beginEdit}>Edit section</button><button type="button" className="admin-button-secondary life-profile-delete" disabled={deleting} onClick={() => void deleteSection()}>{deleting ? 'Deleting…' : 'Delete section'}</button></div>}</div>

          <div className="life-profile-ai-access" role="status"><span className={`life-profile-status-dot${settings.aiContextEnabled && selectedPermission?.aiEnabled ? ' is-on' : ''}`} aria-hidden="true" /><span><strong>AI access for this section:</strong> {!settings.aiContextEnabled ? 'AI context is disabled.' : selectedPermission ? selectedPermission.aiEnabled ? 'Enabled for Your Life AI.' : 'Not enabled for Your Life AI.' : 'No category permission is recorded.'}</span>{selectedInfo.sensitive && <span className="life-profile-sensitive-note">This section can include sensitive personal information.</span>}</div>

          {editing ? <form className="life-profile-form" onSubmit={(event) => void saveSection(event)}>
            <ProfileEditor category={selected} value={draft} onChange={setDraft} />
            <div className="life-profile-form-actions"><button type="submit" className="admin-button" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button><button type="button" className="admin-button-secondary" disabled={saving} onClick={cancelEdit}>Cancel</button></div>
          </form> : <div className="life-profile-read-view">{selectedFilledCount ? Object.entries(profile[selected] as unknown as Record<string, unknown>).filter(([, value]) => hasContent(value)).map(([key, value]) => <div className="life-profile-read-field" key={key}><h3>{readableLabel(key)}</h3><ReadOnlyValue value={value} /></div>) : <div className="life-profile-empty"><span className="life-profile-empty-mark" aria-hidden="true">+</span><h3>This section is yours to shape</h3><p>There is no information saved here yet. Add only what feels useful and comfortable to keep.</p><button type="button" className="admin-button-secondary" onClick={beginEdit}>Add information</button></div>}</div>}

          <section className="life-profile-draft-assist" aria-labelledby="life-profile-draft-title"><div className="life-profile-draft-heading"><div><span className="admin-eyebrow">Optional writing help</span><h3 id="life-profile-draft-title">Explore a thought with Your Life AI</h3><p>Ask for help phrasing or organizing your thoughts. The response is only a draft; it is not saved to your profile.</p></div><span className="life-profile-draft-label">Uncommitted draft</span></div>
            {aiMessages.length > 0 && <div className="life-profile-draft-thread" aria-label="Profile draft conversation">{aiMessages.map((message, index) => <article key={`${index}-${message.role}`} className={`life-profile-draft-turn ${message.role}`}><strong>{message.role === 'user' ? 'You' : 'Your Life AI · draft'}</strong><p>{message.content}</p></article>)}</div>}
            <form className="life-profile-draft-form" onSubmit={(event) => void requestAiDraft(event)}><label className="admin-field life-profile-field"><span>{aiMessages.length ? 'Continue the conversation' : 'What would you like help thinking through?'}</span><textarea className="fld" rows={2} value={aiPrompt} onChange={(event) => setAiPrompt(event.target.value)} placeholder="For example, ask for reflective questions or help finding words for this section." /></label><button type="submit" className="admin-button-secondary" disabled={aiBusy || !aiPrompt.trim()}>{aiBusy ? 'Preparing draft…' : 'Help me complete my profile with AI'}</button></form>
            {aiBusy && <p className="life-profile-loading" role="status">Preparing a draft. Nothing is being saved.</p>}
            {aiError && <p className="admin-error" role="alert">{aiError}</p>}
            {aiDraft && <div className="life-profile-draft-result"><div className="life-profile-draft-result-head"><strong>Suggestion is not saved to your profile</strong><button type="button" className="admin-button-secondary" onClick={() => void copyAiDraft()}>Copy latest draft</button></div>{copyNotice && <p className="life-profile-inline-status" role="status">{copyNotice}</p>}{editing && insertableFields.length > 0 && <div className="life-profile-insert-row"><label className="admin-field life-profile-field"><span>Choose an unsaved field</span><select className="admin-select" value={insertField} onChange={(event) => setInsertField(event.target.value)}>{insertableFields.map((field) => <option key={field.key} value={field.key}>{field.label}</option>)}</select></label><button type="button" className="admin-button-secondary" onClick={insertAiDraft} disabled={!insertField}>Insert into unsaved field</button></div>}</div>}
          </section>
        </>}
      </section>
    </div>
  </main>;
}
