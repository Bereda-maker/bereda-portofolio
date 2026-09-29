'use client';
import { useState } from 'react';
import type { ProjectRow } from '@/lib/schema';

type Props = {
  project?: ProjectRow;
  onSaved: (project: ProjectRow) => void;
  onCancel: () => void;
};

type FormState = { title: string; category: string; description: string; stack: string; demo: string; repo: string };

function toFormState(p?: ProjectRow): FormState {
  return {
    title: p?.title ?? '',
    category: p?.category ?? '',
    description: p?.description ?? '',
    stack: p?.stack.join(', ') ?? '',
    demo: p?.demo ?? '#',
    repo: p?.repo ?? '#',
  };
}

export default function ProjectForm({ project, onSaved, onCancel }: Props) {
  const [f, setF] = useState<FormState>(() => toFormState(project));
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);
  const isEdit = !!project;

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const stack = f.stack.split(',').map((s) => s.trim()).filter(Boolean);
    if (!f.title.trim() || !f.category.trim() || !f.description.trim() || stack.length === 0) {
      setErr('Title, category, description, and at least one stack tag are required.');
      return;
    }
    setErr('');
    setSaving(true);
    try {
      const url = isEdit ? `/api/admin/projects/${project!.id}` : '/api/admin/projects';
      const res = await fetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: f.title.trim(),
          category: f.category.trim(),
          description: f.description.trim(),
          stack,
          demo: f.demo.trim() || '#',
          repo: f.repo.trim() || '#',
        }),
      });
      const data: { project?: ProjectRow; error?: string } = await res.json().catch(() => ({}));
      if (!res.ok || !data.project) {
        setErr(data.error ?? 'Something went wrong. Please try again.');
        return;
      }
      onSaved(data.project);
    } catch {
      setErr('Could not reach the server. Check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 rounded-[28px] border border-[#D7E2EA]/15 p-6 sm:p-8">
      <div className="grid sm:grid-cols-2 gap-4">
        <input className="fld" placeholder="Title" value={f.title} onChange={set('title')} />
        <input className="fld" placeholder="Category (e.g. Project, Team, Client)" value={f.category} onChange={set('category')} />
      </div>
      <textarea className="fld" rows={3} placeholder="Description" value={f.description} onChange={set('description')} />
      <input className="fld" placeholder="Stack, comma-separated (e.g. TypeScript, Next.js, PostgreSQL)" value={f.stack} onChange={set('stack')} />
      <div className="grid sm:grid-cols-2 gap-4">
        <input className="fld" placeholder="Live demo URL (or #)" value={f.demo} onChange={set('demo')} />
        <input className="fld" placeholder="Repo URL (or #)" value={f.repo} onChange={set('repo')} />
      </div>
      {err && <div className="text-sm" style={{ color: '#ff5c7a' }}>{err}</div>}
      <div className="flex gap-3">
        <button type="submit" disabled={saving} className="cbtn rounded-full text-white font-medium uppercase tracking-widest px-8 py-3 text-sm disabled:opacity-60">
          {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Project'}
        </button>
        <button type="button" onClick={onCancel} className="chip">Cancel</button>
      </div>
    </form>
  );
}
