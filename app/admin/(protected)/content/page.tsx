import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminSetupState';
import ContentWorkspace from '@/components/admin/ContentWorkspace';
export const metadata = { title: 'Content -- Admin' };
export const dynamic = 'force-dynamic';
export default function AdminContentPage() {
  return <div className="admin-page"><AdminPageHeader eyebrow="Publishing / Content" title="Content" description="Write and manage articles; drafts remain private until published." actions={<Link href="/content" target="_blank" rel="noreferrer" className="admin-button-secondary">View public content <ArrowUpRight size={14} aria-hidden="true" /></Link>} /><ContentWorkspace /></div>;
}
