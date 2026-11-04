import { AlertTriangle } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminSetupState';
import ExperiencesWorkspace from '@/components/admin/ExperiencesWorkspace';
import type { ExperienceRow } from '@/lib/schema';
export const metadata={title:'Experiences -- Admin'};export const dynamic='force-dynamic';
async function load(){try{const {db}=await import('@/lib/db');const {experiences}=await import('@/lib/schema');return {rows:await db.select().from(experiences).orderBy(experiences.sortOrder,experiences.id),error:false}}catch{return {rows:[] as ExperienceRow[],error:true}}}
export default async function ExperiencesPage(){const {rows,error}=await load();return <div className="admin-page"><AdminPageHeader eyebrow="Content" title="Experiences" description="Manage the roles, education, images, details, and links shown in your public experience section."/>{error&&<div className="admin-error"><AlertTriangle size={16}/><span>Could not load database records. Check DATABASE_URL and apply migrations with <code>npm run db:migrate</code>.</span></div>}<ExperiencesWorkspace initial={rows}/></div>}
