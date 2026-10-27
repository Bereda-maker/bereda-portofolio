import { PublicPage, SetupState } from '@/components/PublicPage';

export default function VideosPage() {
  return <PublicPage eyebrow="05 / Watch" title={<>Ideas<br /><span className="text-[#D7E2EA]">in motion.</span></>} intro="Build notes, technical walkthroughs and conversations will live here when the publishing workflow is in place."><section className="mx-auto max-w-6xl px-5 pb-20 sm:px-8 md:px-10"><SetupState label="Video setup required" detail="There are no public videos available yet. This page is reserved for future recordings and does not claim a connected video platform." /></section></PublicPage>;
}
