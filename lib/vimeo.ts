export type VimeoSource = { provider: 'vimeo'; externalId: string };

function isValidHash(value: string): boolean {
  return /^[A-Za-z0-9]+$/.test(value);
}

export function parseVimeoUrl(raw: string): VimeoSource | null {
  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:' || url.username || url.password) return null;
    const host = url.hostname.toLowerCase();
    if (!['vimeo.com', 'www.vimeo.com', 'player.vimeo.com'].includes(host)) return null;

    const pathParts = url.pathname.split('/').filter(Boolean);
    const videoIndex = pathParts.findIndex((part) => /^\d+$/.test(part));
    if (videoIndex < 0) return null;

    const id = pathParts[videoIndex];
    const pathHash = pathParts[videoIndex + 1];
    const queryHash = url.searchParams.get('h') ?? '';
    const hash = queryHash || pathHash || '';
    if (hash && !isValidHash(hash)) return null;

    return { provider: 'vimeo', externalId: hash ? `${id}?h=${hash}` : id };
  } catch {
    return null;
  }
}

export function getVimeoEmbedUrl(value: string): string | null {
  const match = value.match(/^(\d+)(?:\?h=([A-Za-z0-9]+))?$/);
  if (!match) return null;
  const [, id, hash] = match;
  return `https://player.vimeo.com/video/${id}${hash ? `?h=${encodeURIComponent(hash)}` : ''}`;
}

export function getVimeoEmbedUrlFromSource(raw: string): string | null {
  const source = parseVimeoUrl(raw);
  return source ? getVimeoEmbedUrl(source.externalId) : null;
}
