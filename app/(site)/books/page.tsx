import type { Metadata } from 'next';
import Link from 'next/link';
import { Note, PublicPage } from '@/components/PublicPage';

export const metadata: Metadata = { title: 'Books', robots: { index: false, follow: true } };

export default function Page() {
  return (
    <PublicPage title="Books" intro="A reading list is planned for this page.">
      <Note>
        <p>Nothing is published here yet. If you want to know what I’m reading or recommend something, send me a message.</p>
        <Link href="/#contact" className="btn btn-primary mt-6">Get in touch</Link>
      </Note>
    </PublicPage>
  );
}
