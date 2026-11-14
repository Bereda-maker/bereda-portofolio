'use client';

import { useState } from 'react';
import { BookOpen, BookmarkCheck, Check, Heart, Loader2, Play, RotateCcw, Search } from 'lucide-react';
import type { BookRecommendationsBlock, GoalProgressChartBlock, InteractiveChecklistBlock, LearningRoadmapBlock, LifeAiRichBlock, OpenLibraryBook, YouTubeVideo } from '@/lib/life-ai-rich-content';

export type VideoResourceState = { isFavorite: boolean; isWatched: boolean };
export type VideoResourceAction = 'favorite' | 'unfavorite' | 'watched' | 'unwatched';
export type BookResourceState = { isFavorite: boolean; isRead: boolean };
export type BookResourceAction = VideoResourceAction;

type Props = {
  block: LifeAiRichBlock;
  states: Record<string, VideoResourceState>;
  bookStates: Record<string, BookResourceState>;
  onVideoAction: (video: YouTubeVideo, action: VideoResourceAction) => void;
  onBookAction: (book: OpenLibraryBook, action: BookResourceAction) => void;
  onMore: (block: Extract<LifeAiRichBlock, { type: 'youtube_videos' }>) => void;
  onMoreBooks: (block: BookRecommendationsBlock) => void;
  onRelatedVideos?: (query: string) => void;
  loadingMore?: boolean;
};

function YouTubeVideoCard({ video, state, onAction }: { video: YouTubeVideo; state: VideoResourceState; onAction: (action: VideoResourceAction) => void }) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const published = new Intl.DateTimeFormat('en', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' }).format(new Date(video.publishedAt));
  return <article className="life-ai-video-card">
    <a className="life-ai-video-thumb" href={video.videoUrl} target="_blank" rel="noopener noreferrer" aria-label={`Watch ${video.title} on YouTube`}>
      <img src={video.thumbnailUrl} alt={`Thumbnail for ${video.title}`} loading="lazy" decoding="async" />
      <span className="life-ai-video-play" aria-hidden="true"><Play size={17} fill="currentColor" /></span>
      <span className="life-ai-video-duration">{video.durationLabel}</span>
    </a>
    <div className="life-ai-video-copy">
      <a className="life-ai-video-title" href={video.videoUrl} target="_blank" rel="noopener noreferrer">{video.title}</a>
      <div className="life-ai-video-meta"><span>{video.channelTitle}</span><span aria-hidden="true">·</span><time dateTime={video.publishedAt}>{published}</time>{video.viewCount !== undefined && <><span aria-hidden="true">·</span><span>{new Intl.NumberFormat('en-US').format(video.viewCount)} views</span></>}{video.likeCount !== undefined && <><span aria-hidden="true">·</span><span>{new Intl.NumberFormat('en-US').format(video.likeCount)} likes</span></>}</div>
      {video.description && <p>{video.description}</p>}
      <div className="life-ai-video-actions">
        <a className="life-ai-video-watch" href={video.videoUrl} target="_blank" rel="noopener noreferrer">Watch on YouTube</a>
        <button type="button" aria-expanded={previewOpen} onClick={() => setPreviewOpen((open) => !open)}>{previewOpen ? 'Close preview' : 'Preview here'}</button>
        <button type="button" className={state.isFavorite ? 'active' : ''} aria-pressed={state.isFavorite} onClick={() => onAction(state.isFavorite ? 'unfavorite' : 'favorite')}><Heart size={14} fill={state.isFavorite ? 'currentColor' : 'none'} />{state.isFavorite ? 'Saved' : 'Save'}</button>
        <button type="button" className={state.isWatched ? 'active' : ''} aria-pressed={state.isWatched} onClick={() => onAction(state.isWatched ? 'unwatched' : 'watched')}><BookmarkCheck size={14} />{state.isWatched ? 'Watched' : 'Mark watched'}</button>
      </div>
    </div>
    {previewOpen && <div className="life-ai-video-embed"><iframe src={video.embedUrl} title={`YouTube video: ${video.title}`} loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen /></div>}
  </article>;
}

function OpenLibraryBookCard({ book, state, onAction }: { book: OpenLibraryBook; state: BookResourceState; onAction: (action: BookResourceAction) => void }) {
  const [coverFailed, setCoverFailed] = useState(false);
  return <article className="life-ai-book-card">
    <a className="life-ai-book-cover" href={book.bookUrl} target="_blank" rel="noopener noreferrer" aria-label={`Open ${book.title} in Open Library`}>
      {book.coverUrl && !coverFailed ? <img src={book.coverUrl} alt={`Cover of ${book.title}`} loading="lazy" decoding="async" onError={() => setCoverFailed(true)} /> : <span aria-hidden="true"><BookOpen size={28} /></span>}
    </a>
    <div className="life-ai-book-copy">
      <a className="life-ai-book-title" href={book.bookUrl} target="_blank" rel="noopener noreferrer">{book.title}</a>
      <p className="life-ai-book-author">{book.authors.join(', ')}</p>
      <div className="life-ai-book-meta"><span>{book.firstPublishYear ?? 'Publication year unavailable'}</span>{book.ratingsAverage !== null && book.ratingsCount !== null && book.ratingsCount > 0 && <span>Open Library rating {book.ratingsAverage.toFixed(1)} ({book.ratingsCount.toLocaleString()})</span>}</div>
      {book.description && <p className="life-ai-book-description">{book.description}</p>}
      {book.subjects.length > 0 && <div className="life-ai-book-subjects">{book.subjects.slice(0, 3).map((subject) => <span key={subject}>{subject}</span>)}</div>}
      <div className="life-ai-video-actions">
        <a className="life-ai-video-watch" href={book.bookUrl} target="_blank" rel="noopener noreferrer">Open Library record</a>
        <button type="button" className={state.isFavorite ? 'active' : ''} aria-pressed={state.isFavorite} onClick={() => onAction(state.isFavorite ? 'unfavorite' : 'favorite')}><Heart size={14} fill={state.isFavorite ? 'currentColor' : 'none'} />{state.isFavorite ? 'Saved' : 'Save'}</button>
        <button type="button" className={state.isRead ? 'active' : ''} aria-pressed={state.isRead} onClick={() => onAction(state.isRead ? 'unwatched' : 'watched')}><BookmarkCheck size={14} />{state.isRead ? 'Read' : 'Mark read'}</button>
      </div>
    </div>
  </article>;
}

export default function LifeAIRichBlockRenderer({ block, states, bookStates, onVideoAction, onBookAction, onMore, onMoreBooks, onRelatedVideos, loadingMore }: Props) {
  if (block.type === 'notice') return <aside className={`life-ai-rich-notice ${block.tone}`} role="status"><strong>{block.title}</strong><p>{block.message}</p>{block.action && <a className="life-ai-rich-notice-action" href={block.action.url} target="_blank" rel="noopener noreferrer">{block.action.label}</a>}</aside>;
  if (block.type === 'youtube_videos') return <section className="life-ai-video-results" aria-label={`YouTube video recommendations for ${block.query}`}>
    <div className="life-ai-video-results-head"><div><span className="admin-eyebrow">Verified YouTube results</span><h3>{block.query}</h3></div><div className="life-ai-video-results-tools">{onRelatedVideos && <button type="button" onClick={() => onRelatedVideos(block.query)}><Search size={14} /> Related videos</button>}<span>{block.items.length} {block.items.length === 1 ? 'video' : 'videos'}</span></div></div>
    {block.items.length ? <div className="life-ai-video-grid">{block.items.map((video) => <YouTubeVideoCard key={video.videoId} video={video} state={states[video.videoId] ?? { isFavorite: false, isWatched: false }} onAction={(action) => onVideoAction(video, action)} />)}</div> : <p className="life-ai-video-empty">No matching videos were returned by YouTube for this search.</p>}
    {block.nextPageToken && <button type="button" className="life-ai-video-more" onClick={() => onMore(block)} disabled={loadingMore}>{loadingMore ? <><Loader2 size={15} className="life-ai-spin" /> Loading more videos…</> : <><RotateCcw size={15} /> More videos</>}</button>}
  </section>;
  if (block.type === 'book_recommendations') return <section className="life-ai-book-results" aria-label={`Open Library book recommendations for ${block.query}`}>
    <div className="life-ai-video-results-head"><div><span className="admin-eyebrow">Open Library catalog</span><h3>{block.query}</h3></div><span>{block.items.length} {block.items.length === 1 ? 'book' : 'books'}</span></div>
    {block.items.length ? <div className="life-ai-book-grid">{block.items.map((book) => <OpenLibraryBookCard key={book.workId} book={book} state={bookStates[book.workId] ?? { isFavorite: false, isRead: false }} onAction={(action) => onBookAction(book, action)} />)}</div> : <p className="life-ai-video-empty">Open Library returned no matching books for this search.</p>}
    <p className="life-ai-book-source">Book metadata and covers from Open Library.</p>
    {block.nextPage && <button type="button" className="life-ai-video-more" onClick={() => onMoreBooks(block)} disabled={loadingMore}>{loadingMore ? <><Loader2 size={15} className="life-ai-spin" /> Loading more books…</> : <><RotateCcw size={15} /> More books</>}</button>}
  </section>;
  if (block.type === 'learning_roadmap') return <LearningRoadmapCard block={block} />;
  if (block.type === 'goal_progress_chart') return <GoalProgressChart block={block} />;
  return <InteractiveChecklistCard block={block} />;
}

function GoalProgressChart({ block }: { block: GoalProgressChartBlock }) {
  return <section className="life-ai-learning-card life-ai-goal-chart" aria-label={block.title}>
    <div className="life-ai-learning-head"><span className="admin-eyebrow">Profile progress snapshot</span><h3>{block.title}</h3><p>Progress values are taken directly from the goals you entered in My Life Profile.</p></div>
    <div className="life-ai-goal-chart-rows">{block.items.map((item) => <div className="life-ai-goal-chart-row" key={item.id}>
      <div><strong>{item.label}</strong><span>{item.status.replace('_', ' ')}</span></div>
      <progress value={item.progressPercent} max={100} aria-label={`${item.label}: ${item.progressPercent}%`} />
      <b>{item.progressPercent}%</b>
    </div>)}</div>
    <small className="life-ai-goal-chart-source">Source: {block.sourceLabel}</small>
  </section>;
}

function LearningRoadmapCard({ block }: { block: LearningRoadmapBlock }) {
  const [completed, setCompleted] = useState<string[]>([]);
  const progress = Math.round(completed.length / block.steps.length * 100);
  function toggle(id: string) { setCompleted((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]); }
  return <section className="life-ai-learning-card" aria-label={`Interactive roadmap: ${block.title}`}>
    <div className="life-ai-learning-head"><span className="admin-eyebrow">Learning roadmap · {block.topic}</span><h3>{block.title}</h3><p>{block.summary}</p></div>
    <div className="life-ai-learning-progress"><div><span>Your progress</span><strong>{completed.length} of {block.steps.length} steps</strong></div><progress value={completed.length} max={block.steps.length} aria-label={`Roadmap progress: ${progress}% complete`} /><small>{progress}% complete</small></div>
    <ol className="life-ai-roadmap-steps">{block.steps.map((step, index) => {
      const done = completed.includes(step.id);
      return <li className={done ? 'is-complete' : ''} key={step.id}><label className="life-ai-step-check"><input type="checkbox" checked={done} onChange={() => toggle(step.id)} aria-label={`${done ? 'Mark incomplete' : 'Mark complete'}: ${step.title}`} /><span className="life-ai-step-number">{done ? <Check size={14} /> : index + 1}</span><span className="life-ai-step-copy"><strong>{step.title}</strong><span>{step.goal}</span><small>{step.practice}</small></span><span className="life-ai-step-time">{step.estimatedMinutes} min</span></label></li>;
    })}</ol>
  </section>;
}

function InteractiveChecklistCard({ block }: { block: InteractiveChecklistBlock }) {
  const [completed, setCompleted] = useState<string[]>([]);
  const progress = Math.round(completed.length / block.items.length * 100);
  function toggle(id: string) { setCompleted((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]); }
  return <section className="life-ai-learning-card life-ai-checklist-card" aria-label={`Interactive checklist: ${block.title}`}>
    <div className="life-ai-learning-head"><span className="admin-eyebrow">Interactive checklist</span><h3>{block.title}</h3></div>
    <div className="life-ai-learning-progress"><div><span>Completed</span><strong>{completed.length} of {block.items.length} items</strong></div><progress value={completed.length} max={block.items.length} aria-label={`Checklist progress: ${progress}% complete`} /><small>{progress}% complete</small></div>
    <ul className="life-ai-checklist-items">{block.items.map((item) => {
      const done = completed.includes(item.id);
      return <li className={done ? 'is-complete' : ''} key={item.id}><label><input type="checkbox" checked={done} onChange={() => toggle(item.id)} /><span><strong>{item.label}</strong>{item.detail && <small>{item.detail}</small>}</span></label></li>;
    })}</ul>
  </section>;
}
