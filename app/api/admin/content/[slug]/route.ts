import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { isSameOrigin } from '@/lib/same-origin';
import { ContentInput, contentKey, isPortfolioContent, normalizeContent } from '@/lib/portfolio-content';
export const runtime = 'nodejs';
type Params = { params: { slug: string } };
function uniqueViolation(error: unknown) { return !!error && typeof error === 'object' && 'code' in error && (error as { code?: string }).code === '23505'; }
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session.isAdmin) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  if (!isSameOrigin(req)) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  let body: unknown; try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 }); }
  const parsed = ContentInput.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid content.' }, { status: 400 });
  try {
    const { db } = await import('@/lib/db'); const { siteSettings } = await import('@/lib/schema');
    const oldKey = contentKey(params.slug);
    const result = await db.transaction(async (tx) => {
      const [existing] = await tx.select().from(siteSettings).where(eq(siteSettings.key, oldKey)).limit(1);
      if (!existing || !isPortfolioContent(existing.value)) return null;
      const article = normalizeContent(parsed.data, existing.value.publishedAt);
      const newKey = contentKey(article.slug);
      if (newKey === oldKey) {
        const [updated] = await tx.update(siteSettings).set({ value: article, updatedAt: new Date() }).where(eq(siteSettings.key, oldKey)).returning();
        return updated ? { ...article, updatedAt: updated.updatedAt } : null;
      }
      await tx.delete(siteSettings).where(eq(siteSettings.key, oldKey));
      const [updated] = await tx.insert(siteSettings).values({ key: newKey, value: article, description: 'Portfolio article' }).returning();
      return { ...article, updatedAt: updated.updatedAt };
    });
    if (!result) return NextResponse.json({ error: 'Article not found.' }, { status: 404 });
    return NextResponse.json({ article: result });
  } catch (error) {
    if (uniqueViolation(error)) return NextResponse.json({ error: 'That article URL slug is already in use.' }, { status: 409 });
    console.error('[admin/content PATCH]', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'Content storage is temporarily unavailable.' }, { status: 503 });
  }
}
export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session.isAdmin) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  if (!isSameOrigin(req)) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  try {
    const { db } = await import('@/lib/db'); const { siteSettings } = await import('@/lib/schema');
    const [deleted] = await db.delete(siteSettings).where(eq(siteSettings.key, contentKey(params.slug))).returning({ id: siteSettings.id });
    if (!deleted) return NextResponse.json({ error: 'Article not found.' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[admin/content DELETE]', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'Content storage is temporarily unavailable.' }, { status: 503 });
  }
}
