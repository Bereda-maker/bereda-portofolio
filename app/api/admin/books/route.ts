import { NextRequest, NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';
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

function metadataFor(coverUrl: string, externalBookUrl: string) {
  const metadata: Record<string, unknown> = {};
  if (coverUrl) metadata.coverUrl = coverUrl;
  if (externalBookUrl) metadata.externalBookUrl = externalBookUrl;
  return metadata;
}

function isUniqueViolation(error: unknown) {
  return typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string }).code === '23505';
}

export async function GET() {
  const session = await getSession();
  if (!session.isAdmin) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  try {
    const { db } = await import('@/lib/db');
    const { books, categories } = await import('@/lib/schema');
    const rows = await db.select({
      id: books.id,
      title: books.title,
      slug: books.slug,
      author: books.author,
      description: books.description,
      category: categories.name,
      isPublished: books.isPublished,
      publishedAt: books.publishedAt,
      metadata: books.metadata,
      createdAt: books.createdAt,
      updatedAt: books.updatedAt,
    }).from(books).leftJoin(categories, eq(books.categoryId, categories.id)).orderBy(desc(books.updatedAt));
    return NextResponse.json({ books: rows });
  } catch (error) {
    console.error('[admin/books GET]', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'Could not load books. Confirm DATABASE_URL is configured and the books/categories migrations have been applied.' }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.isAdmin) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  if (!isSameOrigin(req)) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

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
    const categoryId = await ensureCategory(db, input.category);
    const [book] = await db.insert(books).values({
      title: input.title,
      slug,
      author: input.author || null,
      description: input.description || null,
      categoryId,
      isPublished: input.isPublished,
      publishedAt: input.isPublished ? new Date() : null,
      metadata: metadataFor(input.coverUrl, input.externalBookUrl),
    }).returning();
    return NextResponse.json({ book }, { status: 201 });
  } catch (error) {
    if (isUniqueViolation(error)) return NextResponse.json({ error: 'That book URL slug is already in use. Choose a different slug.' }, { status: 409 });
    console.error('[admin/books POST]', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'Could not create the book. Confirm the database is available and migrated.' }, { status: 503 });
  }
}
