'use client';

import { useEffect, useMemo, useState } from 'react';
import { BookOpen, ExternalLink, Pencil, Plus, Save, Trash2, X } from 'lucide-react';
import { EmptyAdminState } from '@/components/admin/AdminSetupState';
import { useConfirm, useToast } from '@/components/admin/AdminUI';

type Book = {
  id: number;
  title: string;
  slug: string;
  author: string | null;
  description: string | null;
  category: string | null;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, unknown> | null;
};

type FormState = {
  title: string;
  slug: string;
  author: string;
  category: string;
  description: string;
  coverUrl: string;
  externalBookUrl: string;
  isPublished: boolean;
};

const EMPTY: FormState = { title: '', slug: '', author: '', category: '', description: '', coverUrl: '', externalBookUrl: '', isPublished: false };
function metadataText(book: Book | undefined, key: string) {
  const value = book?.metadata?.[key];
  return typeof value === 'string' ? value : '';
}
function formFrom(book?: Book): FormState {
  return book ? {
    title: book.title,
    slug: book.slug,
    author: book.author ?? '',
    category: book.category ?? '',
    description: book.description ?? '',
    coverUrl: metadataText(book, 'coverUrl'),
    externalBookUrl: metadataText(book, 'externalBookUrl'),
    isPublished: book.isPublished,
  } : EMPTY;
}

export default function BooksWorkspace() {
  const confirm = useConfirm();
  const toast = useToast();
  const [books, setBooks] = useState<Book[]>([]);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [loadError, setLoadError] = useState('');
  const [formError, setFormError] = useState('');

  const categories = useMemo(() => [...new Set(books.map((book) => book.category).filter((value): value is string => Boolean(value)))].sort(), [books]);

  async function loadBooks() {
    setIsLoading(true);
    setLoadError('');
    try {
      const response = await fetch('/api/admin/books', { cache: 'no-store' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !Array.isArray(data.books)) throw new Error(data.error ?? 'Could not load books.');
      setBooks(data.books as Book[]);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Could not load books.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { void loadBooks(); }, []);

  function startCreate() {
    setEditingId(null);
    setForm(EMPTY);
    setFormError('');
    setIsFormOpen(true);
  }
  function startEdit(book: Book) {
    setEditingId(book.id);
    setForm(formFrom(book));
    setFormError('');
    setIsFormOpen(true);
  }
  function closeForm() {
    if (isSaving) return;
    setIsFormOpen(false);
    setEditingId(null);
    setForm(EMPTY);
    setFormError('');
  }
  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function saveBook(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError('');
    setIsSaving(true);
    try {
      const response = await fetch(editingId ? `/api/admin/books/${editingId}` : '/api/admin/books', {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error ?? 'Could not save the book.');
      toast.success(editingId ? 'Book updated' : 'Book created');
      setIsFormOpen(false);
      setEditingId(null);
      setForm(EMPTY);
      setFormError('');
      await loadBooks();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Could not save the book.');
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteBook(book: Book) {
    const ok = await confirm({
      title: `Delete “${book.title}”?`,
      body: 'This permanently removes this book record from the catalog. This action cannot be undone.',
      confirmLabel: 'Delete book',
      cancelLabel: 'Keep book',
      danger: true,
    });
    if (!ok) return;
    setDeletingId(book.id);
    try {
      const response = await fetch(`/api/admin/books/${book.id}`, { method: 'DELETE' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error ?? 'Could not delete the book.');
      setBooks((current) => current.filter((item) => item.id !== book.id));
      if (editingId === book.id) closeForm();
      toast.success('Book deleted');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not delete the book.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="admin-stack">
      <section className="admin-card admin-panel">
        <div className="admin-panel-head">
          <div>
            <h2>Catalog records</h2>
            <p>{books.length} {books.length === 1 ? 'book' : 'books'} · drafts stay private until published</p>
          </div>
          <button type="button" className="admin-button" onClick={startCreate}><Plus size={15} aria-hidden="true" /> Add book</button>
        </div>
        <p className="admin-field-hint">This publishes catalog information only. Checkout, private downloads, and file uploads are not enabled.</p>
        {loadError && <div className="admin-error mt-4" role="alert">{loadError}</div>}
        {isLoading ? (
          <div className="admin-skeleton mt-5 h-24" aria-label="Loading books" />
        ) : books.length === 0 ? (
          <div className="mt-5"><EmptyAdminState icon={BookOpen}>No books yet. Add a book record, then publish it to make it visible on the public catalog.</EmptyAdminState></div>
        ) : (
          <div className="admin-table-wrap mt-5">
            <table className="admin-table">
              <thead><tr><th>Book</th><th>Category</th><th>Status</th><th>Updated</th><th className="admin-th-actions"><span className="sr-only">Actions</span></th></tr></thead>
              <tbody>
                {books.map((book) => (
                  <tr key={book.id}>
                    <td className="admin-td-main"><strong className="admin-cell-title">{book.title}</strong><span className="admin-cell-sub">{book.author || 'Author not set'} <span aria-hidden="true">·</span> <span>{book.slug}</span></span></td>
                    <td>{book.category || '—'}</td>
                    <td><span className={`admin-badge ${book.isPublished ? 'ok' : 'warn'}`}>{book.isPublished ? 'Published' : 'Draft'}</span></td>
                    <td><time dateTime={book.updatedAt}>{new Date(book.updatedAt).toLocaleDateString()}</time></td>
                    <td><div className="admin-row-actions">
                      {metadataText(book, 'externalBookUrl') && <a className="admin-icon-btn" href={metadataText(book, 'externalBookUrl')} target="_blank" rel="noreferrer" aria-label={`Open external page for ${book.title}`}><ExternalLink size={15} /></a>}
                      <button type="button" className="admin-icon-btn" aria-label={`Edit ${book.title}`} onClick={() => startEdit(book)}><Pencil size={15} /></button>
                      <button type="button" className="admin-icon-btn danger" aria-label={`Delete ${book.title}`} disabled={deletingId === book.id} onClick={() => void deleteBook(book)}><Trash2 size={15} /></button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {isFormOpen && (
        <section className="admin-card admin-panel" aria-labelledby="book-form-title">
          <div className="admin-panel-head">
            <div><h2 id="book-form-title">{editingId ? 'Edit book' : 'Add a book'}</h2><p>Keep details accurate; only published entries appear in the public catalog.</p></div>
            <button type="button" className="admin-icon-btn" aria-label="Close book form" onClick={closeForm} disabled={isSaving}><X size={17} /></button>
          </div>
          <form onSubmit={saveBook} className="admin-stack">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="admin-field"><label htmlFor="book-title">Title</label><input id="book-title" className="fld" required maxLength={200} value={form.title} onChange={(event) => set('title', event.target.value)} /></div>
              <div className="admin-field"><label htmlFor="book-author">Author <em>optional</em></label><input id="book-author" className="fld" maxLength={160} value={form.author} onChange={(event) => set('author', event.target.value)} /></div>
              <div className="admin-field"><label htmlFor="book-category">Category <em>optional</em></label><input id="book-category" className="fld" list="book-category-options" maxLength={100} value={form.category} onChange={(event) => set('category', event.target.value)} /><datalist id="book-category-options">{categories.map((category) => <option key={category} value={category} />)}</datalist></div>
              <div className="admin-field"><label htmlFor="book-slug">Public URL slug <em>optional; generated from title</em></label><input id="book-slug" className="fld" maxLength={200} value={form.slug} onChange={(event) => set('slug', event.target.value)} placeholder="e.g. a-life-of-learning" /></div>
              <div className="admin-field"><label htmlFor="book-cover">Cover image URL <em>optional</em></label><input id="book-cover" className="fld" type="url" inputMode="url" placeholder="https://…" value={form.coverUrl} onChange={(event) => set('coverUrl', event.target.value)} /></div>
              <div className="admin-field"><label htmlFor="book-link">External book page <em>optional</em></label><input id="book-link" className="fld" type="url" inputMode="url" placeholder="https://…" value={form.externalBookUrl} onChange={(event) => set('externalBookUrl', event.target.value)} /></div>
            </div>
            <div className="admin-field"><label htmlFor="book-description">Description <em>optional</em></label><textarea id="book-description" className="fld" rows={4} maxLength={5000} value={form.description} onChange={(event) => set('description', event.target.value)} /></div>
            <label className="admin-check-row"><input type="checkbox" checked={form.isPublished} onChange={(event) => set('isPublished', event.target.checked)} /><span><strong>Published</strong><small>Visible on the public Books page.</small></span></label>
            {formError && <div className="admin-error" role="alert">{formError}</div>}
            <div className="admin-actions">
              <button type="button" className="admin-button-secondary" onClick={closeForm} disabled={isSaving}>Cancel</button>
              <button type="submit" className="admin-button" disabled={isSaving}>{isSaving ? 'Saving…' : <><Save size={15} aria-hidden="true" /> {editingId ? 'Save changes' : 'Create book'}</>}</button>
            </div>
          </form>
        </section>
      )}
    </div>
  );
}
