'use client';

import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem('bereda-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const next = saved ? saved === 'dark' : prefersDark;
    document.documentElement.classList.toggle('dark', next);
    setDark(next);
  }, []);

  const toggle = () => {
    const next = !dark;
    document.documentElement.classList.toggle('dark', next);
    window.localStorage.setItem('bereda-theme', next ? 'dark' : 'light');
    setDark(next);
  };

  return (
    <button type="button" onClick={toggle} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-rule bg-card text-ink transition hover:-translate-y-0.5" aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'} title={dark ? 'Light mode' : 'Dark mode'}>
      {dark ? <Sun size={17} aria-hidden="true" /> : <Moon size={17} aria-hidden="true" />}
    </button>
  );
}
