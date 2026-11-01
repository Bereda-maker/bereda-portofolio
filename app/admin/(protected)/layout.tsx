import { redirect } from 'next/navigation';
import { eq, sql } from 'drizzle-orm';
import AdminShell from '@/components/admin/AdminShell';
import { AdminProviders } from '@/components/admin/AdminUI';
import { isAdminRequest } from '@/lib/auth';

// The unread badge is best-effort: if the database is down the shell still
// renders and each page shows its own error state.
async function getUnreadCount(): Promise<number> {
  try {
    const { db } = await import('@/lib/db');
    const { messages } = await import('@/lib/schema');
    const [row] = await db.select({ count: sql<number>`count(*)::int` }).from(messages).where(eq(messages.read, false));
    return row?.count ?? 0;
  } catch {
    return 0;
  }
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAdminRequest())) redirect('/admin/login');
  const unread = await getUnreadCount();

  return (
    <AdminProviders>
      <AdminShell unread={unread}>{children}</AdminShell>
    </AdminProviders>
  );
}
