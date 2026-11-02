import type { MetadataRoute } from 'next';
import { EXPERIENCE } from '@/data/content';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bereda-portofolio.onrender.com').replace(/\/$/, '');
  return [
    { url: base, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/books`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/videos`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/content`, changeFrequency: 'weekly', priority: 0.6 },
    ...EXPERIENCE.map((experience) => ({
      url: `${base}/experience/${experience.slug}`,
      changeFrequency: 'yearly' as const,
      priority: 0.45,
    })),
  ];
}
