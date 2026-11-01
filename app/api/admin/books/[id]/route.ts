import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { isSameOrigin } from '@/lib/same-origin';
import { slugify } from '@/lib/slug';

export const runtime = 'nodejs';

const httpUrl = z.string().trim().max(2048).optional().default('').refine((value) => !value || /^https?:\/\//i.test(value), 'Use a full http:// or https:// URL.');
const BookInput = z.object({
  title: z.string().trim().min(1, 'Title is required.').max(200),
  slug: z.string().trim().max(200).optional().default(''),
  author: z.string().trim().max(160).optional().default(''),
  category: z.string().trim().max(100).optional().default(''),
  description: z.string().trim().max(5000).optional().default(''),
  coverUrl: httpUrl,
  externalBookUrl: httpUrl,
  isPublished: z.boolean().default(false),
});

type Params = { params: { id: string } };
function parseId(raw: string) {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}
async function ensureCategory(db: typeof import('@/lib/db').db, name: string) {
  const cleanName = name.trim();
  if (!cleanName) return null;
  const slug = slugify(cleanName);
  if (!slug) throw new Error('Category name must contain letters or numbers.');
  const { categories } = await import('@/lib/schema');
  const [found] = await db.select({ id: categories.id }).from(categories).where(eq(categories.slug, slug)).limit(1);
  if (found) return found.id;
  await db.insert(categories).values({ name: cleanName, slug }).onConflictDoNothing({ target: categories.slug });
  const [created] = await db.select({ id: categories.id }).from(categories).where(eq(categories.slug, slug)).limit(1);
  if (!created) throw new Error('Could not create the book category.');
  return created.id;
}
function isUniqueViolation(error: unknown) {
  return typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string }).code === '23505';
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session.isAdmin) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  if (!isSameOrigin(req)) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  const id = parseId(params.id);
  if (id === null) return NextResponse.json({ error: 'Invalid book id.' }, { status: 400 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 }); }
  const parsed = BookInput.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid book details.' }, { status: 400 });
  const input = parsed.data;
  const slug = slugify(input.slug || input.title);
  if (!slug) return NextResponse.json({ error: 'Add a title or slug containing letters or numbers.' }, { status: 400 });

  try {
    const { db } = await import('@/lib/db');
    const { books } = await import('@/lib/schema');
    const [existing] = await db.select().from(books).where(eq(books.id, id)).limit(1);
    if (!existing) return NextResponse.json({ error: 'Book not found.' }, { status: 404 });
    const categoryId = await ensureCategory(db, input.category);
    const metadata = { ...(existing.metadata ?? {}) };
    if (input.coverUrl) metadata.coverUrl = input.coverUrl;
    else delete metadata.coverUrl;
    if (input.externalBookUrl) metadata.externalBookUrl = input.externalBookUrl;
    else delete metadata.externalBookUrl;
    const [book] = await db.update(books).set({
      title: input.title,
      slug,
      author: input.author || null,
      description: input.description || null,
      categoryId,
      isPublished: input.isPublished,
      publishedAt: input.isPublished ? existing.publishedAt ?? new Date() : existing.publishedAt,
      metadata,
      updatedAt: new Date(),
    }).where(eq(books.id, id)).returning();
    return NextResponse.json({ book });
  } catch (error) {
    if (isUniqueViolation(error)) return NextResponse.json({ error: 'That book URL slug is already in use. Choose a different slug.' }, { status: 409 });
    console.error('[admin/books PATCH]', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'Could not save the book. Confirm the database is available and migrated.' }, { status: 503 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session.isAdmin) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  if (!isSameOrigin(req)) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  const id = parseId(params.id);
  if (id === null) return NextResponse.json({ error: 'Invalid book id.' }, { status: 400 });
  try {
    const { db } = await import('@/lib/db');
    const { books } = await import('@/lib/schema');
    const [deleted] = await db.delete(books).where(eq(books.id, id)).returning({ id: books.id });
    if (!deleted) return NextResponse.json({ error: 'Book not found.' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const code = typeof error === 'object' && error !== null && 'code' in error ? (error as { code?: string }).code : '';
    if (code === '23503') return NextResponse.json({ error: 'This book is linked to purchase records and cannot be deleted.' }, { status: 409 });
    console.error('[admin/books DELETE]', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'Could not delete the book.' }, { status: 500 });
  }
}
