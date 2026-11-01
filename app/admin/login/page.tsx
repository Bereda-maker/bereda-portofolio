import ThemeToggle from '@/components/admin/AdminTheme';
import LoginForm from '@/components/admin/LoginForm';

export const metadata = { title: 'Admin Login -- Bereda' };

export default function AdminLoginPage() {
  return (
    <div className="admin-login">
      <div className="admin-login-theme"><ThemeToggle /></div>
      <div className="admin-login-card">
        <span className="admin-brand-mark" aria-hidden="true">B</span>
        <h1 className="admin-login-title">Sign in</h1>
        <p className="admin-login-copy">Manage projects, reply to messages and keep your portfolio up to date.</p>
        <LoginForm />
      </div>
    </div>
  );
}
