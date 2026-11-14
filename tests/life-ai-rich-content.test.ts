import test from 'node:test';
import assert from 'node:assert/strict';
import { BookRecommendationsBlockSchema, LifeAiRichBlockSchema, OpenLibraryBookSchema } from '../lib/life-ai-rich-content';
import { searchYouTubeVideos } from '../lib/life-ai-youtube';
import { parseLifeAiToolPlan } from '../lib/life-ai-tool-plan';
import { appendBookContext, isBookResourceIntent, searchOpenLibraryBooks } from '../lib/life-ai-books';
import { detectLearningBlockRequest, generateLearningContentBlock, parseLearningContentBlock } from '../lib/life-ai-learning';
import { readLifeAiStream } from '../lib/life-ai-stream';

const videoId = 'abcdefghijk';
const thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
const snippet = {
  title: 'React state patterns',
  description: 'A verified test description for React state.',
  channelId: 'UCabc123',
  channelTitle: 'Example React Channel',
  publishedAt: '2025-04-10T12:00:00Z',
  thumbnails: { high: { url: thumbnailUrl } },
};

const previousKey = process.env.YOUTUBE_API_KEY;
const previousAiKey = process.env.AI_API_KEY;
const previousAiBaseUrl = process.env.AI_BASE_URL;
const previousAiProvider = process.env.AI_PROVIDER;
const previousFetch = globalThis.fetch;

test('missing YouTube credentials produce an explicit configuration notice', async () => {
  delete process.env.YOUTUBE_API_KEY;
  const result = await searchYouTubeVideos('react state patterns missing key');
  assert.equal(result.status, 'notice');
  assert.equal(result.block.type, 'notice');
  if (result.block.type === 'notice') assert.match(result.block.message, /YOUTUBE_API_KEY/);
});

test('verified YouTube metadata maps to safe cards and duplicate searches use cache', async () => {
  process.env.YOUTUBE_API_KEY = 'server-test-key';
  let calls = 0;
  globalThis.fetch = async (input) => {
    calls += 1;
    const url = new URL(String(input));
    assert.equal(url.searchParams.get('key'), 'server-test-key');
    if (url.pathname.endsWith('/search')) {
      assert.equal(url.searchParams.get('type'), 'video');
      assert.equal(url.searchParams.get('maxResults'), '6');
      return Response.json({ items: [{ id: { videoId }, snippet }], nextPageToken: 'next-page' });
    }
    assert.ok(url.pathname.endsWith('/videos'));
    assert.equal(url.searchParams.get('id'), videoId);
    assert.equal(url.searchParams.get('part'), 'snippet,contentDetails');
    return Response.json({ items: [{ id: videoId, snippet, contentDetails: { duration: 'PT8M12S' } }] });
  };

  const first = await searchYouTubeVideos('React state patterns cache regression');
  const second = await searchYouTubeVideos('React state patterns cache regression');
  assert.deepEqual(second, first);
  assert.equal(calls, 2);
  assert.equal(first.status, 'ok');
  if (first.status === 'ok') {
    assert.equal(first.block.items.length, 1);
    assert.equal(first.block.items[0]?.durationLabel, '8:12');
    assert.equal(first.block.items[0]?.videoUrl, `https://www.youtube.com/watch?v=${videoId}`);
    assert.equal(first.block.items[0]?.embedUrl, `https://www.youtube-nocookie.com/embed/${videoId}`);
    assert.equal(first.block.items[0]?.thumbnailUrl, thumbnailUrl);
    assert.equal(first.block.nextPageToken, 'next-page');
    assert.equal(LifeAiRichBlockSchema.safeParse(first.block).success, true);
  }
});

test('rich block validation rejects unsafe thumbnails and mismatched watch links', () => {
  const valid = {
    type: 'youtube_videos',
    query: 'react',
    items: [{ videoId, title: 'Test', thumbnailUrl, channelTitle: 'Channel', durationIso8601: 'PT1M', durationLabel: '1:00', publishedAt: '2025-04-10T12:00:00.000Z', description: '', videoUrl: `https://www.youtube.com/watch?v=${videoId}`, embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}` }],
  };
  assert.equal(LifeAiRichBlockSchema.safeParse(valid).success, true);
  assert.equal(LifeAiRichBlockSchema.safeParse({ ...valid, items: [{ ...valid.items[0], thumbnailUrl: 'javascript:alert(1)' }] }).success, false);
  assert.equal(LifeAiRichBlockSchema.safeParse({ ...valid, items: [{ ...valid.items[0], videoUrl: 'https://example.com/fake' }] }).success, false);
});

test('AI resource tool plans accept only bounded, valid JSON actions', () => {
  assert.deepEqual(parseLifeAiToolPlan('{"action":"search_youtube","query":"React hooks tutorial"}'), { action: 'search_youtube', query: 'React hooks tutorial' });
  assert.deepEqual(parseLifeAiToolPlan('{"action":"search_books","query":"books about attention"}'), { action: 'search_books', query: 'books about attention' });
  assert.deepEqual(parseLifeAiToolPlan('{"action":"none"}'), { action: 'none' });
  assert.equal(parseLifeAiToolPlan('{"action":"search_youtube","query":"x"}'), null);
  assert.equal(parseLifeAiToolPlan('{"action":"fetch_url","url":"https://evil.example"}'), null);
});

test('Open Library search maps safe catalog metadata, caches repeated searches, and paginates', async () => {
  let calls = 0;
  globalThis.fetch = async (input, init) => {
    calls += 1;
    const url = new URL(String(input));
    assert.equal(url.hostname, 'openlibrary.org');
    assert.equal(url.pathname, '/search.json');
    assert.equal(url.searchParams.get('limit'), '6');
    assert.equal(url.searchParams.get('page'), '1');
    assert.match(String(new Headers(init?.headers).get('user-agent')), /BeredaPortfolioLifeAI/);
    return Response.json({ start: 0, numFound: 9, docs: [
      { key: '/works/OL123W', title: 'Thinking Clearly', author_name: ['A. Reader'], first_publish_year: 2022, cover_i: 501, first_sentence: ['A short catalog preview.'], subject: ['Decision making', 'Psychology'], ratings_average: 4.2, ratings_count: 87 },
      { key: '/works/not-an-id', title: 'Untrusted record', author_name: ['A. Reader'], first_publish_year: 2020 },
    ] });
  };
  const first = await searchOpenLibraryBooks('books about clear thinking unique-test');
  const second = await searchOpenLibraryBooks('books about clear thinking unique-test');
  assert.deepEqual(second, first);
  assert.equal(calls, 1);
  assert.equal(first.status, 'ok');
  if (first.status === 'ok') {
    assert.equal(first.block.type, 'book_recommendations');
    assert.equal(first.block.items.length, 1);
    assert.equal(first.block.items[0]?.bookUrl, 'https://openlibrary.org/works/OL123W');
    assert.equal(first.block.items[0]?.coverUrl, 'https://covers.openlibrary.org/b/id/501-M.jpg?default=false');
    assert.equal(first.block.items[0]?.ratingsAverage, 4.2);
    assert.equal(first.block.nextPage, 2);
    assert.equal(BookRecommendationsBlockSchema.safeParse(first.block).success, true);
    assert.match(appendBookContext('system', first.block), /untrusted external data/);
  }
  assert.equal(isBookResourceIntent('Could you recommend books about attention?'), true);
  assert.equal(isBookResourceIntent('Help me make a weekly plan.'), false);
});

test('book block schema rejects non-Open Library links and image hosts', () => {
  const book = { workId: 'OL123W', title: 'Thinking Clearly', authors: ['A. Reader'], firstPublishYear: 2022, coverUrl: 'https://covers.openlibrary.org/b/id/501-M.jpg?default=false', bookUrl: 'https://openlibrary.org/works/OL123W', description: null, subjects: [], ratingsAverage: null, ratingsCount: null };
  assert.equal(OpenLibraryBookSchema.safeParse(book).success, true);
  assert.equal(OpenLibraryBookSchema.safeParse({ ...book, coverUrl: 'https://evil.example/cover.jpg' }).success, false);
  assert.equal(OpenLibraryBookSchema.safeParse({ ...book, bookUrl: 'https://example.com/books/OL123W' }).success, false);
  assert.equal(LifeAiRichBlockSchema.safeParse({ type: 'book_recommendations', query: 'attention', items: [book], nextPage: 2 }).success, true);
});

test('learning requests create bounded structured roadmap and checklist blocks', () => {
  assert.deepEqual(detectLearningBlockRequest('Help me learn React with a roadmap.'), { type: 'learning_roadmap' });
  assert.deepEqual(detectLearningBlockRequest('Make a checklist for reviewing my week.'), { type: 'interactive_checklist' });
  assert.equal(detectLearningBlockRequest('What is React?'), null);
  const roadmap = { type: 'learning_roadmap', topic: 'React', title: 'Learn React', summary: 'Build up skills through practice.', steps: [
    { id: 'step-1', title: 'Components', goal: 'Understand component composition.', practice: 'Build a profile card from small components.', estimatedMinutes: 35 },
    { id: 'step-2', title: 'State', goal: 'Understand local state updates.', practice: 'Add an interactive counter to the card.', estimatedMinutes: 40 },
  ] };
  const parsedRoadmap = parseLearningContentBlock(JSON.stringify(roadmap), { type: 'learning_roadmap' });
  assert.deepEqual(parsedRoadmap, roadmap);
  assert.equal(LifeAiRichBlockSchema.safeParse(roadmap).success, true);
  assert.equal(parseLearningContentBlock(JSON.stringify({ ...roadmap, steps: [roadmap.steps[0], { ...roadmap.steps[1], id: 'step-1' }] }), { type: 'learning_roadmap' }), null);
  const checklist = { type: 'interactive_checklist', title: 'Weekly review', items: [{ id: 'review-calendar', label: 'Review commitments', detail: null }, { id: 'choose-priority', label: 'Choose one priority', detail: 'Keep the next action small.' }] };
  assert.deepEqual(parseLearningContentBlock(JSON.stringify(checklist), { type: 'interactive_checklist' }), checklist);
  assert.equal(parseLearningContentBlock(JSON.stringify({ ...checklist, unsafeHtml: '<script/>' }), { type: 'interactive_checklist' }), null);
});

test('roadmap generation sends a schema-constrained server request and validates its response', async () => {
  process.env.AI_API_KEY = 'server-only-test-key';
  process.env.AI_PROVIDER = 'openai';
  process.env.AI_BASE_URL = 'https://ai.example.test/v1';
  const roadmap = { type: 'learning_roadmap', topic: 'React', title: 'Learn React', summary: 'Practice one concept at a time.', steps: [
    { id: 'step-1', title: 'Components', goal: 'Understand reusable UI pieces.', practice: 'Create a profile card component.', estimatedMinutes: 30 },
    { id: 'step-2', title: 'State', goal: 'Understand local updates.', practice: 'Add a counter with a button.', estimatedMinutes: 35 },
  ] };
  globalThis.fetch = async (input, init) => {
    assert.equal(String(input), 'https://ai.example.test/v1/chat/completions');
    assert.equal(new Headers(init?.headers).get('authorization'), 'Bearer server-only-test-key');
    const body = JSON.parse(String(init?.body)) as { response_format?: { type?: string }; messages?: Array<{ content?: string }> };
    assert.equal(body.response_format?.type, 'json_object');
    assert.match(body.messages?.[0]?.content ?? '', /Do not invent external resources/);
    assert.match(body.messages?.[1]?.content ?? '', /Help me learn React/);
    return Response.json({ choices: [{ message: { content: JSON.stringify(roadmap) } }] });
  };
  const result = await generateLearningContentBlock({ message: 'Help me learn React', request: { type: 'learning_roadmap' }, authorizedContext: 'Interests: web development' });
  assert.deepEqual(result, roadmap);
});

test('stream parser handles split UTF-8 and SSE frames without duplicating deltas or blocks', async () => {
  const block = { type: 'notice', provider: 'youtube', tone: 'info', title: 'Verified', message: 'No fabricated links.' };
  const payload = [
    { type: 'meta', conversationId: 7 },
    { type: 'delta', content: 'A streamed answer: **React** ' },
    { type: 'block', block },
    { type: 'delta', content: 'resources.' },
    { type: 'done' },
  ].map((event) => `data: ${JSON.stringify(event)}\r\n\r\n`).join('');
  const bytes = new TextEncoder().encode(payload);
  const chunks = Array.from({ length: Math.ceil(bytes.length / 7) }, (_, index) => bytes.slice(index * 7, (index + 1) * 7));
  const stream = new ReadableStream<Uint8Array>({ start(controller) { for (const chunk of chunks) controller.enqueue(chunk); controller.close(); } });
  const events = [];
  for await (const event of readLifeAiStream(stream)) events.push(event);
  assert.deepEqual(events.map((event) => event.type), ['meta', 'delta', 'block', 'delta', 'done']);
  assert.equal(events.filter((event) => event.type === 'block').length, 1);
  assert.deepEqual(events.filter((event) => event.type === 'delta').map((event) => event.content).join(''), 'A streamed answer: **React** resources.');
});

test.after(() => {
  if (previousKey === undefined) delete process.env.YOUTUBE_API_KEY;
  else process.env.YOUTUBE_API_KEY = previousKey;
  if (previousAiKey === undefined) delete process.env.AI_API_KEY;
  else process.env.AI_API_KEY = previousAiKey;
  if (previousAiBaseUrl === undefined) delete process.env.AI_BASE_URL;
  else process.env.AI_BASE_URL = previousAiBaseUrl;
  if (previousAiProvider === undefined) delete process.env.AI_PROVIDER;
  else process.env.AI_PROVIDER = previousAiProvider;
  globalThis.fetch = previousFetch;
});
