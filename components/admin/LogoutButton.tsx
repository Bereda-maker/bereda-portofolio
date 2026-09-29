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
    <button type="button" onClick={logout} disabled={loading} className="chip inline-flex items-center gap-2 disabled:opacity-60">
      <LogOut size={14} /> {loading ? 'Signing out…' : 'Logout'}
    </button>
  );
}
