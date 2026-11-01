'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, AlertTriangle } from 'lucide-react';

export default function LoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setErr('Enter your admin password.');
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
    <form onSubmit={submit} className="admin-login-form" noValidate>
      <div className="admin-field">
        <label htmlFor="admin-password">Password</label>
        <div className="admin-password">
          <input
            id="admin-password"
            name="password"
            type={show ? 'text' : 'password'}
            autoComplete="current-password"
            autoFocus
            className={`fld${err ? ' err' : ''}`}
            value={password}
            aria-invalid={!!err}
            aria-describedby={err ? 'admin-login-error' : undefined}
            onChange={(e) => { setPassword(e.target.value); if (err) setErr(''); }}
            onKeyUp={(e) => setCapsLock(e.getModifierState('CapsLock'))}
            onBlur={() => setCapsLock(false)}
          />
          <button type="button" className="admin-icon-btn" onClick={() => setShow((v) => !v)} aria-label={show ? 'Hide password' : 'Show password'} aria-pressed={show}>
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {capsLock && <p className="admin-field-hint admin-warn"><AlertTriangle size={13} aria-hidden="true" /> Caps Lock is on.</p>}
        <p id="admin-login-error" className="admin-field-error" role="alert" style={{ minHeight: '1.2rem' }}>{err}</p>
      </div>
      <button type="submit" disabled={loading} className="admin-button admin-button-block">
        {loading ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}
