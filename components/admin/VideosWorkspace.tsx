'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { Film, Pencil, Plus, Save, Trash2, X } from 'lucide-react';
import { EmptyAdminState } from '@/components/admin/AdminSetupState';
import { useConfirm, useToast } from '@/components/admin/AdminUI';

type Video = {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  provider: string;
  externalId: string | null;
  durationSeconds: number | null;
  isPublished: boolean;
  publishedAt: string | null;
  updatedAt: string;
};

type FormState = {
  title: string;
  slug: string;
  description: string;
  sourceUrl: string;
  durationSeconds: string;
  isPublished: boolean;
};

const EMPTY_FORM: FormState = {
  title: '',
  slug: '',
  description: '',
  sourceUrl: '',
  durationSeconds: '',
  isPublished: false,
};

function sourceUrl(video: Video): string {
  if (!video.externalId) return '';
  if (video.provider === 'youtube') return `https://www.youtube.com/watch?v=${video.externalId}`;
  if (video.provider === 'vimeo') return `https://vimeo.com/${video.externalId}`;
  return video.externalId;
}

export default function VideosWorkspace() {
  const confirm = useConfirm();
  const toast = useToast();
  const [videos, setVideos] = useState<Video[]>([]);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [loadError, setLoadError] = useState('');
  const [formError, setFormError] = useState('');

  async function loadVideos() {
    setIsLoading(true);
    setLoadError('');
    try {
      const response = await fetch('/api/admin/videos', { cache: 'no-store' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !Array.isArray(data.videos)) throw new Error(data.error ?? 'Could not load videos.');
      setVideos(data.videos as Video[]);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Could not load videos.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { void loadVideos(); }, []);

  function startCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setIsFormOpen(true);
  }

  function startEdit(video: Video) {
    setEditingId(video.id);
    setForm({
      title: video.title,
      slug: video.slug,
      description: video.description ?? '',
      sourceUrl: sourceUrl(video),
      durationSeconds: video.durationSeconds?.toString() ?? '',
      isPublished: video.isPublished,
    });
    setFormError('');
    setIsFormOpen(true);
  }

  function closeForm() {
    if (isSaving) return;
    setIsFormOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError('');
  }

  function updateForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function saveVideo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError('');
    setIsSaving(true);
    try {
      const response = await fetch(editingId ? `/api/admin/videos/${editingId}` : '/api/admin/videos', {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          durationSeconds: form.durationSeconds.trim() ? Number(form.durationSeconds) : null,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error ?? 'Could not save the video.');

      toast.success(editingId ? 'Video updated' : 'Video created');
      setIsFormOpen(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
      setFormError('');
      await loadVideos();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Could not save the video.');
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteVideo(video: Video) {
    const ok = await confirm({
      title: `Delete “${video.title}”?`,
      body: 'This permanently removes the video record. The external video itself is not affected.',
      confirmLabel: 'Delete video',
      cancelLabel: 'Keep video',
      danger: true,
    });
    if (!ok) return;

    setDeletingId(video.id);
    try {
      const response = await fetch(`/api/admin/videos/${video.id}`, { method: 'DELETE' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error ?? 'Could not delete the video.');
      setVideos((current) => current.filter((item) => item.id !== video.id));
      if (editingId === video.id) {
        setIsFormOpen(false);
        setEditingId(null);
        setForm(EMPTY_FORM);
      }
      toast.success('Video deleted');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not delete the video.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="admin-stack">
      <section className="admin-card admin-panel">
        <div className="admin-panel-head">
          <div>
            <h2>Video records</h2>
            <p>{videos.length} {videos.length === 1 ? 'video' : 'videos'} · drafts stay private until published</p>
          </div>
          <button type="button" className="admin-button" onClick={startCreate}>
            <Plus size={15} aria-hidden="true" /> Add video
          </button>
        </div>
        <p className="admin-field-hint">Only secure YouTube, Vimeo, and direct MP4/WebM links are supported. Uploads are not enabled.</p>
        {loadError && <div className="admin-error mt-4" role="alert">{loadError}</div>}
        {isLoading ? (
          <div className="admin-skeleton mt-5 h-24" aria-label="Loading videos" />
        ) : videos.length === 0 ? (
          <div className="mt-5">
            <EmptyAdminState icon={Film}>No videos yet. Add a video record when you have a real source URL to share.</EmptyAdminState>
          </div>
        ) : (
          <div className="admin-table-wrap mt-5">
            <table className="admin-table">
              <thead><tr><th>Video</th><th>Source</th><th>Status</th><th>Updated</th><th className="admin-th-actions"><span className="sr-only">Actions</span></th></tr></thead>
              <tbody>
                {videos.map((video) => (
                  <tr key={video.id}>
                    <td className="admin-td-main"><strong className="admin-cell-title">{video.title}</strong><span className="admin-cell-sub">{video.slug}</span></td>
                    <td>{video.provider}</td>
                    <td><span className={`admin-badge ${video.isPublished ? 'ok' : 'warn'}`}>{video.isPublished ? 'Published' : 'Draft'}</span></td>
                    <td><time dateTime={video.updatedAt}>{new Date(video.updatedAt).toLocaleDateString()}</time></td>
                    <td><div className="admin-row-actions">
                      <button type="button" className="admin-icon-btn" aria-label={`Edit ${video.title}`} onClick={() => startEdit(video)}><Pencil size={15} /></button>
                      <button type="button" className="admin-icon-btn danger" aria-label={`Delete ${video.title}`} disabled={deletingId === video.id} onClick={() => void deleteVideo(video)}><Trash2 size={15} /></button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {isFormOpen && (
        <section className="admin-card admin-panel" aria-labelledby="video-form-title">
          <div className="admin-panel-head">
            <div><h2 id="video-form-title">{editingId ? 'Edit video' : 'Add a video'}</h2><p>Only published records appear on the public Videos page.</p></div>
            <button type="button" className="admin-icon-btn" aria-label="Close video form" onClick={closeForm} disabled={isSaving}><X size={17} /></button>
          </div>
          <form onSubmit={saveVideo} className="admin-stack">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="admin-field"><label htmlFor="video-title">Title</label><input id="video-title" className="fld" required maxLength={200} value={form.title} onChange={(event) => updateForm('title', event.target.value)} /></div>
              <div className="admin-field"><label htmlFor="video-slug">Public URL slug <em>optional; generated from title</em></label><input id="video-slug" className="fld" maxLength={200} value={form.slug} onChange={(event) => updateForm('slug', event.target.value)} /></div>
              <div className="admin-field sm:col-span-2"><label htmlFor="video-url">Source URL</label><input id="video-url" className="fld" type="url" inputMode="url" placeholder="https://…" required value={form.sourceUrl} onChange={(event) => updateForm('sourceUrl', event.target.value)} /><small className="admin-field-hint">Use HTTPS with a YouTube, Vimeo, or direct .mp4/.webm URL.</small></div>
              <div className="admin-field"><label htmlFor="video-duration">Duration (seconds) <em>optional, up to 24 hours</em></label><input id="video-duration" className="fld" type="number" min="1" max="86400" step="1" value={form.durationSeconds} onChange={(event) => updateForm('durationSeconds', event.target.value)} /></div>
            </div>
            <div className="admin-field"><label htmlFor="video-description">Description <em>optional</em></label><textarea id="video-description" className="fld" rows={4} maxLength={5000} value={form.description} onChange={(event) => updateForm('description', event.target.value)} /></div>
            <label className="admin-check-row"><input type="checkbox" checked={form.isPublished} onChange={(event) => updateForm('isPublished', event.target.checked)} /><span><strong>Published</strong><small>Visible on the public Videos page.</small></span></label>
            {formError && <div className="admin-error" role="alert">{formError}</div>}
            <div className="admin-actions"><button type="button" className="admin-button-secondary" onClick={closeForm} disabled={isSaving}>Cancel</button><button type="submit" className="admin-button" disabled={isSaving}>{isSaving ? 'Saving…' : <><Save size={15} aria-hidden="true" /> {editingId ? 'Save changes' : 'Create video'}</>}</button></div>
          </form>
        </section>
      )}
    </div>
  );
}
