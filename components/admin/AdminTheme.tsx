'use client';
import { useCallback, useEffect, useState } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { ADMIN_THEME_KEY, type ThemePref } from '@/lib/admin-theme';

const EVENT = 'admin-theme-change';

function readStored(): ThemePref {
  try {
    const v = localStorage.getItem(ADMIN_THEME_KEY);
    return v === 'light' || v === 'dark' ? v : 'system';
  } catch {
    return 'system';
  }
}

function apply(pref: ThemePref) {
  const dark = pref === 'dark' || (pref === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const el = document.documentElement;
  el.setAttribute('data-admin-theme', dark ? 'dark' : 'light');
  el.setAttribute('data-admin-pref', pref);
}

export function useAdminTheme() {
  const [pref, setPrefState] = useState<ThemePref>('system');
  const [resolved, setResolved] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    const read = () => {
      const el = document.documentElement;
      const p = el.getAttribute('data-admin-pref');
      setPrefState(p === 'light' || p === 'dark' ? p : 'system');
      setResolved(el.getAttribute('data-admin-theme') === 'light' ? 'light' : 'dark');
    };
    read();
    window.addEventListener(EVENT, read);
    return () => window.removeEventListener(EVENT, read);
  }, []);

  const setPref = useCallback((next: ThemePref) => {
    try {
      if (next === 'system') localStorage.removeItem(ADMIN_THEME_KEY);
      else localStorage.setItem(ADMIN_THEME_KEY, next);
    } catch { /* storage unavailable: the choice still applies for this session */ }
    apply(next);
    window.dispatchEvent(new Event(EVENT));
  }, []);

  return { pref, resolved, setPref };
}

/** Mounted once in the admin layout: applies the saved theme, follows OS changes while on "System", and cleans up when leaving /admin. */
export function AdminThemeSync() {
  useEffect(() => {
    apply(readStored());
    window.dispatchEvent(new Event(EVENT));
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      if (document.documentElement.getAttribute('data-admin-pref') === 'system') {
        apply('system');
        window.dispatchEvent(new Event(EVENT));
      }
    };
    mq.addEventListener('change', onChange);
    return () => {
      mq.removeEventListener('change', onChange);
      document.documentElement.removeAttribute('data-admin-theme');
      document.documentElement.removeAttribute('data-admin-pref');
    };
  }, []);
  return null;
}

const OPTIONS: { id: ThemePref; label: string; icon: typeof Sun }[] = [
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'dark', label: 'Dark', icon: Moon },
  { id: 'system', label: 'System', icon: Monitor },
];

export default function ThemeToggle() {
  const { pref, setPref } = useAdminTheme();
  return (
    <div className="admin-theme-toggle" role="radiogroup" aria-label="Color theme">
      {OPTIONS.map(({ id, label, icon: Icon }) => (
        <button key={id} type="button" role="radio" aria-checked={pref === id} aria-label={label} title={`${label} theme`} onClick={() => setPref(id)}>
          <Icon size={15} aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}
