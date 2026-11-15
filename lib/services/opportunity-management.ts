export { APPLICATION_STAGES, ACTIVITY_KINDS } from './opportunity-constants';
export type { ApplicationStage, ActivityKind } from './opportunity-constants';

const TRACKING_PARAMS = new Set(['fbclid', 'gclid', 'ref', 'referrer', 'source', 'campaign']);

export function canonicalizeJobUrl(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;
  try {
    const url = new URL(raw.trim());
    if (url.protocol !== 'https:' || url.username || url.password) return null;
    url.hash = '';
    for (const key of [...url.searchParams.keys()]) {
      if (key.toLowerCase().startsWith('utm_') || TRACKING_PARAMS.has(key.toLowerCase())) url.searchParams.delete(key);
    }
    url.searchParams.sort();
    url.hostname = url.hostname.toLowerCase();
    if (url.pathname.length > 1) url.pathname = url.pathname.replace(/\/+$/, '');
    return url.toString();
  } catch {
    return null;
  }
}

export function normalizeCompanyTitle(value: string | null | undefined): string {
  return (value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

export type DuplicateCandidate = {
  id: number;
  title: string;
  companyName?: string | null;
  originalListingUrl?: string | null;
  applicationUrl?: string | null;
  evidence?: Array<{ sourceUrl?: string | null }>;
};
export type DuplicateInput = {
  title: string;
  companyName?: string | null;
  originalListingUrl?: string | null;
  applicationUrl?: string | null;
};
export type DuplicateMatch = DuplicateCandidate & { reason: 'matching_url' | 'matching_company_and_title'; identityMatches: boolean };

export function findPotentialDuplicates(input: DuplicateInput, existing: DuplicateCandidate[]): DuplicateMatch[] {
  const inputUrls = new Set(
    [input.originalListingUrl, input.applicationUrl]
      .map(canonicalizeJobUrl)
      .filter((value): value is string => Boolean(value)),
  );
  const company = normalizeCompanyTitle(input.companyName);
  const title = normalizeCompanyTitle(input.title);
  if (!title) return [];

  return existing.flatMap((row) => {
    const candidateUrls = [row.originalListingUrl, row.applicationUrl, ...(row.evidence ?? []).map((item) => item.sourceUrl)]
      .map(canonicalizeJobUrl)
      .filter((value): value is string => Boolean(value));
    const matchingUrl = candidateUrls.some((value) => inputUrls.has(value));
    const matchingIdentity = Boolean(company && title && company === normalizeCompanyTitle(row.companyName) && title === normalizeCompanyTitle(row.title));
    if (!matchingUrl && !matchingIdentity) return [];
    return [{ ...row, reason: matchingUrl ? 'matching_url' as const : 'matching_company_and_title' as const, identityMatches: matchingIdentity }];
  });
}

export function isValidHttpsUrl(value: string | null | undefined): boolean {
  if (!value?.trim()) return true;
  try {
    const url = new URL(value.trim());
    return url.protocol === 'https:' && !url.username && !url.password && Boolean(url.hostname);
  } catch {
    return false;
  }
}

function isPrivateIpv4(address: string): boolean {
  const parts = address.split('.').map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return true;
  const [a, b] = parts;
  return a === 0 || a === 10 || a === 127 || (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) || (a === 192 && b === 0) ||
    (a === 198 && (b === 18 || b === 19)) || a >= 224;
}

function isPrivateAddress(address: string): boolean {
  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(address)) return isPrivateIpv4(address);
  const normalized = address.toLowerCase().split('%')[0];
  if (normalized.startsWith('::') || normalized.startsWith('fc') || normalized.startsWith('fd') || normalized.startsWith('fe8') || normalized.startsWith('fe9') || normalized.startsWith('fea') || normalized.startsWith('feb') || normalized.startsWith('fec') || normalized.startsWith('fed') || normalized.startsWith('ff')) return true;
  const mapped = normalized.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  return mapped ? isPrivateIpv4(mapped[1]) : false;
}

type ResolvedPublicUrl = { url: URL; addresses: Array<{ address: string; family: number }> };

async function resolvePublicHttpsUrl(raw: string): Promise<ResolvedPublicUrl> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error('Enter a valid HTTPS job listing URL.');
  }
  if (url.protocol !== 'https:' || url.username || url.password) throw new Error('Only public HTTPS URLs are supported.');
  const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, '').replace(/\.$/, '');
  if (!hostname || hostname === 'localhost' || hostname.endsWith('.localhost') || hostname.endsWith('.local')) throw new Error('Private and local URLs cannot be researched.');
  const { isIP } = await import('node:net');
  let addresses: Array<{ address: string; family: number }>;
  if (isIP(hostname)) {
    if (isPrivateAddress(hostname)) throw new Error('Private and local URLs cannot be researched.');
    addresses = [{ address: hostname, family: isIP(hostname) }];
  } else {
    const { lookup } = await import('node:dns/promises');
    try {
      addresses = await lookup(hostname, { all: true, verbatim: true });
    } catch {
      throw new Error('The URL host could not be resolved.');
    }
    if (!addresses.length || addresses.some(({ address }) => isPrivateAddress(address))) throw new Error('Private and local URLs cannot be researched.');
  }
  return { url, addresses };
}

export async function assertPublicHttpsUrl(raw: string): Promise<URL> {
  return (await resolvePublicHttpsUrl(raw)).url;
}

async function pinnedHttpsRequest(url: URL, addresses: Array<{ address: string; family: number }>, init: RequestInit): Promise<Response> {
  const [{ address, family }] = addresses;
  const [{ request }, { Readable }] = await Promise.all([import('node:https'), import('node:stream')]);
  const headerEntries = [...new Headers(init.headers).entries()];
  const headers = Object.fromEntries(headerEntries);
  const signal = init.signal ?? AbortSignal.timeout(12000);
  return new Promise((resolve, reject) => {
    let settled = false;
    const req = request(url, {
      method: init.method ?? 'GET',
      headers,
      signal,
      lookup: (_hostname: string, options: { all?: boolean }, callback: (...args: unknown[]) => void) => {
        if (options?.all) callback(null, [{ address, family }]);
        else callback(null, address, family);
      },
    } as Parameters<typeof request>[1], (incoming) => {
      settled = true;
      const responseBody = [204, 205, 304].includes(incoming.statusCode ?? 0) ? null : Readable.toWeb(incoming) as ReadableStream<Uint8Array>;
      resolve(new Response(responseBody, { status: incoming.statusCode ?? 502, statusText: incoming.statusMessage, headers: incoming.headers as HeadersInit }));
    });
    req.setTimeout(12000, () => req.destroy(new Error('Source request timed out.')));
    req.on('error', (error) => { if (!settled) reject(error); });
    req.end();
  });
}

export async function fetchPublicHttps(raw: string, init: RequestInit = {}, maxRedirects = 4): Promise<Response> {
  let current = raw;
  for (let redirect = 0; redirect <= maxRedirects; redirect += 1) {
    const resolved = await resolvePublicHttpsUrl(current);
    const response = await pinnedHttpsRequest(resolved.url, resolved.addresses, init);
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get('location');
      await response.body?.cancel();
      if (!location || redirect === maxRedirects) throw new Error('The source redirected too many times.');
      current = new URL(location, resolved.url).toString();
      continue;
    }
    if (!response.ok) throw new Error(`Source returned ${response.status}`);
    const declaredLength = Number(response.headers.get('content-length') ?? 0);
    const maxBytes = 3 * 1024 * 1024;
    if (declaredLength > maxBytes) {
      await response.body?.cancel();
      throw new Error('The source page is too large to import.');
    }
    if (!response.body) return response;
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let bytes = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > maxBytes) {
        await reader.cancel();
        throw new Error('The source page is too large to import.');
      }
      chunks.push(value);
    }
    const body = new Uint8Array(bytes);
    let offset = 0;
    for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.byteLength; }
    return new Response(body, { status: response.status, statusText: response.statusText, headers: response.headers });
  }
  throw new Error('The source redirected too many times.');
}
