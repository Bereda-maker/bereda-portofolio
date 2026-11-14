import { z } from 'zod';

const SafeThumbnailUrl = z.string().url().max(2048).refine((value) => {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && (url.hostname === 'i.ytimg.com' || url.hostname === 'img.youtube.com');
  } catch { return false; }
}, 'Thumbnail must come from a YouTube image host.');

export const YouTubeVideoSchema = z.object({
  videoId: z.string().regex(/^[A-Za-z0-9_-]{11}$/),
  title: z.string().trim().min(1).max(200),
  thumbnailUrl: SafeThumbnailUrl,
  channelTitle: z.string().trim().min(1).max(160),
  channelId: z.string().trim().max(64).optional(),
  durationIso8601: z.string().max(32).nullable(),
  durationLabel: z.string().max(32),
  publishedAt: z.string().datetime({ offset: true }),
  description: z.string().max(600),
  videoUrl: z.string().url().max(2048).refine((value) => /^https:\/\/www\.youtube\.com\/watch\?v=[A-Za-z0-9_-]{11}$/.test(value)),
  embedUrl: z.string().url().max(2048).refine((value) => /^https:\/\/www\.youtube-nocookie\.com\/embed\/[A-Za-z0-9_-]{11}$/.test(value)),
}).strict();

export const YouTubeVideosBlockSchema = z.object({
  type: z.literal('youtube_videos'),
  query: z.string().trim().min(1).max(120),
  items: z.array(YouTubeVideoSchema).max(30),
  nextPageToken: z.string().max(2048).optional(),
}).strict();

const SafeBookCoverUrl = z.string().url().max(2048).refine((value) => {
  try { const url = new URL(value); return url.protocol === 'https:' && url.hostname === 'covers.openlibrary.org'; }
  catch { return false; }
}, 'Book covers must come from Open Library.');

export const OpenLibraryBookSchema = z.object({
  workId: z.string().regex(/^OL\d+W$/),
  title: z.string().trim().min(1).max(200),
  authors: z.array(z.string().trim().min(1).max(120)).min(1).max(4),
  firstPublishYear: z.number().int().min(1000).max(3000).nullable(),
  coverUrl: SafeBookCoverUrl.nullable(),
  bookUrl: z.string().url().max(2048).refine((value) => /^https:\/\/openlibrary\.org\/works\/OL\d+W$/.test(value)),
  description: z.string().max(500).nullable(),
  subjects: z.array(z.string().trim().min(1).max(80)).max(4),
  ratingsAverage: z.number().min(0).max(5).nullable(),
  ratingsCount: z.number().int().min(0).nullable(),
}).strict();

export const BookRecommendationsBlockSchema = z.object({
  type: z.literal('book_recommendations'),
  query: z.string().trim().min(1).max(120),
  items: z.array(OpenLibraryBookSchema).max(30),
  nextPage: z.number().int().min(2).max(1000).optional(),
}).strict();

export const NoticeBlockSchema = z.object({
  type: z.literal('notice'),
  provider: z.enum(['youtube', 'books']),
  tone: z.enum(['info', 'warning', 'error']),
  title: z.string().trim().min(1).max(120),
  message: z.string().trim().min(1).max(500),
}).strict();

const LearningStepSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]{1,32}$/),
  title: z.string().trim().min(1).max(120),
  goal: z.string().trim().min(1).max(280),
  practice: z.string().trim().min(1).max(280),
  estimatedMinutes: z.number().int().min(5).max(240),
}).strict();

export const LearningRoadmapBlockSchema = z.object({
  type: z.literal('learning_roadmap'),
  topic: z.string().trim().min(1).max(120),
  title: z.string().trim().min(1).max(140),
  summary: z.string().trim().min(1).max(400),
  steps: z.array(LearningStepSchema).min(2).max(8).superRefine((steps, context) => {
    if (new Set(steps.map((step) => step.id)).size !== steps.length) context.addIssue({ code: z.ZodIssueCode.custom, message: 'Roadmap step IDs must be unique.' });
  }),
}).strict();

export const InteractiveChecklistBlockSchema = z.object({
  type: z.literal('interactive_checklist'),
  title: z.string().trim().min(1).max(140),
  items: z.array(z.object({
    id: z.string().regex(/^[a-z0-9-]{1,32}$/),
    label: z.string().trim().min(1).max(160),
    detail: z.string().trim().max(240).nullable(),
  }).strict()).min(2).max(12).superRefine((items, context) => {
    if (new Set(items.map((item) => item.id)).size !== items.length) context.addIssue({ code: z.ZodIssueCode.custom, message: 'Checklist item IDs must be unique.' });
  }),
}).strict();

export const GoalProgressChartBlockSchema = z.object({
  type: z.literal('goal_progress_chart'),
  title: z.string().trim().min(1).max(120),
  sourceLabel: z.literal('Your My Life Profile'),
  items: z.array(z.object({
    id: z.string().trim().min(1).max(80),
    label: z.string().trim().min(1).max(120),
    progressPercent: z.number().int().min(0).max(100),
    status: z.enum(['not_started', 'in_progress', 'paused', 'completed']),
  }).strict()).min(1).max(12),
}).strict();

export const LifeAiRichBlockSchema = z.discriminatedUnion('type', [YouTubeVideosBlockSchema, BookRecommendationsBlockSchema, NoticeBlockSchema, LearningRoadmapBlockSchema, InteractiveChecklistBlockSchema, GoalProgressChartBlockSchema]);
export const LifeAiRichBlocksSchema = z.array(LifeAiRichBlockSchema).max(8);

export type YouTubeVideo = z.infer<typeof YouTubeVideoSchema>;
export type YouTubeVideosBlock = z.infer<typeof YouTubeVideosBlockSchema>;
export type OpenLibraryBook = z.infer<typeof OpenLibraryBookSchema>;
export type BookRecommendationsBlock = z.infer<typeof BookRecommendationsBlockSchema>;
export type NoticeBlock = z.infer<typeof NoticeBlockSchema>;
export type LearningRoadmapBlock = z.infer<typeof LearningRoadmapBlockSchema>;
export type InteractiveChecklistBlock = z.infer<typeof InteractiveChecklistBlockSchema>;
export type GoalProgressChartBlock = z.infer<typeof GoalProgressChartBlockSchema>;
export type LifeAiRichBlock = z.infer<typeof LifeAiRichBlockSchema>;
