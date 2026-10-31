import ICONS from '@/data/icons';

/** Brand colours that are too dark or too pale to read on the light page fall back to the site's ink colour. */
export const readable = (h: string) => {
  const n = parseInt(h, 16);
  const l = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return l < 0.22 || l > 0.6 ? '#111A16' : '#' + h;
};

export default function TechIcon({ k, size = 16 }: { k: string; size?: number }) {
  const i = ICONS[k];
  if (!i) return null;
  return <svg viewBox="0 0 24 24" width={size} height={size} fill={readable(i[1])} aria-hidden="true"><path d={i[0]} /></svg>;
}
