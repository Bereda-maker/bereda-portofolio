'use client';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, CheckCheck, ChevronDown, Copy, Inbox, Mail, MailOpen, Reply, Search, Trash2, X } from 'lucide-react';
import type { MessageRow } from '@/lib/schema';
import { fullDate, initials, timeAgo } from '@/lib/admin-format';
import { EmptyAdminState } from './AdminSetupState';
import { useConfirm, useToast } from './AdminUI';

type Filter = 'all' | 'unread' | 'read';

export default function MessagesList({ initialMessages }: { initialMessages: MessageRow[] }) {
  const router = useRouter();
  const confirm = useConfirm();
  const toast = useToast();

  const [rows, setRows] = useState<MessageRow[]>(initialMessages);
  const [openId, setOpenId] = useState<number | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [busyAll, setBusyAll] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');

  const unreadCount = rows.filter((r) => !r.read).length;
  const counts: Record<Filter, number> = { all: rows.length, unread: unreadCount, read: rows.length - unreadCount };

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => (filter === 'all' || (filter === 'unread' ? !r.read : r.read)) && (!q || `${r.name} ${r.email} ${r.message}`.toLowerCase().includes(q)));
  }, [rows, filter, query]);

  const patchRead = async (id: number, read: boolean, quiet = false) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/messages/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ read }) });
      const data: { message?: MessageRow; error?: string } = await res.json().catch(() => ({}));
      if (!res.ok || !data.message) { toast.error(data.error ?? 'Failed to update message.'); return; }
      setRows((prev) => prev.map((r) => (r.id === id ? data.message! : r)));
      if (!quiet) toast.success(read ? 'Marked as read' : 'Marked as unread');
      router.refresh(); // keeps the sidebar unread badge in sync
    } catch {
      toast.error('Could not reach the server. Check your connection and try again.');
    } finally {
      setBusyId(null);
    }
  };

  const toggleOpen = (m: MessageRow) => {
    const opening = openId !== m.id;
    setOpenId(opening ? m.id : null);
    if (opening && !m.read) void patchRead(m.id, true, true); // opening a message reads it
  };

  const remove = async (m: MessageRow) => {
    const ok = await confirm({ title: `Delete message from ${m.name}?`, body: 'This can’t be undone.', confirmLabel: 'Delete message', danger: true });
    if (!ok) return;
    setBusyId(m.id);
    try {
      const res = await fetch(`/api/admin/messages/${m.id}`, { method: 'DELETE' });
      const data: { ok?: true; error?: string } = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(data.error ?? 'Failed to delete message.'); return; }
      setRows((prev) => prev.filter((r) => r.id !== m.id));
      if (openId === m.id) setOpenId(null);
      toast.success('Message deleted');
      router.refresh();
    } catch {
      toast.error('Could not reach the server. Check your connection and try again.');
    } finally {
      setBusyId(null);
    }
  };

  const markAllRead = async () => {
    const unread = rows.filter((r) => !r.read).map((r) => r.id);
    if (unread.length === 0) return;
    setBusyAll(true);
    try {
      const results = await Promise.all(unread.map((id) => fetch(`/api/admin/messages/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ read: true }) }).then((res) => ({ ok: res.ok, id }))));
      const failed = new Set(results.filter((r) => !r.ok).map((r) => r.id));
      setRows((prev) => prev.map((r) => (unread.includes(r.id) && !failed.has(r.id) ? { ...r, read: true } : r)));
      if (failed.size > 0) toast.error(`${failed.size} message(s) could not be marked as read.`);
      else toast.success(`Marked ${unread.length} as read`);
      router.refresh();
    } catch {
      toast.error('Could not reach the server. Check your connection and try again.');
    } finally {
      setBusyAll(false);
    }
  };

  const copyEmail = async (email: string) => {
    try { await navigator.clipboard.writeText(email); toast.success('Email address copied'); } catch { toast.error('Couldn’t copy. Select the address and copy it manually.'); }
  };

  const TABS: { id: Filter; label: string }[] = [{ id: 'all', label: 'All' }, { id: 'unread', label: 'Unread' }, { id: 'read', label: 'Read' }];

  return (
    <div className="admin-stack">
      <div className="admin-toolbar">
        <div className="admin-search">
          <Search size={15} aria-hidden="true" />
          <input type="search" aria-label="Search messages" placeholder="Search by name, email or message" value={query} onChange={(e) => setQuery(e.target.value)} />
          {query && <button type="button" aria-label="Clear search" onClick={() => setQuery('')}><X size={14} /></button>}
        </div>
        <div className="admin-toolbar-controls">
          <div className="admin-segmented" role="tablist" aria-label="Filter messages">
            {TABS.map((t) => (
              <button key={t.id} type="button" role="tab" aria-selected={filter === t.id} className={filter === t.id ? 'active' : ''} onClick={() => setFilter(t.id)}>
                {t.label}<span>{counts[t.id]}</span>
              </button>
            ))}
          </div>
          <button type="button" onClick={markAllRead} disabled={busyAll || unreadCount === 0} className="admin-button-secondary"><CheckCheck size={15} aria-hidden="true" />{busyAll ? 'Marking…' : 'Mark all read'}</button>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="admin-card admin-empty-large">
          <span className="admin-empty-icon"><Inbox size={20} /></span>
          <h2>No messages yet</h2>
          <p>When someone sends a message through your contact form, it will land here.</p>
        </div>
      ) : visible.length === 0 ? (
        <EmptyAdminState icon={Search}>
          Nothing matches{query ? ` “${query}”` : ' this filter'}. <button type="button" className="admin-inline-link" onClick={() => { setQuery(''); setFilter('all'); }}>Show all messages</button>
        </EmptyAdminState>
      ) : (
        <ul className="admin-inbox">
          {visible.map((m) => {
            const open = openId === m.id;
            return (
              <li key={m.id} className={`admin-msg${m.read ? '' : ' unread'}${open ? ' open' : ''}`}>
                <button type="button" className="admin-msg-head" aria-expanded={open} aria-controls={`msg-${m.id}`} onClick={() => toggleOpen(m)}>
                  <span className="admin-avatar" aria-hidden="true">{initials(m.name)}</span>
                  <span className="admin-row-body">
                    <span className="admin-row-title"><strong>{m.name}</strong>{!m.read && <span className="admin-dot" aria-label="Unread" />}<span className="admin-row-email">{m.email}</span></span>
                    {!open && <span className="admin-row-sub">{m.message}</span>}
                  </span>
                  <time className="admin-row-meta" dateTime={new Date(m.createdAt).toISOString()} title={fullDate(m.createdAt)} suppressHydrationWarning>{timeAgo(m.createdAt)}</time>
                  <ChevronDown size={16} className="admin-chevron" aria-hidden="true" />
                </button>
                {open && (
                  <div id={`msg-${m.id}`} className="admin-msg-body">
                    <p className="admin-msg-meta" suppressHydrationWarning>Received {fullDate(m.createdAt)}</p>
                    <p className="admin-msg-text">{m.message}</p>
                    <div className="admin-actions">
                      <a href={`mailto:${m.email}?subject=${encodeURIComponent('Re: your message')}`} className="admin-button"><Reply size={15} aria-hidden="true" />Reply by email</a>
                      <button type="button" onClick={() => patchRead(m.id, !m.read)} disabled={busyId === m.id} className="admin-button-secondary">{m.read ? <Mail size={15} aria-hidden="true" /> : <MailOpen size={15} aria-hidden="true" />}{m.read ? 'Mark unread' : 'Mark read'}</button>
                      <button type="button" onClick={() => copyEmail(m.email)} className="admin-button-secondary"><Copy size={15} aria-hidden="true" />Copy email</button>
                      <button type="button" onClick={() => remove(m)} disabled={busyId === m.id} className="admin-button-secondary admin-button-quiet-danger"><Trash2 size={15} aria-hidden="true" />Delete</button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
