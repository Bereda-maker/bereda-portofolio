import Link from 'next/link';
import { PublicPage, SetupState } from '@/components/PublicPage';

export default function OpportunitiesPage() {
  return <PublicPage eyebrow="06 / Open doors" title={<>Good work<br /><span className="text-[#D7E2EA]">finds a way.</span></>} intro="This is where selected collaborations, roles and project opportunities will be shared. Nothing is listed at the moment."><section className="mx-auto max-w-6xl px-5 pb-20 sm:px-8 md:px-10"><SetupState label="Opportunities setup required" detail="The opportunities board is not connected yet, so there are no active listings to browse. For a project conversation, use the implemented contact form." /><Link href="/#contact" className="cbtn mt-8 inline-flex rounded-full px-8 py-4 text-sm font-medium uppercase tracking-widest text-white">Start a conversation</Link></section></PublicPage>;
}
