'use client';

import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, RefreshCw, Search } from 'lucide-react';

type Event = { id: number; actorType: string; actorId: string | null; action: string; entityType: string; entityId: string | null; before: Record<string, unknown> | null; after: Record<string, unknown> | null; requestId: string | null; createdAt: string };
type Result = { events: Event[]; total: number; page: number; limit: number; pages: number; actions: string[]; entityTypes: string[] };
function displaySnapshot(value: Record<string, unknown> | null) { return value ? JSON.stringify(value, null, 2) : '—'; }
function date(value: string) { return new Date(value).toLocaleString(); }

export default function AuditWorkspace() {
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [action, setAction] = useState('');
  const [entityType, setEntityType] = useState('');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');

  const load = useCallback(async (targetPage: number, filters: { action: string; entityType: string; query: string }) => {
    setLoading(true);
    setError('');
    const params = new URLSearchParams({ page: String(targetPage), limit: '25' });
    if (filters.action) params.set('action', filters.action);
    if (filters.entityType) params.set('entityType', filters.entityType);
    if (filters.query) params.set('q', filters.query);
    try {
      const response = await fetch(`/api/admin/audit?${params}`, { cache: 'no-store' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Audit events could not be loaded.');
      setResult(data as Result);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Audit events could not be loaded.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(page, { action, entityType, query }); }, [page, action, entityType, query, load]);
  function applyFilters(event: React.FormEvent) { event.preventDefault(); setPage(1); setQuery(search.trim()); }
  function resetFilters() { setAction(''); setEntityType(''); setSearch(''); setQuery(''); setPage(1); }

  return <div className="grid gap-5">
    <div className="admin-notice text-sm">Audit events record selected admin actions and redact sensitive fields. Coverage is being added to mutation workflows; this is not a complete record of every read, login, provider event, or database change. No IP addresses are stored.</div>
    {error && <div className="admin-error">{error}</div>}
    <form onSubmit={applyFilters} className="admin-card grid gap-3 p-4 md:grid-cols-[1fr_190px_190px_auto_auto] md:items-end">
      <label className="grid gap-1 text-sm"><span className="admin-eyebrow">Search</span><span className="relative"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--admin-muted)]" /><input className="fld pl-9" placeholder="Action, entity, or ID" maxLength={160} value={search} onChange={(event) => setSearch(event.target.value)} /></span></label>
      <label className="grid gap-1 text-sm"><span className="admin-eyebrow">Action</span><select className="fld" value={action} onChange={(event) => { setAction(event.target.value); setPage(1); }}><option value="">All actions</option>{(result?.actions || []).map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
      <label className="grid gap-1 text-sm"><span className="admin-eyebrow">Entity</span><select className="fld" value={entityType} onChange={(event) => { setEntityType(event.target.value); setPage(1); }}><option value="">All entities</option>{(result?.entityTypes || []).map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
      <button className="admin-button" type="submit"><Search size={14} /> Search</button>
      <button className="admin-button-secondary" type="button" onClick={resetFilters}>Clear</button>
    </form>
    <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-[color:var(--admin-muted)]">{result ? `${result.total.toLocaleString()} event${result.total === 1 ? '' : 's'}` : 'Audit activity'} · newest first</p><button className="admin-button-secondary" type="button" disabled={loading} onClick={() => { void load(page, { action, entityType, query }); }}><RefreshCw size={14} /> Refresh</button></div>
    {loading && !result ? <div className="admin-card p-5 text-sm text-[color:var(--admin-muted)]">Loading audit log…</div> : null}
    {result?.events.length ? <div className="grid gap-3">{result.events.map((event) => <article key={event.id} className="admin-card p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><span className="chip on">{event.action}</span><span className="chip">{event.entityType}{event.entityId ? ` #${event.entityId}` : ''}</span></div><p className="mt-2 text-sm text-[color:var(--admin-muted)]">{date(event.createdAt)} · {event.actorType}{event.actorId ? ` (${event.actorId})` : ''}</p></div>{event.requestId && <span className="text-xs text-[color:var(--admin-muted)]">Request {event.requestId}</span>}</div>
      {(event.before || event.after) && <details className="mt-4 border-t border-[color:var(--admin-border)] pt-3"><summary className="cursor-pointer text-sm font-medium">Change details <span className="font-normal text-[color:var(--admin-muted)]">(sensitive values redacted)</span></summary><div className="mt-3 grid gap-3 md:grid-cols-2"><div><p className="admin-eyebrow">Before</p><pre className="mt-1 max-h-64 overflow-auto rounded-lg bg-[color:var(--admin-surface-muted)] p-3 text-xs">{displaySnapshot(event.before)}</pre></div><div><p className="admin-eyebrow">After</p><pre className="mt-1 max-h-64 overflow-auto rounded-lg bg-[color:var(--admin-surface-muted)] p-3 text-xs">{displaySnapshot(event.after)}</pre></div></div></details>}
    </article>)}</div> : result && <div className="admin-card p-6 text-center text-sm text-[color:var(--admin-muted)]">{result.total ? 'No events match these filters.' : 'No audit events recorded yet. Events will appear here as covered admin workflows are used.'}</div>}
    {result && result.pages > 1 && <nav className="flex items-center justify-between" aria-label="Audit log pages"><button className="admin-button-secondary" disabled={page <= 1 || loading} onClick={() => setPage((value) => Math.max(1, value - 1))}><ChevronLeft size={14} /> Previous</button><span className="text-sm text-[color:var(--admin-muted)]">Page {result.page} of {result.pages}</span><button className="admin-button-secondary" disabled={page >= result.pages || loading} onClick={() => setPage((value) => Math.min(result.pages, value + 1))}>Next <ChevronRight size={14} /></button></nav>}
  </div>;
}
