'use client';
import { useState } from 'react';
import { Trash2, Mail, MailOpen, ChevronDown, CheckCheck } from 'lucide-react';
import type { MessageRow } from '@/lib/schema';

export default function MessagesList({ initialMessages }: { initialMessages: MessageRow[] }) {
  const [rows, setRows] = useState<MessageRow[]>(initialMessages);
  const [openId, setOpenId] = useState<number | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [busyAll, setBusyAll] = useState(false);
  const [err, setErr] = useState('');

  const unreadCount = rows.filter((r) => !r.read).length;

  const setRead = async (id: number, read: boolean) => {
    setErr('');
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/messages/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read }),
      });
      const data: { message?: MessageRow; error?: string } = await res.json().catch(() => ({}));
      if (!res.ok || !data.message) {
        setErr(data.error ?? 'Failed to update message.');
        return;
      }
      setRows((prev) => prev.map((r) => (r.id === id ? data.message! : r)));
    } catch {
      setErr('Could not reach the server. Check your connection and try again.');
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (id: number) => {
    if (!confirm('Delete this message? This cannot be undone.')) return;
    setErr('');
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/messages/${id}`, { method: 'DELETE' });
      const data: { ok?: true; error?: string } = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(data.error ?? 'Failed to delete message.');
        return;
      }
      setRows((prev) => prev.filter((r) => r.id !== id));
      if (openId === id) setOpenId(null);
    } catch {
      setErr('Could not reach the server. Check your connection and try again.');
    } finally {
      setBusyId(null);
    }
  };

  const markAllRead = async () => {
    const unread = rows.filter((r) => !r.read).map((r) => r.id);
    if (unread.length === 0) return;
    setErr('');
    setBusyAll(true);
    try {
      const results = await Promise.all(
        unread.map((id) =>
          fetch(`/api/admin/messages/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ read: true }),
          }).then((res) => res.json().then((data) => ({ ok: res.ok, id, data })))
        )
      );
      const failed = results.filter((r) => !r.ok);
      setRows((prev) => prev.map((r) => (unread.includes(r.id) ? { ...r, read: true } : r)));
      if (failed.length > 0) setErr(`${failed.length} message(s) could not be marked read.`);
    } catch {
      setErr('Could not reach the server. Check your connection and try again.');
    } finally {
      setBusyAll(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-3xl sm:text-4xl font-black uppercase">Messages</h1>
        <button onClick={markAllRead} disabled={busyAll || unreadCount === 0} className="chip inline-flex items-center gap-2 disabled:opacity-40">
          <CheckCheck size={14} /> {busyAll ? 'Marking…' : `Mark all read${unreadCount ? ` (${unreadCount})` : ''}`}
        </button>
      </div>

      {err && <div className="text-sm" style={{ color: '#ff5c7a' }}>{err}</div>}

      <div className="flex flex-col gap-3">
        {rows.map((m) => {
          const open = openId === m.id;
          return (
            <div
              key={m.id}
              className="rounded-2xl border border-[#D7E2EA]/15 overflow-hidden"
              style={{ borderLeft: m.read ? undefined : '3px solid #B600A8' }}
            >
              <button type="button" onClick={() => setOpenId(open ? null : m.id)} className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium truncate">{m.name}</span>
                    <span className="opacity-50 truncate">{m.email}</span>
                  </div>
                  {!open && <p className="opacity-60 text-sm mt-1 line-clamp-1">{m.message}</p>}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="opacity-40 text-xs whitespace-nowrap hidden sm:inline">{new Date(m.createdAt).toLocaleString()}</span>
                  <ChevronDown size={16} className="transition-transform" style={{ transform: open ? 'rotate(180deg)' : undefined }} />
                </div>
              </button>
              {open && (
                <div className="px-5 pb-5 flex flex-col gap-4">
                  <p className="whitespace-pre-wrap text-sm opacity-80 leading-relaxed">{m.message}</p>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => setRead(m.id, !m.read)}
                      disabled={busyId === m.id}
                      className="chip inline-flex items-center gap-2 disabled:opacity-40"
                    >
                      {m.read ? <Mail size={14} /> : <MailOpen size={14} />} {m.read ? 'Mark unread' : 'Mark read'}
                    </button>
                    <button onClick={() => remove(m.id)} disabled={busyId === m.id} className="chip inline-flex items-center gap-2 disabled:opacity-40">
                      <Trash2 size={14} /> Delete
                    </button>
                    <a href={`mailto:${m.email}`} className="chip inline-flex items-center gap-2">Reply by email</a>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {rows.length === 0 && <p className="opacity-50 text-sm">No messages yet.</p>}
      </div>
    </div>
  );
}
