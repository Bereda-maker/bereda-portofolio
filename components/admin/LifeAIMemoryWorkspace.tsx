'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Check, Download, LockKeyhole, Loader2, RefreshCw, ShieldCheck, Trash2 } from 'lucide-react';
import { PROFILE_CATEGORIES, PROFILE_CATEGORY_INFO, type ProfileCategory } from '@/lib/life-ai-profile-contract';

type CategoryPermission = {
  aiEnabled: boolean;
  hasSensitiveConsent: boolean;
  hasData: boolean;
  updatedAt: string | null;
  permissionUpdatedAt: string | null;
};

type Permissions = {
  globalEnabled: boolean;
  categories: Record<ProfileCategory, CategoryPermission>;
};

const PERMISSIONS_URL = '/api/admin/life-ai/profile/permissions';
const PROFILE_URL = '/api/admin/life-ai/profile';
const EXPORT_URL = '/api/admin/life-ai/profile/export';

function isPermissions(value: unknown): value is Permissions {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<Permissions>;
  if (typeof candidate.globalEnabled !== 'boolean' || !candidate.categories || typeof candidate.categories !== 'object') return false;
  return PROFILE_CATEGORIES.every((category) => {
    const entry = candidate.categories?.[category];
    if (!entry || typeof entry !== 'object') return false;
    return typeof entry.aiEnabled === 'boolean'
      && typeof entry.hasSensitiveConsent === 'boolean'
      && typeof entry.hasData === 'boolean'
      && (typeof entry.updatedAt === 'string' || entry.updatedAt === null)
      && (typeof entry.permissionUpdatedAt === 'string' || entry.permissionUpdatedAt === null);
  });
}

async function responseMessage(response: Response, fallback: string): Promise<string> {
  const payload = await response.json().catch(() => null) as { error?: unknown; message?: unknown } | null;
  if (typeof payload?.error === 'string' && payload.error.trim()) return payload.error;
  if (typeof payload?.message === 'string' && payload.message.trim()) return payload.message;
  return fallback;
}

function formatUpdatedAt(value: string | null): string {
  if (!value) return 'No update date recorded';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Update date unavailable'
    : `Last updated ${date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}`;
}

export default function LifeAIMemoryWorkspace() {
  const [permissions, setPermissions] = useState<Permissions | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<ProfileCategory | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [profileDeleted, setProfileDeleted] = useState(false);

  const fetchPermissions = useCallback(async (): Promise<Permissions> => {
    const response = await fetch(PERMISSIONS_URL, { cache: 'no-store' });
    if (!response.ok) throw new Error(await responseMessage(response, 'Could not load profile access settings.'));
    const payload: unknown = await response.json().catch(() => null);
    if (!isPermissions(payload)) throw new Error('The permissions service returned an invalid profile settings response.');
    return payload;
  }, []);

  const refreshPermissions = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError('');
    setNotice('');
    try {
      setPermissions(await fetchPermissions());
      setProfileDeleted(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load profile access settings.');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [fetchPermissions]);

  useEffect(() => { void refreshPermissions(); }, [refreshPermissions]);

  async function saveGlobal(enabled: boolean) {
    if (!permissions || saving) return;
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const response = await fetch(PERMISSIONS_URL, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ scope: 'global', enabled }),
      });
      if (!response.ok) throw new Error(await responseMessage(response, 'Could not save the global access setting.'));
      setPermissions((current) => current ? { ...current, globalEnabled: enabled } : current);
      setNotice(enabled ? 'Global AI access is on. Your category choices still apply.' : 'Global AI access is off. Your profile information and category choices are unchanged.');
      try {
        setPermissions(await fetchPermissions());
      } catch {
        setNotice(`${enabled ? 'Global AI access is on' : 'Global AI access is off'}; settings were saved, but the latest status could not be refreshed.`);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save the global access setting.');
    } finally {
      setSaving(false);
    }
  }

  async function saveCategory(category: ProfileCategory, enabled: boolean) {
    if (!permissions || saving) return;
    const info = PROFILE_CATEGORY_INFO[category];
    if (enabled && info.sensitive) {
      const accepted = window.confirm(
        `Allow Your Life AI to use “${info.label}”? This is a sensitive category. By continuing, you explicitly consent to its use for AI responses. You can turn access off at any time; doing so will not delete the saved information.`,
      );
      if (!accepted) return;
    }

    setSaving(true);
    setError('');
    setNotice('');
    try {
      const body = enabled && info.sensitive
        ? { scope: 'category' as const, category, enabled, sensitiveConsent: true }
        : { scope: 'category' as const, category, enabled };
      const response = await fetch(PERMISSIONS_URL, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error(await responseMessage(response, `Could not update ${info.label} access.`));
      setPermissions((current) => current ? {
        ...current,
        categories: {
          ...current.categories,
          [category]: {
            ...current.categories[category],
            aiEnabled: enabled,
            hasSensitiveConsent: enabled && info.sensitive ? true : current.categories[category].hasSensitiveConsent,
          },
        },
      } : current);
      setNotice(enabled ? `AI access enabled for ${info.label}.` : `AI access disabled for ${info.label}. The saved information remains in your profile.`);
      try {
        setPermissions(await fetchPermissions());
      } catch {
        setNotice(`Access for ${info.label} was saved, but the latest status could not be refreshed.`);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : `Could not update ${info.label} access.`);
    } finally {
      setSaving(false);
    }
  }

  async function deleteProfile() {
    if (deleting || saving) return;
    const accepted = window.confirm(
      'Delete all Life AI profile data and its permissions? This permanently removes the information saved in every profile category and cannot be undone. Turning off AI access does not delete profile information; this action does.',
    );
    if (!accepted) return;

    setDeleting(true);
    setError('');
    setNotice('');
    try {
      const response = await fetch(PROFILE_URL, { method: 'DELETE' });
      if (!response.ok) throw new Error(await responseMessage(response, 'Could not delete profile data.'));
      setPermissions(null);
      setProfileDeleted(true);
      setNotice('The profile deletion request completed. Checking the current permissions status…');
      try {
        setPermissions(await fetchPermissions());
        setNotice('Profile data and permissions were deleted.');
      } catch {
        setNotice('Profile data and permissions were deleted. Current permission status could not be reloaded.');
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not delete profile data.');
    } finally {
      setDeleting(false);
    }
  }

  async function deleteCategory(category: ProfileCategory) {
    const info = PROFILE_CATEGORY_INFO[category];
    const accepted = window.confirm(`Delete all saved ${info.label.toLowerCase()} data and its AI access setting? This cannot be undone.`);
    if (!accepted || deletingCategory || saving || deleting) return;
    setDeletingCategory(category);
    setError('');
    setNotice('');
    try {
      const response = await fetch(`${PROFILE_URL}?category=${encodeURIComponent(category)}`, { method: 'DELETE' });
      if (!response.ok) throw new Error(await responseMessage(response, `Could not delete ${info.label}.`));
      await refreshPermissions(false);
      setNotice(`${info.label} data and its access setting were deleted.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : `Could not delete ${info.label}.`);
    } finally {
      setDeletingCategory(null);
    }
  }

  const busy = saving || deleting || deletingCategory !== null;

  return (
    <div className="life-memory-workspace">
      <header className="life-memory-header">
        <div>
          <span className="admin-eyebrow life-memory-eyebrow"><LockKeyhole size={14} aria-hidden="true" /> Private · owner only</span>
          <h1 className="admin-title">Memory &amp; personalization</h1>
          <p className="admin-description">You decide whether Your Life AI can use your profile, and which parts it may draw on.</p>
        </div>
        <button type="button" className="admin-button-secondary life-memory-refresh" onClick={() => void refreshPermissions()} disabled={loading || busy}>
          {loading ? <Loader2 size={16} className="life-memory-spin" aria-hidden="true" /> : <RefreshCw size={16} aria-hidden="true" />}
          Refresh status
        </button>
      </header>

      <section className="life-memory-privacy-note" aria-label="Privacy and data use">
        <ShieldCheck size={20} aria-hidden="true" />
        <div>
          <strong>Your profile is private and visible only to you.</strong>
          <p>These controls determine AI access; they do not make profile details public. Turning off global or category access preserves your saved profile information.</p>
        </div>
      </section>

      {error && <div className="admin-error life-memory-error" role="alert"><AlertTriangle size={16} aria-hidden="true" /><span>{error}</span></div>}
      {notice && <div className="life-memory-feedback" role="status" aria-live="polite"><Check size={16} aria-hidden="true" /><span>{notice}</span></div>}

      {loading && !permissions ? (
        <div className="admin-card life-memory-loading" role="status"><Loader2 size={18} className="life-memory-spin" aria-hidden="true" /> Loading your access settings…</div>
      ) : permissions ? (
        <>
          {profileDeleted && <div className="life-memory-empty" role="status"><strong>Profile deletion confirmed.</strong><span>Profile data and permissions have been deleted. Any settings shown below reflect the latest permissions response.</span></div>}
          <section className="admin-card life-memory-global" aria-labelledby="life-memory-global-title">
            <div className="life-memory-section-copy">
              <span className="admin-eyebrow">AI access</span>
              <h2 id="life-memory-global-title">Global profile access</h2>
              <p>When off, Your Life AI cannot use any of these profile categories, even if an individual category remains enabled. Category settings are kept for when you choose to turn global access back on.</p>
            </div>
            <label className="life-memory-switch-row">
              <span><strong>{permissions.globalEnabled ? 'On' : 'Off'}</strong><small>{permissions.globalEnabled ? 'Enabled categories may be used' : 'No profile category is available to AI'}</small></span>
              <input
                className="life-memory-switch"
                type="checkbox"
                role="switch"
                aria-label="Allow Your Life AI to use profile categories"
                checked={permissions.globalEnabled}
                disabled={busy}
                onChange={(event) => void saveGlobal(event.currentTarget.checked)}
              />
            </label>
          </section>

          <section className="life-memory-categories" aria-labelledby="life-memory-categories-title">
            <div className="life-memory-section-heading">
              <div><span className="admin-eyebrow">Granular controls</span><h2 id="life-memory-categories-title">Profile categories</h2></div>
              <span className="life-memory-count">{PROFILE_CATEGORIES.length} categories</span>
            </div>
            <p className="life-memory-data-limit">Your profile content stays private here. These controls show only whether a category has saved data, its last profile update, and the AI access state.</p>
            <div className="life-memory-category-list">
              {PROFILE_CATEGORIES.map((category) => {
                const info = PROFILE_CATEGORY_INFO[category];
                const permission = permissions.categories[category];
                const effective = permissions.globalEnabled && permission.aiEnabled;
                return (
                  <article className="admin-card life-memory-category" key={category}>
                    <div className="life-memory-category-main">
                      <div className="life-memory-category-title-row">
                        <h3>{info.label}</h3>
                        {info.sensitive && <span className="life-memory-sensitive">Sensitive</span>}
                      </div>
                      <p>{info.description}</p>
                      <div className="life-memory-category-meta">
                        <span className="life-memory-private-chip"><LockKeyhole size={12} aria-hidden="true" /> Private · only you</span>
                        <span>{permission.hasData ? 'Profile data saved' : 'No profile data saved'}</span>
                        <span className={`life-memory-status${effective ? ' is-active' : ''}`}>
                          <span aria-hidden="true" className="life-memory-status-dot" />
                          {effective ? 'Available to AI' : !permissions.globalEnabled && permission.aiEnabled ? 'Paused by global setting' : 'Not available to AI'}
                        </span>
                        <time dateTime={permission.updatedAt ?? undefined}>{formatUpdatedAt(permission.updatedAt)}</time>
                      </div>
                      {info.sensitive && <p className="life-memory-consent-status">{permission.hasSensitiveConsent ? 'Explicit consent is recorded for this sensitive category.' : 'No explicit consent is recorded. Consent is required before enabling AI access.'}</p>}
                      <div className="life-memory-category-actions">
                        <Link className="admin-button-secondary" href={`/admin/life-ai/profile?section=${category}`}>Edit profile data</Link>
                        <button type="button" className="admin-button-secondary admin-button-quiet-danger" onClick={() => void deleteCategory(category)} disabled={busy || (!permission.hasData && !permission.aiEnabled && !permission.hasSensitiveConsent)}>{deletingCategory === category ? 'Deleting…' : 'Delete category data'}</button>
                      </div>
                    </div>
                    <label className="life-memory-category-toggle">
                      <span className="life-memory-toggle-label">{permission.aiEnabled ? 'AI access on' : 'AI access off'}</span>
                      <input
                        className="life-memory-switch"
                        type="checkbox"
                        role="switch"
                        aria-label={`Allow Your Life AI to use ${info.label}`}
                        checked={permission.aiEnabled}
                        disabled={busy}
                        onChange={(event) => void saveCategory(category, event.currentTarget.checked)}
                      />
                    </label>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="admin-card life-memory-data-actions" aria-labelledby="life-memory-data-title">
            <div className="life-memory-section-copy">
              <span className="admin-eyebrow">Your data</span>
              <h2 id="life-memory-data-title">Export or delete your profile</h2>
              <p>Export a private copy of your profile, or permanently remove profile data and its permissions. Disabling AI access is reversible and never deletes your data.</p>
            </div>
            <div className="life-memory-actions">
              <a className="admin-button-secondary life-memory-export" href={EXPORT_URL}>
                <Download size={16} aria-hidden="true" /> Export profile
              </a>
              <button type="button" className="admin-button admin-button-danger life-memory-delete" onClick={() => void deleteProfile()} disabled={busy}>
                {deleting ? <Loader2 size={16} className="life-memory-spin" aria-hidden="true" /> : <Trash2 size={16} aria-hidden="true" />}
                {deleting ? 'Deleting profile…' : 'Delete all profile data'}
              </button>
            </div>
          </section>
        </>
      ) : !loading ? (
        <div className="life-memory-empty" role="status">
          <strong>{profileDeleted ? 'Profile data and permissions were deleted.' : 'Profile access settings are unavailable.'}</strong>
          <span>{profileDeleted ? 'The deletion is complete; permission status could not be loaded.' : 'No category permissions are shown until the settings service responds.'}</span>
          <button type="button" className="admin-button-secondary" onClick={() => void refreshPermissions()}><RefreshCw size={15} aria-hidden="true" /> Try again</button>
        </div>
      ) : null}
    </div>
  );
}
