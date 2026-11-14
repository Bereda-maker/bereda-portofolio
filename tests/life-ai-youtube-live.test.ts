import test from 'node:test';
import assert from 'node:assert/strict';
import { searchYouTubeVideos } from '../lib/life-ai-youtube';

const hasApiKey = Boolean(process.env.YOUTUBE_API_KEY);

test('live YouTube Data API returns verified beginner React videos', { skip: !hasApiKey }, async () => {
  const result = await searchYouTubeVideos('React tutorial for beginners');
  assert.equal(result.status, 'ok', result.block.type === 'notice' ? result.block.message : 'Unexpected YouTube service response.');
  if (result.status !== 'ok') return;
  assert.ok(result.block.items.length > 0, 'YouTube returned no videos for the live smoke-test query.');
  for (const item of result.block.items) {
    assert.match(item.videoId, /^[A-Za-z0-9_-]{11}$/);
    assert.ok(item.title.trim());
    assert.ok(item.channelTitle.trim());
    assert.match(item.thumbnailUrl, /^https:\/\/(?:i\.ytimg\.com|img\.youtube\.com)\//);
    assert.equal(item.videoUrl, `https://www.youtube.com/watch?v=${item.videoId}`);
    assert.match(item.embedUrl, /^https:\/\/www\.youtube-nocookie\.com\/embed\//);
  }
});
