import Link from 'next/link';
import { desc, eq, sql } from 'drizzle-orm';

export const metadata = { title: 'Dashboard -- Admin' };
export const dynamic = 'force-dynamic';

type RecentMessage = { id: number; name: string; email: string; message: string; read: boolean; createdAt: Date };

async function getDashboardData() {
  try {
    const { db } = await import('@/lib/db');
    const { projects, messages } = await import('@/lib/schema');

    const [[projectCount], [messageCount], [unreadCount], recent] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(projects),
      db.select({ count: sql<number>`count(*)::int` }).from(messages),
      db.select({ count: sql<number>`count(*)::int` }).from(messages).where(eq(messages.read, false)),
      db.select().from(messages).orderBy(desc(messages.createdAt)).limit(5),
    ]);

    return {
      projectCount: projectCount?.count ?? 0,
      messageCount: messageCount?.count ?? 0,
      unreadCount: unreadCount?.count ?? 0,
      recent: recent as RecentMessage[],
      dbError: false,
    };
  } catch (err) {
    console.error('[admin/dashboard] Failed to load dashboard data:', err instanceof Error ? err.message : err);
    return { projectCount: 0, messageCount: 0, unreadCount: 0, recent: [] as RecentMessage[], dbError: true };
  }
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="admin-card admin-stat">
      <div className="admin-stat-label">{label}</div>
      <div className="admin-stat-value">{value}</div>
      <span className="admin-stat-accent" aria-hidden="true" />
    </div>
  );
}

export default async function AdminDashboard() {
  const { projectCount, messageCount, unreadCount, recent, dbError } = await getDashboardData();

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <div><p className="admin-eyebrow">Overview / Today</p><h1 className="admin-title">Dashboard</h1><p className="admin-description">A clear view of your portfolio activity, incoming conversations, and the work currently published on the site.</p></div>
        <div className="admin-actions"><Link href="/admin/projects" className="admin-button">Manage projects</Link><Link href="/admin/messages" className="admin-button-secondary">Open inbox</Link></div>
      </header>

      {dbError && (
        <div className="admin-error">
          Could not reach the database. Check that <code>DATABASE_URL</code> is set correctly and migrations have been applied.
        </div>
      )}

      <div className="admin-stat-grid">
        <StatCard label="Projects" value={projectCount} />
        <StatCard label="Messages" value={messageCount} />
        <StatCard label="Unread" value={unreadCount} />
      </div>

      <section>
        <div className="admin-section-heading"><span>Recent messages</span><Link href="/admin/messages" className="text-[.68rem] text-[#7da3ff] hover:underline">View all ↗</Link></div>
        {recent.length === 0 ? (
          <div className="admin-card px-5 py-8 text-sm text-[#aebedd]">No messages yet.</div>
        ) : (
          <div className="admin-list">
            {recent.map((m) => (
              <Link
                key={m.id}
                href="/admin/messages"
                className={`admin-list-item${m.read ? '' : ' unread'}`}
              >
                <div className="flex justify-between gap-4 text-sm"><span className="font-semibold">{m.name} <span className="text-[#aebedd]">· {m.email}</span></span><span className="whitespace-nowrap text-[#aebedd]">{new Date(m.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="mt-1 line-clamp-1 text-sm text-[#aebedd]">{m.message}</p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
