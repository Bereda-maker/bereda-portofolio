'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

/* ───────────── Toasts ───────────── */

type ToastKind = 'success' | 'error' | 'info';
type ToastItem = { id: number; kind: ToastKind; text: string };
type ToastApi = { success: (t: string) => void; error: (t: string) => void; info: (t: string) => void };

const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <AdminProviders>.');
  return ctx;
}

const TOAST_ICON = { success: CheckCircle2, error: AlertTriangle, info: Info } as const;

/* ───────────── Confirm dialog ───────────── */

export type ConfirmOptions = { title: string; body?: string; confirmLabel?: string; cancelLabel?: string; danger?: boolean };
type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;
const ConfirmContext = createContext<ConfirmFn | null>(null);

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used inside <AdminProviders>.');
  return ctx;
}

function ConfirmDialog({ options, onResolve }: { options: ConfirmOptions; onResolve: (ok: boolean) => void }) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    cancelRef.current?.focus();
    return () => previous?.focus?.();
  }, []);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { e.stopPropagation(); onResolve(false); }
    if (e.key === 'Tab') {
      // Two focusable controls: keep focus inside the dialog.
      e.preventDefault();
      (document.activeElement === cancelRef.current ? confirmRef.current : cancelRef.current)?.focus();
    }
  };

  return (
    <div className="admin-overlay admin-overlay-center" onMouseDown={(e) => { if (e.target === e.currentTarget) onResolve(false); }} onKeyDown={onKeyDown}>
      <div role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby={options.body ? 'confirm-body' : undefined} className="admin-dialog">
        <h2 id="confirm-title" className="admin-dialog-title">{options.title}</h2>
        {options.body && <p id="confirm-body" className="admin-dialog-body">{options.body}</p>}
        <div className="admin-dialog-actions">
          <button ref={cancelRef} type="button" className="admin-button-secondary" onClick={() => onResolve(false)}>{options.cancelLabel ?? 'Cancel'}</button>
          <button ref={confirmRef} type="button" className={options.danger ? 'admin-button admin-button-danger' : 'admin-button'} onClick={() => onResolve(true)}>{options.confirmLabel ?? 'Confirm'}</button>
        </div>
      </div>
    </div>
  );
}

/* ───────────── Provider ───────────── */

export function AdminProviders({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [dialog, setDialog] = useState<{ options: ConfirmOptions; resolve: (ok: boolean) => void } | null>(null);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const push = useCallback((kind: ToastKind, text: string) => {
    const id = nextId.current++;
    setToasts((t) => [...t.slice(-3), { id, kind, text }]);
    window.setTimeout(() => dismiss(id), kind === 'error' ? 7000 : 4000);
  }, [dismiss]);

  const toastApi = useMemo<ToastApi>(() => ({ success: (t) => push('success', t), error: (t) => push('error', t), info: (t) => push('info', t) }), [push]);

  const confirm = useCallback<ConfirmFn>((options) => new Promise<boolean>((resolve) => setDialog({ options, resolve })), []);
  const settle = (ok: boolean) => { dialog?.resolve(ok); setDialog(null); };

  return (
    <ToastContext.Provider value={toastApi}>
      <ConfirmContext.Provider value={confirm}>
        {children}
        {dialog && <ConfirmDialog options={dialog.options} onResolve={settle} />}
        <div className="admin-toasts" role="region" aria-label="Notifications" aria-live="polite">
          {toasts.map((t) => {
            const Icon = TOAST_ICON[t.kind];
            return (
              <div key={t.id} className={`admin-toast admin-toast-${t.kind}`} role={t.kind === 'error' ? 'alert' : 'status'}>
                <Icon size={16} aria-hidden="true" />
                <span>{t.text}</span>
                <button type="button" aria-label="Dismiss notification" onClick={() => dismiss(t.id)}><X size={14} /></button>
              </div>
            );
          })}
        </div>
      </ConfirmContext.Provider>
    </ToastContext.Provider>
  );
}
