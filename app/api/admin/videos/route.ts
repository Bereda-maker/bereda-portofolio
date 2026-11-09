import { NextRequest, NextResponse } from 'next/server';
import { desc } from 'drizzle-orm';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { isSameOrigin } from '@/lib/same-origin';
import { parseVimeoUrl } from '@/lib/vimeo';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const Input = z.object({ title: z.string().trim().min(1).max(200), slug: z.string().trim().max(200).optional().default(''), description: z.string().trim().max(5000).optional().default(''), sourceUrl: z.string().trim().min(1).max(2048), durationSeconds: z.union([z.number().int().min(1).max(86400), z.null()]).optional().transform(v => v ?? null), isPublished: z.boolean() });
function slugify(value: string) { return value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
function parseSource(raw: string): { provider: string; externalId: string } | null {
  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:' || url.username || url.password) return null;
    const host = url.hostname.toLowerCase();
    if (['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtube-nocookie.com'].includes(host)) {
      const id = url.pathname === '/watch' ? url.searchParams.get('v') : url.pathname.match(/^\/(?:embed|shorts)\/([^/]+)/)?.[1];
      return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? { provider: 'youtube', externalId: id } : null;
    }
    if (host === 'youtu.be') { const id = url.pathname.split('/').filter(Boolean)[0]; return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? { provider: 'youtube', externalId: id } : null; }
    const vimeo = parseVimeoUrl(raw);
    if (vimeo) return vimeo;
    return /\.(mp4|webm)$/i.test(url.pathname) ? { provider: 'external', externalId: url.toString() } : null;
  } catch { return null; }
}
function unique(error: unknown) { return typeof error === 'object' && error !== null && 'code' in error && (error as {code?: string}).code === '23505'; }
export async function GET() {
  const session = await getSession();
  if (!session.isAdmin) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  try { const { db } = await import('@/lib/db'); const { videos } = await import('@/lib/schema'); const rows = await db.select().from(videos).orderBy(desc(videos.updatedAt)); return NextResponse.json({ videos: rows }); }
  catch (error) { console.error('[admin/videos GET]', error instanceof Error ? error.message : error); return NextResponse.json({ error: 'Could not load videos. Confirm DATABASE_URL is configured and migrations are applied.' }, { status: 503 }); }
}
export async function POST(req: NextRequest) {
  const session = await getSession(); if (!session.isAdmin) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  if (!isSameOrigin(req)) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  const parsed = Input.safeParse(await req.json().catch(() => null)); if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid video details.' }, { status: 400 });
  const input = parsed.data; const source = parseSource(input.sourceUrl); if (!source) return NextResponse.json({ error: 'Use an HTTPS YouTube or Vimeo video URL, or a direct .mp4/.webm URL.' }, { status: 400 });
  const slug = slugify(input.slug || input.title); if (!slug) return NextResponse.json({ error: 'Title or slug must contain letters or numbers.' }, { status: 400 });
  try { const { db } = await import('@/lib/db'); const { videos } = await import('@/lib/schema'); const [video] = await db.insert(videos).values({ title: input.title, slug, description: input.description || null, provider: source.provider, externalId: source.externalId, durationSeconds: input.durationSeconds, isPublished: input.isPublished, publishedAt: input.isPublished ? new Date() : null }).returning(); return NextResponse.json({ video }, { status: 201 }); }
  catch (error) { if (unique(error)) return NextResponse.json({ error: 'That video URL slug is already in use.' }, { status: 409 }); console.error('[admin/videos POST]', error instanceof Error ? error.message : error); return NextResponse.json({ error: 'Could not create video. Confirm the database is available and migrated.' }, { status: 503 }); }
}
