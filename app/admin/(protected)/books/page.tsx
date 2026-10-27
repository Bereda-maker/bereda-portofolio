import { AdminPageHeader, SetupRequired } from '@/components/admin/AdminSetupState';

export const metadata = { title: 'Books -- Admin' };
export const dynamic = 'force-dynamic';

export default function AdminBooksPage() {
  return (
    <div className="flex flex-col gap-8">
      <AdminPageHeader eyebrow="Publishing / Books" title="Books" description="Prepare books and digital products for publishing without implying that delivery or sales are live." />
      <SetupRequired title="Book publishing is not configured">
        The current database has no book, category, preview, protected-file, purchase, or verified-payment tables. Add those backend contracts and private storage before creating or selling a book here.
      </SetupRequired>
    </div>
  );
}
