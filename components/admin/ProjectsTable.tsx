'use client';
import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ArrowDownUp, ExternalLink, FolderKanban, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import type { ProjectRow } from '@/lib/schema';
import { plural } from '@/lib/admin-format';
import { EmptyAdminState } from './AdminSetupState';
import { useConfirm, useToast } from './AdminUI';
import ProjectForm from './ProjectForm';

type Sort = 'newest' | 'oldest' | 'title';

export default function ProjectsTable({ initialProjects }: { initialProjects: ProjectRow[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const confirm = useConfirm();
  const toast = useToast();

  const [rows, setRows] = useState<ProjectRow[]>(initialProjects);
  const [editing, setEditing] = useState<ProjectRow | 'new' | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState<Sort>('newest');

  // Deep link from the dashboard / command palette: /admin/projects?new=1
  useEffect(() => {
    if (params.get('new') === '1') {
      setEditing('new');
      router.replace(pathname, { scroll: false });
    }
  }, [params, pathname, router]);

  const categories = useMemo(() => Array.from(new Set(rows.map((r) => r.category))).sort((a, b) => a.localeCompare(b)), [rows]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = rows.filter((r) => (category === 'all' || r.category === category) && (!q || `${r.title} ${r.category} ${r.description} ${r.stack.join(' ')}`.toLowerCase().includes(q)));
    return [...filtered].sort((a, b) => {
      if (sort === 'title') return a.title.localeCompare(b.title);
      const diff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return sort === 'newest' ? diff || b.id - a.id : -diff || a.id - b.id;
    });
  }, [rows, query, category, sort]);

  const onSaved = (p: ProjectRow) => {
    setRows((prev) => (prev.some((r) => r.id === p.id) ? prev.map((r) => (r.id === p.id ? p : r)) : [...prev, p]));
    setEditing(null);
    router.refresh();
  };

  const remove = async (project: ProjectRow) => {
    const ok = await confirm({ title: `Delete “${project.title}”?`, body: 'It will be removed from your public site. This can’t be undone.', confirmLabel: 'Delete project', danger: true });
    if (!ok) return;
    setDeletingId(project.id);
    try {
      const res = await fetch(`/api/admin/projects/${project.id}`, { method: 'DELETE' });
      const data: { ok?: true; error?: string } = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(data.error ?? 'Failed to delete project.'); return; }
      setRows((prev) => prev.filter((r) => r.id !== project.id));
      toast.success('Project deleted');
      router.refresh();
    } catch {
      toast.error('Could not reach the server. Check your connection and try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const filtering = query.trim() !== '' || category !== 'all';
  const clearFilters = () => { setQuery(''); setCategory('all'); };

  return (
    <div className="admin-stack">
      <div className="admin-toolbar">
        <div className="admin-search">
          <Search size={15} aria-hidden="true" />
          <input type="search" aria-label="Search projects" placeholder="Search by title, tech or description" value={query} onChange={(e) => setQuery(e.target.value)} />
          {query && <button type="button" aria-label="Clear search" onClick={() => setQuery('')}><X size={14} /></button>}
        </div>
        <div className="admin-toolbar-controls">
          {categories.length > 1 && (
            <select className="admin-select" aria-label="Filter by category" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="all">All categories</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
          <label className="admin-select-wrap"><ArrowDownUp size={14} aria-hidden="true" />
            <select className="admin-select" aria-label="Sort projects" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="title">Title A–Z</option>
            </select>
          </label>
          <button type="button" onClick={() => setEditing('new')} className="admin-button"><Plus size={15} aria-hidden="true" />Add project</button>
        </div>
      </div>

      <p className="admin-count" aria-live="polite">{filtering ? `${visible.length} of ${plural(rows.length, 'project')}` : plural(rows.length, 'project')}</p>

      {rows.length === 0 ? (
        <div className="admin-card admin-empty-large">
          <span className="admin-empty-icon"><FolderKanban size={20} /></span>
          <h2>No projects yet</h2>
          <p>Add your first project and it will appear on your public portfolio.</p>
          <button type="button" onClick={() => setEditing('new')} className="admin-button"><Plus size={15} aria-hidden="true" />Add your first project</button>
        </div>
      ) : visible.length === 0 ? (
        <EmptyAdminState icon={Search}>
          No projects match your filters. <button type="button" className="admin-inline-link" onClick={clearFilters}>Clear filters</button>
        </EmptyAdminState>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <caption className="sr-only">Projects</caption>
            <thead>
              <tr><th scope="col">Project</th><th scope="col">Technologies</th><th scope="col">Links</th><th scope="col" className="admin-th-actions"><span className="sr-only">Actions</span></th></tr>
            </thead>
            <tbody>
              {visible.map((p) => (
                <tr key={p.id}>
                  <td className="admin-td-main">
                    <button type="button" className="admin-cell-title" onClick={() => setEditing(p)}>{p.title}</button>
                    <div className="admin-cell-sub"><span className="admin-badge">{p.category}</span><span>{p.description}</span></div>
                  </td>
                  <td data-label="Technologies">
                    <div className="admin-chips">
                      {p.stack.slice(0, 3).map((s) => <span key={s} className="admin-tag static">{s}</span>)}
                      {p.stack.length > 3 && <span className="admin-tag static muted" title={p.stack.slice(3).join(', ')}>+{p.stack.length - 3}</span>}
                    </div>
                  </td>
                  <td data-label="Links">
                    <div className="admin-links">
                      {p.demo !== '#' ? <a href={p.demo} target="_blank" rel="noopener noreferrer">Demo <ExternalLink size={12} aria-hidden="true" /></a> : <span className="admin-muted-dash" title="No demo link">—</span>}
                      {p.repo !== '#' ? <a href={p.repo} target="_blank" rel="noopener noreferrer">Repo <ExternalLink size={12} aria-hidden="true" /></a> : null}
                    </div>
                  </td>
                  <td className="admin-td-actions">
                    <div className="admin-row-actions">
                      <button type="button" className="admin-icon-btn" onClick={() => setEditing(p)} aria-label={`Edit ${p.title}`} title="Edit"><Pencil size={15} /></button>
                      <button type="button" className="admin-icon-btn danger" onClick={() => remove(p)} disabled={deletingId === p.id} aria-label={`Delete ${p.title}`} title="Delete"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && <ProjectForm key={editing === 'new' ? 'new' : editing.id} project={editing === 'new' ? undefined : editing} onSaved={onSaved} onCancel={() => setEditing(null)} />}
    </div>
  );
}
