import { desc } from 'drizzle-orm';
import MessagesList from '@/components/admin/MessagesList';
import type { MessageRow } from '@/lib/schema';

export const metadata = { title: 'Messages -- Admin' };
export const dynamic = 'force-dynamic';

async function loadMessages(): Promise<{ rows: MessageRow[]; dbError: boolean }> {
  try {
    const { db } = await import('@/lib/db');
    const { messages } = await import('@/lib/schema');
    const rows = await db.select().from(messages).orderBy(desc(messages.createdAt));
    return { rows, dbError: false };
  } catch (err) {
    console.error('[admin/messages page] Failed to load messages:', err instanceof Error ? err.message : err);
    return { rows: [], dbError: true };
  }
}

export default async function AdminMessagesPage() {
  const { rows, dbError } = await loadMessages();
  return (
    <div className="flex flex-col gap-6">
      {dbError && (
        <div className="rounded-2xl border border-[#ff5c7a]/40 text-[#ff5c7a] px-5 py-4 text-sm">
          Could not reach the database. Check that <code>DATABASE_URL</code> is set correctly and migrations have been applied.
        </div>
      )}
      <MessagesList initialMessages={rows} />
    </div>
  );
}
