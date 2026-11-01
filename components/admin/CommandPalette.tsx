'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowUpRight, CornerDownLeft, Plus, Search, type LucideIcon } from 'lucide-react';
import { ALL_NAV_ITEMS } from './nav';

type Command = { id: string; label: string; hint: string; keywords: string; icon: LucideIcon; run: () => void };

export default function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const commands = useMemo<Command[]>(() => [
    { id: 'new-project', label: 'New project', hint: 'Action', keywords: 'add create portfolio', icon: Plus, run: () => router.push('/admin/projects?new=1') },
    ...ALL_NAV_ITEMS.map((item) => ({ id: item.href, label: item.label, hint: 'Go to', keywords: item.keywords ?? '', icon: item.icon, run: () => router.push(item.href) })),
    { id: 'public-site', label: 'View public site', hint: 'Opens in new tab', keywords: 'website portfolio live', icon: ArrowUpRight, run: () => window.open('/', '_blank', 'noopener') },
  ], [router]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) => `${c.label} ${c.keywords}`.toLowerCase().includes(q));
  }, [commands, query]);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setActive(0);
    const previous = document.activeElement as HTMLElement | null;
    inputRef.current?.focus();
    return () => previous?.focus?.();
  }, [open]);

  useEffect(() => { setActive(0); }, [query]);
  useEffect(() => { listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' }); }, [active]);

  if (!open) return null;

  const choose = (command?: Command) => {
    if (!command) return;
    onClose();
    command.run();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { e.preventDefault(); onClose(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => (results.length ? (i + 1) % results.length : 0)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => (results.length ? (i - 1 + results.length) % results.length : 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); choose(results[active]); }
    else if (e.key === 'Tab') { e.preventDefault(); }
  };

  return (
    <div className="admin-overlay admin-overlay-top" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }} onKeyDown={onKeyDown}>
      <div role="dialog" aria-modal="true" aria-label="Command palette" className="admin-palette">
        <div className="admin-palette-input">
          <Search size={16} aria-hidden="true" />
          <input
            ref={inputRef}
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-results"
            aria-activedescendant={results[active] ? `palette-${results[active].id}` : undefined}
            aria-label="Search pages and actions"
            placeholder="Jump to a page or run an action…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <kbd>Esc</kbd>
        </div>
        <ul id="palette-results" ref={listRef} role="listbox" className="admin-palette-list">
          {results.length === 0 && <li className="admin-palette-empty">Nothing matches “{query}”.</li>}
          {results.map((c, i) => (
            <li key={c.id} id={`palette-${c.id}`} role="option" aria-selected={i === active} className="admin-palette-item" onMouseMove={() => setActive(i)} onClick={() => choose(c)}>
              <c.icon size={16} />
              <span>{c.label}</span>
              <small>{c.hint}</small>
              {i === active && <CornerDownLeft size={13} aria-hidden="true" />}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
