import { PublicPage, SetupState } from '@/components/PublicPage';

export default function BooksPage() {
  return <PublicPage eyebrow="04 / Reading list" title={<>Books<br /><span className="text-[#D7E2EA]">in the margins.</span></>} intro="A considered shelf of books, notes and references that shape how I think about products and systems."><section className="mx-auto max-w-6xl px-5 pb-20 sm:px-8 md:px-10"><SetupState label="Library setup required" detail="The public reading list is not connected yet. There are no books published here today; check back when the collection is ready." /></section></PublicPage>;
}
