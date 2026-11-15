import { aiProvider } from './providers';
import type { HackathonCandidate, HackathonSource } from '@/lib/hackathons';
import { eligibilityFromText, normalizeUrl } from '@/lib/hackathons';

export const VERIFIED_TECHNICAL_SKILLS = [
  'full-stack', 'JavaScript', 'TypeScript', 'React', 'Next.js', 'Node.js',
  'PostgreSQL', 'APIs', 'AI integration', 'software engineering', 'entrepreneurship',
] as const;

export const STARTUP_THEMES = ['Deborah School', 'TenaSew', 'EthioVista', 'Negus Gebeya', 'Personal / General'] as const;
const CACHE_TTL_MS = 60 * 60 * 1000;
const MIN_REQUEST_INTERVAL_MS = 250;
let nextRequestAt = 0;
const memoryCache = new Map<string, { expiresAt: number; results: SerpResult[] }>();

export type SerpResult = { title?: string; link?: string; snippet?: string; displayed_link?: string };
export type SearchContext = { skills?: string[]; startupThemes?: string[] };
export type SearchProviderStatus = { configured: boolean; mode: 'configured' | 'missing_key'; lastError?: string };
export type SearchSourceStatus = { sourceId: string; sourceName: string; status: 'searched' | 'cached' | 'failed' | 'not_configured'; candidates: number; error?: string };
export type SearchOutcome = { candidates: HackathonCandidate[]; warnings: string[]; searches: number; cacheHits: number; usage: SearchUsage; sourceStatuses: SearchSourceStatus[] };
export type SearchUsage = { provider: 'serpapi'; searches: number; cacheHits: number; officialPagesFetched: number; leads: number };
export type SearchCacheAdapter = {
  get: (cacheKey: string) => Promise<SerpResult[] | null>;
  set: (cacheKey: string, value: { sourceId: string; query: string; context: SearchContext; results: SerpResult[]; expiresAt: Date }) => Promise<void>;
};

export class SerpApiError extends Error {
  readonly code: 'missing_key' | 'unauthorized' | 'quota' | 'rate_limited' | 'provider_error';
  constructor(code: SerpApiError['code'], message: string) { super(message); this.name = 'SerpApiError'; this.code = code; }
}

export function serpApiStatus(): SearchProviderStatus {
  return process.env.SERPAPI_API_KEY ? { configured: true, mode: 'configured' } : { configured: false, mode: 'missing_key' };
}
export function normalizeSearchQuery(query: string): string { return query.trim().toLowerCase().replace(/\s+/g, ' '); }
export function makeSearchCacheKey(sourceId: string, query: string, context: SearchContext = {}): string {
  return [sourceId, normalizeSearchQuery(query), ...(context.skills ?? []).map((x) => x.trim().toLowerCase()).sort(), ...(context.startupThemes ?? []).map((x) => x.trim().toLowerCase()).sort()].join('|');
}
async function waitForRequestSlot(now: () => number): Promise<void> {
  const wait = Math.max(0, nextRequestAt - now());
  if (wait) await new Promise((resolve) => setTimeout(resolve, wait));
  nextRequestAt = now() + MIN_REQUEST_INTERVAL_MS;
}
export function isAllowedOfficialUrl(source: HackathonSource, value: string): boolean {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return false;
    const host = url.hostname.toLowerCase();
    return (source.hostPatterns ?? []).some((pattern) => host === pattern || host.endsWith(`.${pattern}`));
  } catch { return false; }
}
export function buildSourceQuery(source: HackathonSource, context: SearchContext = {}): string {
  const skills = [...new Set([...(context.skills ?? []), ...VERIFIED_TECHNICAL_SKILLS])].join(' ');
  const themes = [...new Set([...(context.startupThemes ?? []), ...STARTUP_THEMES])].join(' ');
  return `site:${source.hostPatterns?.[0] ?? new URL(source.url).hostname} hackathon challenge competition ${skills} ${themes}`;
}

function htmlText(html: string): { title: string; text: string } {
  const title = (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().slice(0, 240);
  const text = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
  return { title, text: text.slice(0, 12000) };
}
function dateValue(value: unknown): Date | null { if (typeof value !== 'string' || !value.trim()) return null; const date = new Date(value); return Number.isNaN(date.getTime()) ? null : date; }

async function extractOfficial(source: HackathonSource, result: SerpResult): Promise<{ candidate: HackathonCandidate | null; warning?: string }> {
  const officialUrl = normalizeUrl(result.link ?? '');
  if (!officialUrl || !isAllowedOfficialUrl(source, officialUrl)) return { candidate: null };
  try {
    const response = await fetch(officialUrl, { headers: { accept: 'text/html', 'user-agent': 'BeredaPortfolio/1.0 evidence discovery' }, signal: AbortSignal.timeout(8000) });
    if (!response.ok) return { candidate: null, warning: `${source.name}: official page returned HTTP ${response.status}.` };
    const page = htmlText(await response.text());
    const ai = await aiProvider.complete({
      json: true,
      system: 'Extract only facts explicitly present in the supplied official page text. Return JSON only. Never infer, use search snippets, or invent values. Use null for absent fields.',
      prompt: JSON.stringify({ pageText: page.text, searchTitle: result.title ?? '', schema: { title: 'string|null', organizer: 'string|null', description: 'string|null', themes: 'string[]', format: 'online|hybrid|in_person|unknown', location: 'string|null', countryEligibility: 'string|null', eligibility: 'allowed|not_allowed|unknown', deadline: 'ISO date|null', startsAt: 'ISO date|null', endsAt: 'ISO date|null', prize: 'string|null', cost: 'string|null', teamRequirements: 'string|null', evidenceExcerpt: 'string|null' } }),
    });
    if (ai.status !== 'ok') {
      return { candidate: { title: page.title || result.title || 'Untitled hackathon', organizer: source.name, officialUrl, registrationUrl: officialUrl, description: null, themes: [], format: 'unknown', location: null, countryEligibility: null, eligibility: 'unknown', deadline: null, startsAt: null, endsAt: null, prize: null, cost: null, teamRequirements: null, evidenceExcerpt: null, sourceTitle: page.title || result.title || null, publisher: new URL(officialUrl).hostname, capturedAt: new Date() }, warning: `${source.name}: AI extraction unavailable; saved as an unverified lead with no inferred fields.` };
    }
    let extracted: Record<string, unknown>;
    try { extracted = JSON.parse(ai.data.text.replace(/^```json\s*|\s*```$/g, '')) as Record<string, unknown>; } catch { return { candidate: null, warning: `${source.name}: official page extraction returned invalid JSON; result not saved.` }; }
    const pageEvidence = typeof extracted.evidenceExcerpt === 'string' ? extracted.evidenceExcerpt.slice(0, 1200) : null;
    return { candidate: { title: typeof extracted.title === 'string' && extracted.title.trim() ? extracted.title.trim() : page.title || result.title || 'Untitled hackathon', organizer: typeof extracted.organizer === 'string' && extracted.organizer.trim() ? extracted.organizer.trim() : source.name, officialUrl, registrationUrl: officialUrl, description: typeof extracted.description === 'string' ? extracted.description.slice(0, 4000) : null, themes: Array.isArray(extracted.themes) ? extracted.themes.filter((x): x is string => typeof x === 'string').slice(0, 20) : [], format: extracted.format === 'online' || extracted.format === 'hybrid' || extracted.format === 'in_person' ? extracted.format : 'unknown', location: typeof extracted.location === 'string' ? extracted.location : null, countryEligibility: typeof extracted.countryEligibility === 'string' ? extracted.countryEligibility : null, eligibility: extracted.eligibility === 'allowed' || extracted.eligibility === 'not_allowed' ? extracted.eligibility : eligibilityFromText(page.text), deadline: dateValue(extracted.deadline), startsAt: dateValue(extracted.startsAt), endsAt: dateValue(extracted.endsAt), prize: typeof extracted.prize === 'string' ? extracted.prize : null, cost: typeof extracted.cost === 'string' ? extracted.cost : null, teamRequirements: typeof extracted.teamRequirements === 'string' ? extracted.teamRequirements : null, evidenceExcerpt: pageEvidence, sourceTitle: page.title || result.title || null, publisher: new URL(officialUrl).hostname, capturedAt: new Date() } };
  } catch (error) { return { candidate: null, warning: `${source.name}: could not fetch an approved official page (${error instanceof Error ? error.message : 'unknown error'}).` }; }
}

export function createSerpApiProvider(options: { fetcher?: typeof fetch; now?: () => number; cache?: SearchCacheAdapter } = {}) {
  const fetcher = options.fetcher ?? fetch;
  const now = options.now ?? Date.now;
  return {
    async search(source: HackathonSource, query: string, context: SearchContext = {}) {
      const apiKey = process.env.SERPAPI_API_KEY;
      if (!apiKey) throw new SerpApiError('missing_key', 'SerpApi is not configured. Set SERPAPI_API_KEY on the server.');
      const key = makeSearchCacheKey(source.id, query, context);
      const cached = memoryCache.get(key);
      if (cached && cached.expiresAt > now()) return { results: cached.results, cached: true, cacheKey: key };
      const durableCached = options.cache ? await options.cache.get(key) : null;
      if (durableCached) {
        memoryCache.set(key, { expiresAt: now() + CACHE_TTL_MS, results: durableCached });
        return { results: durableCached, cached: true, cacheKey: key };
      }
      await waitForRequestSlot(now);
      const url = new URL('https://serpapi.com/search');
      url.searchParams.set('api_key', apiKey); url.searchParams.set('engine', 'google'); url.searchParams.set('q', query); url.searchParams.set('output', 'json'); url.searchParams.set('num', '5'); url.searchParams.set('start', '0');
      const response = await fetcher(url, { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(10000) });
      if (response.status === 401 || response.status === 403) throw new SerpApiError('unauthorized', 'SerpApi rejected the server key (401/403).');
      if (response.status === 429) throw new SerpApiError('rate_limited', 'SerpApi rate limit reached (429).');
      if (!response.ok) throw new SerpApiError('provider_error', `SerpApi returned HTTP ${response.status}.`);
      const payload = await response.json() as { organic_results?: SerpResult[]; error?: string };
      if (payload.error) {
        const message = payload.error.toLowerCase();
        const code = message.includes('invalid') || message.includes('api key') || message.includes('unauthorized') ? 'unauthorized' : 'quota';
        throw new SerpApiError(code, code === 'unauthorized' ? 'SerpApi rejected the server key.' : 'SerpApi reported a quota or account error.');
      }
      const results = Array.isArray(payload.organic_results) ? payload.organic_results : [];
      memoryCache.set(key, { expiresAt: now() + CACHE_TTL_MS, results });
      if (options.cache) await options.cache.set(key, { sourceId: source.id, query, context, results, expiresAt: new Date(now() + CACHE_TTL_MS) });
      return { results, cached: false, cacheKey: key };
    },
    async discover(sources: HackathonSource[], context: SearchContext = {}): Promise<SearchOutcome> {
      const warnings: string[] = []; const candidates: HackathonCandidate[] = []; const sourceStatuses: SearchSourceStatus[] = []; let searches = 0; let cacheHits = 0; let officialPagesFetched = 0;
      for (const source of sources.slice(0, 12)) {
        const query = buildSourceQuery(source, context);
        try {
          const candidatesBeforeSource = candidates.length;
          const outcome = await this.search(source, query, context); searches += 1; if (outcome.cached) cacheHits += 1;
          for (const result of outcome.results.slice(0, 5)) { const extracted = await extractOfficial(source, result); if (result.link && isAllowedOfficialUrl(source, result.link)) officialPagesFetched += 1; if (extracted.warning) warnings.push(extracted.warning); if (extracted.candidate) candidates.push(extracted.candidate); }
          const sourceCandidateCount = candidates.length - candidatesBeforeSource;
          sourceStatuses.push({ sourceId: source.id, sourceName: source.name, status: outcome.cached ? 'cached' : 'searched', candidates: sourceCandidateCount });
        } catch (error) { const message = error instanceof Error ? error.message : 'SerpApi search failed.'; warnings.push(`${source.name}: ${message}`); sourceStatuses.push({ sourceId: source.id, sourceName: source.name, status: 'failed', candidates: 0, error: message }); }
      }
      return { candidates, warnings, searches, cacheHits, usage: { provider: 'serpapi', searches, cacheHits, officialPagesFetched, leads: candidates.filter((x) => !x.evidenceExcerpt).length }, sourceStatuses };
    },
  };
}
export const serpApiProvider = createSerpApiProvider();
