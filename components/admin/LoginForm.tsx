'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setErr('Password is required.');
      return;
    }
    setErr('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data: { ok?: true; error?: string } = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(data.error ?? 'Something went wrong. Please try again.');
        return;
      }
      router.push('/admin');
      router.refresh();
    } catch {
      setErr('Could not reach the server. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="admin-login-form">
      <input
        name="password"
        type="password"
        autoComplete="current-password"
        autoFocus
        placeholder="Admin password"
        className={`fld${err ? ' err' : ''}`}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <div className="min-h-[1.25rem] text-sm text-[#ff829b]">{err}</div>
      <button type="submit" disabled={loading} className="cbtn w-full !py-3.5 disabled:opacity-60">
        {loading ? 'Signing in…' : 'Sign In'}
      </button>
    </form>
  );
}
