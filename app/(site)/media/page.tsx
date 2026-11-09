import type { Metadata } from 'next';
import { getVimeoEmbedUrl } from '@/lib/vimeo';
import Link from 'next/link';
import { and, desc, eq, isNotNull, like } from 'drizzle-orm';
import { ArrowUpRight, Headphones, PlayCircle } from 'lucide-react';
import { Note, PublicPage } from '@/components/PublicPage';

export const metadata: Metadata = {
  title: 'Media',
  description: 'Video walkthroughs, demonstrations, and audio from Bereda Wako.',
};
export const dynamic = 'force-dynamic';

type Video = {
  title: string;
  description: string | null;
  provider: string;
  externalId: string | null;
  durationSeconds: number | null;
};

type Audio = {
  id: number;
  title: string;
  url: string;
  description: string | null;
};

async function getMedia(): Promise<{ videos: Video[]; audio: Audio[]; unavailable: boolean }> {
  try {
    const { db } = await import('@/lib/db');
    const { mediaAssets, videos } = await import('@/lib/schema');
    const [videoRows, audioRows] = await Promise.all([
      db.select({
        title: videos.title,
        description: videos.description,
        provider: videos.provider,
        externalId: videos.externalId,
        durationSeconds: videos.durationSeconds,
      }).from(videos).where(eq(videos.isPublished, true)).orderBy(desc(videos.publishedAt)),
      db.select({
        id: mediaAssets.id,
        filename: mediaAssets.filename,
        publicUrl: mediaAssets.publicUrl,
        altText: mediaAssets.altText,
      }).from(mediaAssets)
        .where(and(like(mediaAssets.mimeType, 'audio/%'), isNotNull(mediaAssets.publicUrl)))
        .orderBy(desc(mediaAssets.createdAt)),
    ]);

    return {
      videos: videoRows,
      audio: audioRows.flatMap((item) => {
        if (!item.publicUrl || !isSafeAudioUrl(item.publicUrl)) return [];
        return [{ id: item.id, title: item.filename, url: item.publicUrl, description: item.altText }];
      }),
      unavailable: false,
    };
  } catch (error) {
    console.error('[media/library]', error instanceof Error ? error.message : error);
    return { videos: [], audio: [], unavailable: true };
  }
}

function isSafeAudioUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password;
  } catch {
    return false;
  }
}

function isDirectVideoUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password && /\.(mp4|webm)$/i.test(url.pathname);
  } catch {
    return false;
  }
}

function VideoPlayer({ video }: { video: Video }) {
  if (!video.externalId) return <div className="flex aspect-video items-center justify-center rounded-2xl bg-panel text-sm text-muted">Video source unavailable</div>;
  if (video.provider === 'youtube' && /^[A-Za-z0-9_-]{11}$/.test(video.externalId)) {
    return <iframe className="aspect-video w-full rounded-2xl bg-ink" src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(video.externalId)}`} title={`Video: ${video.title}`} loading="lazy" referrerPolicy="strict-origin-when-cross-origin" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />;
  }
  const vimeoUrl = video.provider === 'vimeo' ? getVimeoEmbedUrl(video.externalId) : null;
  if (vimeoUrl) {
    return <iframe className="aspect-video w-full rounded-2xl bg-ink" src={vimeoUrl} title={`Video: ${video.title}`} loading="lazy" referrerPolicy="strict-origin-when-cross-origin" allow="fullscreen; picture-in-picture" allowFullScreen />;
  }
  if (video.provider === 'external' && isDirectVideoUrl(video.externalId)) {
    return <video className="aspect-video w-full rounded-2xl bg-ink" src={video.externalId} controls preload="none" aria-label={`Video: ${video.title}`} />;
  }
  return <div className="flex aspect-video items-center justify-center rounded-2xl bg-panel text-sm text-muted">Video source unavailable</div>;
}

export default async function MediaPage() {
  const { videos, audio, unavailable } = await getMedia();

  return (
    <PublicPage title="Media" intro="Walkthroughs, demonstrations, and audio notes from the work behind the products.">
      <section className="wrap pb-24" aria-label="Media library">
        <div className="mb-12 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-rule bg-card p-5 sm:p-6">
          <p className="max-w-[38rem] text-muted">A dedicated library for video and audio. Written context is available in the writing archive.</p>
          <Link href="/content" className="btn btn-quiet">Browse writing <ArrowUpRight size={15} aria-hidden="true" /></Link>
        </div>

        {unavailable ? (
          <Note><p role="status">The media library is temporarily unavailable. Please try again later.</p></Note>
        ) : (
          <>
            <section aria-labelledby="media-videos-title">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="eyebrow">Video</p>
                  <h2 id="media-videos-title" className="mt-2 font-display text-3xl font-semibold tracking-tight">See the work in motion.</h2>
                </div>
                <PlayCircle className="hidden text-forest sm:block" size={30} aria-hidden="true" />
              </div>
              {videos.length === 0 ? (
                <Note><p>No videos published yet. New walkthroughs will appear here when they are ready to share.</p></Note>
              ) : (
                <div className="mt-7 grid gap-8 md:grid-cols-2">
                  {videos.map((video, index) => (
                    <article key={`${video.title}-${index}`} className="rounded-3xl border border-rule bg-card p-4 shadow-soft sm:p-5">
                      <VideoPlayer video={video} />
                      <h3 className="mt-4 font-display text-xl font-semibold tracking-tight">{video.title}</h3>
                      {video.description && <p className="mt-2 whitespace-pre-line text-muted">{video.description}</p>}
                      {video.durationSeconds && <p className="mt-3 font-display text-sm text-muted">{Math.floor(video.durationSeconds / 60)}:{String(video.durationSeconds % 60).padStart(2, '0')}</p>}
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="mt-20" aria-labelledby="media-audio-title">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="eyebrow">Audio</p>
                  <h2 id="media-audio-title" className="mt-2 font-display text-3xl font-semibold tracking-tight">Listen when the screen is away.</h2>
                </div>
                <Headphones className="hidden text-forest sm:block" size={30} aria-hidden="true" />
              </div>
              {audio.length === 0 ? (
                <Note><p>No audio published yet. Audio notes and recordings will appear here when they are ready to share.</p></Note>
              ) : (
                <div className="mt-7 grid gap-4">
                  {audio.map((item) => (
                    <article key={item.id} className="rounded-3xl border border-rule bg-card p-5 shadow-soft sm:p-6">
                      <div className="flex items-start gap-4">
                        <span className="explore-icon shrink-0" aria-hidden="true"><Headphones size={20} /></span>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-display text-xl font-semibold tracking-tight">{item.title}</h3>
                          {item.description && <p className="mt-1 text-muted">{item.description}</p>}
                          <audio className="mt-4 w-full" controls preload="metadata" src={item.url}>Your browser does not support the audio player.</audio>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </section>
    </PublicPage>
  );
}
