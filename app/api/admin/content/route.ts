import { NextRequest, NextResponse } from 'next/server';
import { asc, eq, like } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { isSameOrigin } from '@/lib/same-origin';
import { CONTENT_PREFIX, ContentInput, contentKey, isPortfolioContent, normalizeContent } from '@/lib/portfolio-content';
export const runtime = 'nodejs';
function uniqueViolation(error: unknown) { return !!error && typeof error === 'object' && 'code' in error && (error as { code?: string }).code === '23505'; }
export async function GET() {
  const session = await getSession();
  if (!session.isAdmin) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  try {
    const { db } = await import('@/lib/db'); const { siteSettings } = await import('@/lib/schema');
    const rows = await db.select().from(siteSettings).where(like(siteSettings.key, `${CONTENT_PREFIX}%`)).orderBy(asc(siteSettings.key));
    return NextResponse.json({ articles: rows.flatMap((row) => isPortfolioContent(row.value) ? [{ ...row.value, updatedAt: row.updatedAt }] : []) });
  } catch (error) {
    console.error('[admin/content GET]', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'Content storage is temporarily unavailable.' }, { status: 503 });
  }
}
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.isAdmin) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  if (!isSameOrigin(req)) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  let body: unknown; try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 }); }
  const parsed = ContentInput.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid content.' }, { status: 400 });
  try {
    const article = normalizeContent(parsed.data, null);
    const { db } = await import('@/lib/db'); const { siteSettings } = await import('@/lib/schema');
    const [row] = await db.insert(siteSettings).values({ key: contentKey(article.slug), value: article, description: 'Portfolio article' }).returning();
    return NextResponse.json({ article: { ...article, updatedAt: row.updatedAt } }, { status: 201 });
  } catch (error) {
    if (uniqueViolation(error)) return NextResponse.json({ error: 'That article URL slug is already in use.' }, { status: 409 });
    console.error('[admin/content POST]', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'Content storage is temporarily unavailable.' }, { status: 503 });
  }
}
