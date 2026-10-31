import LoginForm from '@/components/admin/LoginForm';

export const metadata = { title: 'Admin Login -- Bereda' };

export default function AdminLoginPage() {
  return (
    <div className="admin-login">
      <div className="admin-login-card">
        <p className="admin-login-kicker">Bereda portfolio / private area</p>
        <h1 className="admin-login-title">Welcome back.</h1>
        <p className="admin-login-copy">Sign in to manage projects, review messages, and keep your portfolio content current.</p>
        <LoginForm />
      </div>
    </div>
  );
}
