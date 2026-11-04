import { AlertTriangle } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminSetupState';
import ExperiencesWorkspace from '@/components/admin/ExperiencesWorkspace';
import type { ExperienceRow } from '@/lib/schema';
import { EXPERIENCE } from '@/data/content';
export const metadata={title:'Experiences -- Admin'};export const dynamic='force-dynamic';
async function load(){try{const {db}=await import('@/lib/db');const {experiences}=await import('@/lib/schema');let rows=await db.select().from(experiences).orderBy(experiences.sortOrder,experiences.id);if(rows.length===0){rows=await db.insert(experiences).values(EXPERIENCE.map((item,sortOrder)=>({slug:item.slug,role:item.role,place:item.place,type:item.type,image:item.image,imageAlt:item.imageAlt,text:item.text,details:item.details,links:item.links,sortOrder}))).returning();}return {rows,error:false}}catch{return {rows:[] as ExperienceRow[],error:true}}}
export default async function ExperiencesPage(){const {rows,error}=await load();return <div className="admin-page"><AdminPageHeader eyebrow="Content" title="Experiences" description="Manage the roles, education, images, details, and links shown in your public experience section."/>{error&&<div className="admin-error"><AlertTriangle size={16}/><span>Could not reach the database. Check DATABASE_URL and apply migrations with <code>npm run db:migrate</code>.</span></div>}<ExperiencesWorkspace initial={rows}/></div>}
