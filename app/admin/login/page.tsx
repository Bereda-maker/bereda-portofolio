import LoginForm from '@/components/admin/LoginForm';

export const metadata = { title: 'Admin Login -- Bereda' };

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 gap-8" style={{ background: '#0C0C0C' }}>
      <h1 className="hero-heading font-black uppercase tracking-tight text-center" style={{ fontSize: 'clamp(2.2rem,6vw,4rem)' }}>
        Admin
      </h1>
      <LoginForm />
    </div>
  );
}
