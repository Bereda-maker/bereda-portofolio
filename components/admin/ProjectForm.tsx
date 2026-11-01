'use client';
import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import type { ProjectRow } from '@/lib/schema';
import { useConfirm, useToast } from './AdminUI';

type Props = {
  project?: ProjectRow;
  onSaved: (project: ProjectRow) => void;
  onCancel: () => void;
};

type FormState = { title: string; category: string; description: string; demo: string; repo: string };
type Errors = Partial<Record<keyof FormState | 'stack', string>>;

// Limits mirror the Zod schema in app/api/admin/projects/route.ts.
const LIMITS = { title: 200, category: 100, description: 2000, stack: 20 };
const SUGGESTED_CATEGORIES = ['Project', 'Team', 'Client', 'Open source'];

function toFormState(p?: ProjectRow): FormState {
  return { title: p?.title ?? '', category: p?.category ?? '', description: p?.description ?? '', demo: p?.demo ?? '', repo: p?.repo ?? '' };
}

const isUrl = (v: string) => v === '' || v === '#' || /^https?:\/\//i.test(v);

export default function ProjectForm({ project, onSaved, onCancel }: Props) {
  const confirm = useConfirm();
  const toast = useToast();
  const initial = useRef({ form: toFormState(project), tags: project?.stack ?? [] });
  const [f, setF] = useState<FormState>(initial.current.form);
  const [tags, setTags] = useState<string[]>(initial.current.tags);
  const [draft, setDraft] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [formErr, setFormErr] = useState('');
  const [saving, setSaving] = useState(false);
  const firstRef = useRef<HTMLInputElement>(null);
  const isEdit = !!project;

  const dirty = JSON.stringify(f) !== JSON.stringify(initial.current.form) || JSON.stringify(tags) !== JSON.stringify(initial.current.tags) || draft.trim() !== '';

  useEffect(() => {
    firstRef.current?.focus();
    const previous = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; previous?.focus?.(); };
  }, []);

  const requestClose = async () => {
    if (saving) return;
    if (dirty && !(await confirm({ title: 'Discard your changes?', body: 'You have unsaved edits to this project.', confirmLabel: 'Discard', cancelLabel: 'Keep editing', danger: true }))) return;
    onCancel();
  };

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setF((prev) => ({ ...prev, [k]: e.target.value }));
    if (errors[k]) setErrors((prev) => ({ ...prev, [k]: undefined }));
  };

  const addTags = (raw: string) => {
    const incoming = raw.split(',').map((s) => s.trim()).filter(Boolean);
    if (incoming.length === 0) return;
    setTags((prev) => {
      const next = [...prev];
      for (const t of incoming) if (!next.some((x) => x.toLowerCase() === t.toLowerCase()) && next.length < LIMITS.stack) next.push(t);
      return next;
    });
    setDraft('');
    setErrors((prev) => ({ ...prev, stack: undefined }));
  };

  const validate = (stack: string[]): Errors => {
    const e: Errors = {};
    if (!f.title.trim()) e.title = 'Give the project a title.';
    if (!f.category.trim()) e.category = 'Add a category, for example “Client”.';
    if (!f.description.trim()) e.description = 'Add a short description.';
    if (stack.length === 0) e.stack = 'Add at least one technology.';
    if (!isUrl(f.demo.trim())) e.demo = 'Use a full URL starting with https://, or leave it empty.';
    if (!isUrl(f.repo.trim())) e.repo = 'Use a full URL starting with https://, or leave it empty.';
    return e;
  };

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const stack = draft.trim() ? [...tags, ...draft.split(',').map((s) => s.trim()).filter(Boolean)] : tags;
    const found = validate(stack);
    setErrors(found);
    if (Object.keys(found).length > 0) { setFormErr('Fix the highlighted fields and try again.'); return; }
    setFormErr('');
    setSaving(true);
    try {
      const res = await fetch(isEdit ? `/api/admin/projects/${project!.id}` : '/api/admin/projects', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: f.title.trim(), category: f.category.trim(), description: f.description.trim(), stack, demo: f.demo.trim() || '#', repo: f.repo.trim() || '#' }),
      });
      const data: { project?: ProjectRow; error?: string } = await res.json().catch(() => ({}));
      if (!res.ok || !data.project) { setFormErr(data.error ?? 'Something went wrong. Please try again.'); return; }
      toast.success(isEdit ? 'Changes saved' : 'Project created');
      onSaved(data.project);
    } catch {
      setFormErr('Could not reach the server. Check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && !e.defaultPrevented) { e.stopPropagation(); void requestClose(); }
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); void submit(); }
  };

  const err = (k: keyof Errors) => errors[k];

  return (
    <div className="admin-overlay admin-overlay-right" onMouseDown={(e) => { if (e.target === e.currentTarget) void requestClose(); }} onKeyDown={onKeyDown}>
      <form role="dialog" aria-modal="true" aria-labelledby="project-form-title" className="admin-drawer" onSubmit={submit} noValidate>
        <header className="admin-drawer-head">
          <div>
            <h2 id="project-form-title">{isEdit ? 'Edit project' : 'New project'}</h2>
            <p>{isEdit ? 'Changes go live on your public site within a minute.' : 'This appears in the Projects section of your public site.'}</p>
          </div>
          <button type="button" className="admin-icon-btn" aria-label="Close" onClick={() => void requestClose()}><X size={18} /></button>
        </header>

        <div className="admin-drawer-body">
          <div className="admin-field">
            <label htmlFor="pf-title">Title</label>
            <input id="pf-title" ref={firstRef} className={`fld${err('title') ? ' err' : ''}`} maxLength={LIMITS.title} placeholder="e.g. Habesha Market" value={f.title} onChange={set('title')} aria-invalid={!!err('title')} aria-describedby={err('title') ? 'pf-title-err' : undefined} />
            {err('title') && <p id="pf-title-err" className="admin-field-error">{err('title')}</p>}
          </div>

          <div className="admin-field">
            <label htmlFor="pf-category">Category</label>
            <input id="pf-category" list="pf-categories" className={`fld${err('category') ? ' err' : ''}`} maxLength={LIMITS.category} placeholder="Project, Team, Client…" value={f.category} onChange={set('category')} aria-invalid={!!err('category')} aria-describedby={err('category') ? 'pf-category-err' : undefined} />
            <datalist id="pf-categories">{SUGGESTED_CATEGORIES.map((c) => <option key={c} value={c} />)}</datalist>
            {err('category') && <p id="pf-category-err" className="admin-field-error">{err('category')}</p>}
          </div>

          <div className="admin-field">
            <label htmlFor="pf-description">Description</label>
            <textarea id="pf-description" className={`fld${err('description') ? ' err' : ''}`} rows={5} maxLength={LIMITS.description} placeholder="What it does, who it’s for, and what you built." value={f.description} onChange={set('description')} aria-invalid={!!err('description')} aria-describedby="pf-description-hint" />
            <p id="pf-description-hint" className="admin-field-hint"><span>{err('description') ? <span className="admin-field-error">{err('description')}</span> : 'Plain text, shown on the project card.'}</span><span>{f.description.length}/{LIMITS.description}</span></p>
          </div>

          <div className="admin-field">
            <label htmlFor="pf-stack">Technologies</label>
            <div className={`admin-tags fld${err('stack') ? ' err' : ''}`} onClick={() => document.getElementById('pf-stack')?.focus()}>
              {tags.map((t) => (
                <span key={t} className="admin-tag">{t}<button type="button" aria-label={`Remove ${t}`} onClick={() => setTags((prev) => prev.filter((x) => x !== t))}><X size={11} /></button></span>
              ))}
              <input
                id="pf-stack"
                value={draft}
                placeholder={tags.length ? '' : 'TypeScript, Next.js, PostgreSQL'}
                aria-invalid={!!err('stack')}
                aria-describedby="pf-stack-hint"
                onChange={(e) => {
                  const v = e.target.value;
                  if (v.includes(',')) addTags(v); else setDraft(v);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { if (draft.trim()) { e.preventDefault(); e.stopPropagation(); addTags(draft); } }
                  else if (e.key === 'Backspace' && !draft && tags.length) setTags((prev) => prev.slice(0, -1));
                }}
                onBlur={() => addTags(draft)}
              />
            </div>
            <p id="pf-stack-hint" className="admin-field-hint"><span>{err('stack') ? <span className="admin-field-error">{err('stack')}</span> : 'Press Enter or comma after each one.'}</span><span>{tags.length}/{LIMITS.stack}</span></p>
          </div>

          <div className="admin-field-row">
            <div className="admin-field">
              <label htmlFor="pf-demo">Live demo URL <em>optional</em></label>
              <input id="pf-demo" type="url" inputMode="url" className={`fld${err('demo') ? ' err' : ''}`} placeholder="https://" value={f.demo === '#' ? '' : f.demo} onChange={set('demo')} aria-invalid={!!err('demo')} />
              {err('demo') && <p className="admin-field-error">{err('demo')}</p>}
            </div>
            <div className="admin-field">
              <label htmlFor="pf-repo">Repository URL <em>optional</em></label>
              <input id="pf-repo" type="url" inputMode="url" className={`fld${err('repo') ? ' err' : ''}`} placeholder="https://github.com/…" value={f.repo === '#' ? '' : f.repo} onChange={set('repo')} aria-invalid={!!err('repo')} />
              {err('repo') && <p className="admin-field-error">{err('repo')}</p>}
            </div>
          </div>
        </div>

        <footer className="admin-drawer-foot">
          <p className={formErr ? 'admin-field-error' : 'admin-field-hint'} role={formErr ? 'alert' : undefined}>{formErr || <><kbd>{'Ctrl'}</kbd> <kbd>Enter</kbd> to save</>}</p>
          <div className="admin-actions">
            <button type="button" className="admin-button-secondary" onClick={() => void requestClose()} disabled={saving}>Cancel</button>
            <button type="submit" className="admin-button" disabled={saving}>{saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create project'}</button>
          </div>
        </footer>
      </form>
    </div>
  );
}
