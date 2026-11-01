import { desc } from 'drizzle-orm';
import { AlertTriangle } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminSetupState';
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
    <div className="admin-page">
      <AdminPageHeader eyebrow="People & scheduling" title="Messages" description="Everything sent through your contact form, newest first. Opening a message marks it as read." />
      {dbError && (
        <div className="admin-error" role="alert">
          <AlertTriangle size={16} aria-hidden="true" />
          <span>Could not reach the database. Check that <code>DATABASE_URL</code> is set correctly and migrations have been applied.</span>
        </div>
      )}
      <MessagesList initialMessages={rows} />
    </div>
  );
}
