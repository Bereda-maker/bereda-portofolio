import Link from 'next/link';
import { and, asc, desc, eq, gte, ne, sql } from 'drizzle-orm';
import { ArrowUpRight, CalendarClock, CheckCircle2, FolderKanban, Mail, MailOpen, Plus, AlertTriangle, type LucideIcon } from 'lucide-react';
import { AdminPageHeader, EmptyAdminState } from '@/components/admin/AdminSetupState';
import { fullDate, initials, plural, timeAgo } from '@/lib/admin-format';

export const metadata = { title: 'Dashboard -- Admin' };
export const dynamic = 'force-dynamic';

type RecentMessage = { id: number; name: string; email: string; message: string; read: boolean; createdAt: Date };
type RecentProject = { id: number; title: string; category: string; stack: string[]; createdAt: Date };
type Upcoming = { id: number; attendeeName: string; startsAt: Date; status: string };

const DAYS = 14;

async function getCore() {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
    const { db } = await import('@/lib/db');
    const { projects, messages } = await import('@/lib/schema');
    const since = new Date(Date.now() - DAYS * 24 * 60 * 60 * 1000);

    const [[projectCount], [messageCount], [unreadCount], recent, recentProjects, windowRows] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(projects),
      db.select({ count: sql<number>`count(*)::int` }).from(messages),
      db.select({ count: sql<number>`count(*)::int` }).from(messages).where(eq(messages.read, false)),
      db.select().from(messages).orderBy(desc(messages.createdAt)).limit(5),
      db.select({ id: projects.id, title: projects.title, category: projects.category, stack: projects.stack, createdAt: projects.createdAt }).from(projects).orderBy(desc(projects.createdAt)).limit(4),
      db.select({ createdAt: messages.createdAt }).from(messages).where(gte(messages.createdAt, since)),
    ]);

    // Bucket the last 14 days (UTC) so the chart is real data, never filler.
    const buckets: { key: string; label: string; count: number }[] = [];
    for (let i = DAYS - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      buckets.push({ key: d.toISOString().slice(0, 10), label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }), count: 0 });
    }
    for (const row of windowRows) {
      const bucket = buckets.find((b) => b.key === new Date(row.createdAt).toISOString().slice(0, 10));
      if (bucket) bucket.count += 1;
    }

      return {
      ok: true as const,
      projectCount: projectCount?.count ?? 0,
      messageCount: messageCount?.count ?? 0,
      unreadCount: unreadCount?.count ?? 0,
      recent: recent as RecentMessage[],
      recentProjects: recentProjects as RecentProject[],
      buckets,
    };
    } catch (err) {
      console.error(`[admin/dashboard] Database read failed (attempt ${attempt + 1}/2):`, err instanceof Error ? err.message : err);
      if (attempt === 0) await new Promise((resolve) => setTimeout(resolve, 150));
    }
  }
  return { ok: false as const, projectCount: 0, messageCount: 0, unreadCount: 0, recent: [] as RecentMessage[], recentProjects: [] as RecentProject[], buckets: [] as { key: string; label: string; count: number }[] };
}

// Scheduling tables arrive via a separate migration, so failures here must not
// take the rest of the dashboard down.
async function getScheduling(): Promise<{ available: boolean; upcoming: Upcoming[]; calendarConnected: boolean }> {
  try {
    const { db } = await import('@/lib/db');
    const { appointments, calendarConnections } = await import('@/lib/schema');
    const [upcoming, connections] = await Promise.all([
      db.select({ id: appointments.id, attendeeName: appointments.attendeeName, startsAt: appointments.startsAt, status: appointments.status })
        .from(appointments).where(and(gte(appointments.startsAt, new Date()), ne(appointments.status, 'cancelled'))).orderBy(asc(appointments.startsAt)).limit(4),
      db.select({ id: calendarConnections.id }).from(calendarConnections).where(and(eq(calendarConnections.provider, 'google'), eq(calendarConnections.status, 'connected'))).limit(1),
    ]);
    return { available: true, upcoming, calendarConnected: connections.length > 0 };
  } catch {
    return { available: false, upcoming: [], calendarConnected: false };
  }
}

function Stat({ label, value, note, href, tone, icon: Icon }: { label: string; value: number | string; note: string; href: string; tone?: 'attention'; icon: LucideIcon }) {
  return (
    <Link href={href} className={`admin-card admin-stat${tone === 'attention' ? ' attention' : ''}`}>
      <span className="admin-stat-top"><span className="admin-stat-label">{label}</span><Icon size={16} /></span>
      <span className="admin-stat-value">{value}</span>
      <span className="admin-stat-note">{note}</span>
    </Link>
  );
}

function ActivityChart({ buckets }: { buckets: { key: string; label: string; count: number }[] }) {
  const total = buckets.reduce((sum, b) => sum + b.count, 0);
  const max = Math.max(1, ...buckets.map((b) => b.count));
  const todayKey = new Date().toISOString().slice(0, 10);
  return (
    <section className="admin-card admin-panel">
      <div className="admin-panel-head">
        <div><h2>Message activity</h2><p>{total === 0 ? `No messages in the last ${DAYS} days` : `${plural(total, 'message')} in the last ${DAYS} days`}</p></div>
      </div>
      <div className="admin-chart" role="img" aria-label={`Messages per day over the last ${DAYS} days: ${buckets.map((b) => `${b.label} ${b.count}`).join(', ')}`}>
        {buckets.map((b) => (
          <div key={b.key} className="admin-chart-col" title={`${b.label}: ${plural(b.count, 'message')}`}>
            <div className="admin-chart-track"><div className={`admin-chart-bar${b.key === todayKey ? ' today' : ''}${b.count === 0 ? ' zero' : ''}`} style={{ height: `${b.count === 0 ? 4 : Math.max(10, (b.count / max) * 100)}%` }} /></div>
          </div>
        ))}
      </div>
      <div className="admin-chart-axis" aria-hidden="true"><span>{buckets[0]?.label}</span><span>Today</span></div>
    </section>
  );
}

export default async function AdminDashboard() {
  const [core, scheduling] = await Promise.all([getCore(), getScheduling()]);
  const { projectCount, messageCount, unreadCount, recent, recentProjects, buckets } = core;
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const health = [
    { label: 'Database', ok: core.ok, detail: core.ok ? 'Connected' : 'Unreachable' },
    { label: 'Admin session', ok: Boolean(process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 32), detail: 'Session secret' },
    { label: 'Google Calendar', ok: scheduling.calendarConnected, detail: scheduling.calendarConnected ? 'Connected' : 'Not connected' },
  ];

  return (
    <div className="admin-page">
      <AdminPageHeader
        eyebrow={today}
        title="Dashboard"
        description={unreadCount > 0 ? `You have ${plural(unreadCount, 'unread message')} waiting for a reply.` : 'You’re all caught up. New messages and bookings will show up here.'}
        actions={<><Link href="/admin/projects?new=1" className="admin-button"><Plus size={15} aria-hidden="true" />New project</Link><Link href="/admin/messages" className="admin-button-secondary">Open inbox</Link></>}
      />

      {!core.ok && (
        <div className="admin-error" role="alert">
          <AlertTriangle size={16} aria-hidden="true" />
          <span>Could not reach the database. Check that <code>DATABASE_URL</code> is set correctly and migrations have been applied.</span>
        </div>
      )}

      <div className="admin-stat-grid">
        <Stat label="Unread" value={unreadCount} note={unreadCount > 0 ? 'Needs a reply' : 'Inbox is clear'} href="/admin/messages" tone={unreadCount > 0 ? 'attention' : undefined} icon={MailOpen} />
        <Stat label="Messages" value={messageCount} note={`${plural(buckets.reduce((s, b) => s + b.count, 0), 'new message')} in ${DAYS} days`} href="/admin/messages" icon={Mail} />
        <Stat label="Projects" value={projectCount} note="Published on your site" href="/admin/projects" icon={FolderKanban} />
        <Stat label="Upcoming" value={scheduling.available ? scheduling.upcoming.length : '–'} note={scheduling.available ? (scheduling.upcoming.length ? 'Next bookings' : 'Nothing scheduled') : 'Scheduling not set up'} href="/admin/appointments" icon={CalendarClock} />
      </div>

      <div className="admin-dash-grid">
        <div className="admin-dash-main">
          <ActivityChart buckets={buckets} />

          <section className="admin-card admin-panel">
            <div className="admin-panel-head"><div><h2>Recent messages</h2></div><Link href="/admin/messages" className="admin-link">View all <ArrowUpRight size={13} aria-hidden="true" /></Link></div>
            {recent.length === 0 ? (
              <EmptyAdminState>No messages yet. When someone uses your contact form, it appears here.</EmptyAdminState>
            ) : (
              <ul className="admin-rows">
                {recent.map((m) => (
                  <li key={m.id}>
                    <Link href="/admin/messages" className={`admin-row${m.read ? '' : ' unread'}`}>
                      <span className="admin-avatar" aria-hidden="true">{initials(m.name)}</span>
                      <span className="admin-row-body">
                        <span className="admin-row-title"><strong>{m.name}</strong>{!m.read && <span className="admin-dot" aria-label="Unread" />}</span>
                        <span className="admin-row-sub">{m.message}</span>
                      </span>
                      <time className="admin-row-meta" dateTime={new Date(m.createdAt).toISOString()} title={fullDate(m.createdAt)} suppressHydrationWarning>{timeAgo(m.createdAt)}</time>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="admin-dash-side">
          <section className="admin-card admin-panel">
            <div className="admin-panel-head"><div><h2>Next up</h2></div><Link href="/admin/appointments" className="admin-link">Calendar <ArrowUpRight size={13} aria-hidden="true" /></Link></div>
            {scheduling.upcoming.length === 0 ? (
              <EmptyAdminState icon={CalendarClock}>{scheduling.available ? 'No upcoming bookings.' : 'Scheduling tables aren’t available yet.'}</EmptyAdminState>
            ) : (
              <ul className="admin-rows compact">
                {scheduling.upcoming.map((a) => {
                  const d = new Date(a.startsAt);
                  return (
                    <li key={a.id} className="admin-event">
                      <span className="admin-date-tile" aria-hidden="true"><small>{d.toLocaleDateString('en-US', { month: 'short' })}</small><b>{d.getDate()}</b></span>
                      <span className="admin-row-body"><span className="admin-row-title"><strong>{a.attendeeName}</strong></span><span className="admin-row-sub">{d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} · {a.status}</span></span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="admin-card admin-panel">
            <div className="admin-panel-head"><div><h2>System status</h2></div><Link href="/admin/settings" className="admin-link">Settings <ArrowUpRight size={13} aria-hidden="true" /></Link></div>
            <ul className="admin-health">
              {health.map((h) => (
                <li key={h.label}>
                  {h.ok ? <CheckCircle2 size={16} className="ok" aria-hidden="true" /> : <AlertTriangle size={16} className="warn" aria-hidden="true" />}
                  <span>{h.label}</span>
                  <small>{h.detail}</small>
                </li>
              ))}
            </ul>
          </section>

          <section className="admin-card admin-panel">
            <div className="admin-panel-head"><div><h2>Latest projects</h2></div><Link href="/admin/projects" className="admin-link">Manage <ArrowUpRight size={13} aria-hidden="true" /></Link></div>
            {recentProjects.length === 0 ? (
              <EmptyAdminState icon={FolderKanban}>No projects yet.</EmptyAdminState>
            ) : (
              <ul className="admin-rows compact">
                {recentProjects.map((p) => (
                  <li key={p.id} className="admin-event">
                    <span className="admin-row-body"><span className="admin-row-title"><strong>{p.title}</strong></span><span className="admin-row-sub">{p.category} · {p.stack.slice(0, 3).join(', ')}</span></span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
