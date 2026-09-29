import ICONS from '@/data/icons';

/** Dark brand colours (e.g. Next.js black) are lightened so they show on dark backgrounds. */
export const lite = (h: string) => {
  const n = parseInt(h, 16);
  const l = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return l < 0.28 ? '#D7E2EA' : '#' + h;
};

export default function TechIcon({ k, size = 16 }: { k: string; size?: number }) {
  const i = ICONS[k];
  if (!i) return null;
  return <svg viewBox="0 0 24 24" width={size} height={size} fill={lite(i[1])}><path d={i[0]} /></svg>;
}
