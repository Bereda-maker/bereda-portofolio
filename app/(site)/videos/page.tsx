import type { Metadata } from 'next';
import Link from 'next/link';
import { desc, eq } from 'drizzle-orm';
import { Note, PublicPage } from '@/components/PublicPage';
import { getVimeoEmbedUrl } from '@/lib/vimeo';

export const metadata: Metadata = {
  title: 'Videos',
  description: 'Video walkthroughs and project demonstrations by Bereda Wako.',
};
export const dynamic = 'force-dynamic';

type Video = {
  title: string;
  description: string | null;
  provider: string;
  externalId: string | null;
  durationSeconds: number | null;
};

async function getVideos(): Promise<{ videos: Video[]; unavailable: boolean }> {
  try {
    const { db } = await import('@/lib/db');
    const { videos } = await import('@/lib/schema');
    const rows = await db.select({
      title: videos.title,
      description: videos.description,
      provider: videos.provider,
      externalId: videos.externalId,
      durationSeconds: videos.durationSeconds,
    }).from(videos).where(eq(videos.isPublished, true)).orderBy(desc(videos.publishedAt));
    return { videos: rows, unavailable: false };
  } catch (error) {
    console.error('[public/videos]', error instanceof Error ? error.message : error);
    return { videos: [], unavailable: true };
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

function Player({ video }: { video: Video }) {
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

export default async function VideosPage() {
  const { videos, unavailable } = await getVideos();
  return (
    <PublicPage title="Videos" intro="Walkthroughs, demonstrations, and the thinking behind selected builds.">
      <section className="wrap pb-24" aria-label="Published videos">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-rule bg-card p-5 sm:p-6">
          <p className="max-w-[38rem] text-muted">I also share written notes and longer-form context alongside the video library.</p>
          <Link href="/content" className="btn btn-quiet">Browse writing</Link>
        </div>
        {unavailable ? (
          <Note><p role="status">Videos are temporarily unavailable. Please try again later.</p></Note>
        ) : videos.length === 0 ? (
          <Note><h2 className="font-display text-xl font-semibold">No videos published yet</h2><p className="mt-2 text-muted">Published videos will appear here when there is real source material to share.</p></Note>
        ) : (
          <div className="grid gap-8 md:grid-cols-2">
            {videos.map((video, index) => (
              <article key={`${video.title}-${index}`} className="rounded-3xl border border-rule bg-card p-4 shadow-soft sm:p-5">
                <Player video={video} />
                <h2 className="mt-4 font-display text-xl font-semibold tracking-tight">{video.title}</h2>
                {video.description && <p className="mt-2 whitespace-pre-line text-muted">{video.description}</p>}
                {video.durationSeconds && <p className="mt-3 font-display text-sm text-muted">{Math.floor(video.durationSeconds / 60)}:{String(video.durationSeconds % 60).padStart(2, '0')}</p>}
              </article>
            ))}
          </div>
        )}
      </section>
    </PublicPage>
  );
}
