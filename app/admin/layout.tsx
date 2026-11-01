import './admin.css';
import { AdminThemeSync } from '@/components/admin/AdminTheme';
import { ADMIN_THEME_INIT_SCRIPT } from '@/lib/admin-theme';

export const metadata = { robots: { index: false, follow: false } };

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: ADMIN_THEME_INIT_SCRIPT }} />
      <AdminThemeSync />
      <div className="admin-root">{children}</div>
    </>
  );
}
