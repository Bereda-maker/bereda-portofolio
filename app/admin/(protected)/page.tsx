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
    <div className="rounded-[28px] border border-[#D7E2EA]/15 p-6 sm:p-8">
      <div className="text-4xl sm:text-5xl font-black">{value}</div>
      <div className="uppercase tracking-widest text-sm opacity-60 mt-2">{label}</div>
    </div>
  );
}

export default async function AdminDashboard() {
  const { projectCount, messageCount, unreadCount, recent, dbError } = await getDashboardData();

  return (
    <div className="flex flex-col gap-10">
      <h1 className="text-3xl sm:text-4xl font-black uppercase">Dashboard</h1>

      {dbError && (
        <div className="rounded-2xl border border-[#ff5c7a]/40 text-[#ff5c7a] px-5 py-4 text-sm">
          Could not reach the database. Check that <code>DATABASE_URL</code> is set correctly and migrations have been applied.
        </div>
      )}

      <div className="grid sm:grid-cols-3 gap-5">
        <StatCard label="Projects" value={projectCount} />
        <StatCard label="Messages" value={messageCount} />
        <StatCard label="Unread" value={unreadCount} />
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/admin/projects" className="cbtn rounded-full text-white font-medium uppercase tracking-widest px-8 py-3 text-sm">Manage Projects</Link>
        <Link href="/admin/messages" className="rounded-full border-2 border-[#D7E2EA] font-medium uppercase tracking-widest px-8 py-3 text-sm hover:bg-[#D7E2EA]/10 transition">
          {unreadCount > 0 ? `View ${unreadCount} Unread Message${unreadCount === 1 ? '' : 's'}` : 'View Messages'}
        </Link>
      </div>

      <div>
        <h2 className="uppercase tracking-widest text-sm opacity-60 mb-4">Recent Messages</h2>
        {recent.length === 0 ? (
          <p className="opacity-50 text-sm">No messages yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {recent.map((m) => (
              <Link
                key={m.id}
                href="/admin/messages"
                className="block rounded-2xl border border-[#D7E2EA]/15 px-5 py-4 hover:border-[#D7E2EA]/40 transition"
                style={{ borderLeft: m.read ? undefined : '3px solid #B600A8' }}
              >
                <div className="flex justify-between gap-4 text-sm">
                  <span className="font-medium">{m.name} · <span className="opacity-60">{m.email}</span></span>
                  <span className="opacity-50 whitespace-nowrap">{new Date(m.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="opacity-70 text-sm mt-1 line-clamp-1">{m.message}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
