import { EXPERIENCE } from '@/data/content';
export async function getExperiences(){try{const {db}=await import('@/lib/db');const {experiences}=await import('@/lib/schema');const rows=await db.select().from(experiences).orderBy(experiences.sortOrder,experiences.id);if(rows.length)return rows;}catch{}return EXPERIENCE;}
