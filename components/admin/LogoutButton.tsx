'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const logout = async () => {
    setLoading(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      router.push('/admin/login');
      router.refresh();
    }
  };

  return (
    <button type="button" onClick={logout} disabled={loading} className="admin-nav-link admin-signout">
      <LogOut size={17} aria-hidden="true" />
      <span>{loading ? 'Signing out…' : 'Sign out'}</span>
    </button>
  );
}
