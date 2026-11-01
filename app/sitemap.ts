import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bereda-portofolio.onrender.com').replace(/\/$/, '');
  return [
    { url: base, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/books`, changeFrequency: 'monthly', priority: 0.5 },
  ];
}
