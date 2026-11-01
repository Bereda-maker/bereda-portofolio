import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminSetupState';
import VideosWorkspace from '@/components/admin/VideosWorkspace';
export const metadata = { title: 'Videos -- Admin' };
export const dynamic = 'force-dynamic';
export default function AdminVideosPage() {
  return <div className="admin-page"><AdminPageHeader eyebrow="Publishing / Videos" title="Videos" description="Manage video records and choose which entries appear publicly." actions={<Link href="/videos" target="_blank" rel="noreferrer" className="admin-button-secondary">View public videos <ArrowUpRight size={14} aria-hidden="true" /></Link>} /><VideosWorkspace /></div>;
}
