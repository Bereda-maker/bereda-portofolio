'use client';
import { useState } from 'react';
import { Plus, Pencil, Trash2, ExternalLink } from 'lucide-react';
import type { ProjectRow } from '@/lib/schema';
import ProjectForm from './ProjectForm';

export default function ProjectsTable({ initialProjects }: { initialProjects: ProjectRow[] }) {
  const [rows, setRows] = useState<ProjectRow[]>(initialProjects);
  const [editing, setEditing] = useState<ProjectRow | 'new' | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [err, setErr] = useState('');

  const onSaved = (p: ProjectRow) => {
    setRows((prev) => {
      const exists = prev.some((r) => r.id === p.id);
      return exists ? prev.map((r) => (r.id === p.id ? p : r)) : [...prev, p];
    });
    setEditing(null);
  };

  const remove = async (id: number) => {
    if (!confirm('Delete this project? This cannot be undone.')) return;
    setErr('');
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/projects/${id}`, { method: 'DELETE' });
      const data: { ok?: true; error?: string } = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(data.error ?? 'Failed to delete project.');
        return;
      }
      setRows((prev) => prev.filter((r) => r.id !== id));
    } catch {
      setErr('Could not reach the server. Check your connection and try again.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl sm:text-4xl font-black uppercase">Projects</h1>
        {editing === null && (
          <button onClick={() => setEditing('new')} className="cbtn rounded-full text-white font-medium uppercase tracking-widest px-6 py-3 text-sm inline-flex items-center gap-2">
            <Plus size={16} /> Add Project
          </button>
        )}
      </div>

      {err && <div className="text-sm" style={{ color: '#ff5c7a' }}>{err}</div>}

      {editing === 'new' && <ProjectForm onSaved={onSaved} onCancel={() => setEditing(null)} />}
      {editing && editing !== 'new' && <ProjectForm project={editing} onSaved={onSaved} onCancel={() => setEditing(null)} />}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left uppercase tracking-widest text-xs opacity-50 border-b border-[#D7E2EA]/15">
              <th className="py-3 pr-4">Title</th>
              <th className="py-3 pr-4">Category</th>
              <th className="py-3 pr-4">Stack</th>
              <th className="py-3 pr-4">Links</th>
              <th className="py-3 pr-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} className="border-b border-[#D7E2EA]/10">
                <td className="py-3 pr-4 font-medium">{p.title}</td>
                <td className="py-3 pr-4 opacity-70">{p.category}</td>
                <td className="py-3 pr-4 opacity-70">{p.stack.join(', ')}</td>
                <td className="py-3 pr-4">
                  <div className="flex gap-3">
                    {p.demo !== '#' && <a href={p.demo} target="_blank" rel="noopener noreferrer" className="hover:opacity-70" title="Live demo"><ExternalLink size={14} /></a>}
                    {p.repo !== '#' && <a href={p.repo} target="_blank" rel="noopener noreferrer" className="hover:opacity-70" title="Repository"><ExternalLink size={14} /></a>}
                  </div>
                </td>
                <td className="py-3 pr-4">
                  <div className="flex justify-end gap-3">
                    <button onClick={() => setEditing(p)} className="hover:opacity-70" title="Edit"><Pencil size={16} /></button>
                    <button onClick={() => remove(p.id)} disabled={deletingId === p.id} className="hover:opacity-70 disabled:opacity-40" title="Delete"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={5} className="py-8 text-center opacity-50">No projects yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
