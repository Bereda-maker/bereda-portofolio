import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminSetupState';
import BooksWorkspace from '@/components/admin/BooksWorkspace';

export const metadata = { title: 'Books -- Admin' };
export const dynamic = 'force-dynamic';

export default function AdminBooksPage() {
  return (
    <div className="admin-page">
      <AdminPageHeader
        eyebrow="Publishing / Books"
        title="Books"
        description="Manage book details and choose which titles appear in the public catalog."
        actions={<Link href="/books" target="_blank" rel="noreferrer" className="admin-button-secondary">View public catalog <ArrowUpRight size={14} aria-hidden="true" /></Link>}
      />
      <BooksWorkspace />
    </div>
  );
}
