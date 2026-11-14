import { and, eq, inArray } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isAdminRequest } from '@/lib/auth';
import { isSameOrigin } from '@/lib/same-origin';
import { LIFE_AI_OWNER } from '@/lib/life-ai';
import { OpenLibraryBookSchema, YouTubeVideoSchema } from '@/lib/life-ai-rich-content';
import { lifeAiSavedResources } from '@/lib/schema';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ResourceActionSchema = z.enum(['favorite', 'unfavorite', 'watched', 'unwatched']);
const UpdateInput = z.discriminatedUnion('resourceType', [
  z.object({ resourceType: z.literal('youtube_video'), action: ResourceActionSchema, resource: YouTubeVideoSchema }).strict(),
  z.object({ resourceType: z.literal('book'), action: ResourceActionSchema, resource: OpenLibraryBookSchema }).strict(),
]);

function privateResponse(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { 'cache-control': 'private, no-store' } });
}

export async function GET() {
  if (!(await isAdminRequest())) return privateResponse({ error: 'Unauthorized.' }, 401);
  try {
    const { db } = await import('@/lib/db');
    const resources = await db.select({ resourceType: lifeAiSavedResources.resourceType, resourceKey: lifeAiSavedResources.resourceKey, isFavorite: lifeAiSavedResources.isFavorite, isWatched: lifeAiSavedResources.isWatched, metadata: lifeAiSavedResources.metadata })
      .from(lifeAiSavedResources)
      .where(and(eq(lifeAiSavedResources.ownerKey, LIFE_AI_OWNER), inArray(lifeAiSavedResources.resourceType, ['youtube_video', 'book'])))
      .orderBy(lifeAiSavedResources.updatedAt)
      .limit(200);
    return privateResponse({ resources });
  } catch {
    return privateResponse({ error: 'Saved recommendations are unavailable until the Life AI resource migration is applied.' }, 503);
  }
}

export async function POST(request: NextRequest) {
  if (!(await isAdminRequest())) return privateResponse({ error: 'Unauthorized.' }, 401);
  if (!isSameOrigin(request)) return privateResponse({ error: 'Invalid request origin.' }, 403);
  const parsed = UpdateInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return privateResponse({ error: parsed.error.issues[0]?.message ?? 'Invalid resource state.' }, 400);

  try {
    const { db } = await import('@/lib/db');
    const action = parsed.data.action;
    let resourceType: 'youtube_video' | 'book';
    let resourceKey: string;
    let metadata: Record<string, unknown>;
    if (parsed.data.resourceType === 'youtube_video') {
      resourceType = 'youtube_video';
      resourceKey = parsed.data.resource.videoId;
      metadata = { video: parsed.data.resource };
    } else {
      resourceType = 'book';
      resourceKey = parsed.data.resource.workId;
      metadata = { book: parsed.data.resource };
    }
    const [existing] = await db.select({ isFavorite: lifeAiSavedResources.isFavorite, isWatched: lifeAiSavedResources.isWatched })
      .from(lifeAiSavedResources)
      .where(and(eq(lifeAiSavedResources.ownerKey, LIFE_AI_OWNER), eq(lifeAiSavedResources.resourceType, resourceType), eq(lifeAiSavedResources.resourceKey, resourceKey)))
      .limit(1);
    let isFavorite = existing?.isFavorite ?? false;
    let isWatched = existing?.isWatched ?? false;
    if (action === 'favorite') isFavorite = true;
    if (action === 'unfavorite') isFavorite = false;
    if (action === 'watched') isWatched = true;
    if (action === 'unwatched') isWatched = false;

    const target = and(eq(lifeAiSavedResources.ownerKey, LIFE_AI_OWNER), eq(lifeAiSavedResources.resourceType, resourceType), eq(lifeAiSavedResources.resourceKey, resourceKey));
    if (!isFavorite && !isWatched) {
      await db.delete(lifeAiSavedResources).where(target);
      return privateResponse({ state: { resourceType, resourceKey, isFavorite: false, isWatched: false } });
    }

    await db.insert(lifeAiSavedResources).values({ ownerKey: LIFE_AI_OWNER, resourceType, resourceKey, isFavorite, isWatched, metadata })
      .onConflictDoUpdate({ target: [lifeAiSavedResources.ownerKey, lifeAiSavedResources.resourceType, lifeAiSavedResources.resourceKey], set: { isFavorite, isWatched, metadata, updatedAt: new Date() } });
    return privateResponse({ state: { resourceType, resourceKey, isFavorite, isWatched } });
  } catch {
    return privateResponse({ error: 'Could not save this recommendation. Confirm the Life AI resource migration has been applied.' }, 503);
  }
}
