import type { MetadataRoute } from 'next';
import { getExperiences } from '@/lib/experiences';
export const dynamic = 'force-dynamic';
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base=(process.env.NEXT_PUBLIC_SITE_URL??'https://bereda-portofolio.onrender.com').replace(/\/$/,'');
  const experienceRows=await getExperiences();
  return [{url:base,changeFrequency:'weekly',priority:1},{url:`${base}/books`,changeFrequency:'monthly',priority:0.5},{url:`${base}/media`,changeFrequency:'monthly',priority:0.6},{url:`${base}/videos`,changeFrequency:'monthly',priority:0.5},{url:`${base}/content`,changeFrequency:'weekly',priority:0.6},...experienceRows.map(experience=>({url:`${base}/experience/${experience.slug}`,changeFrequency:'yearly' as const,priority:0.45}))];
}
