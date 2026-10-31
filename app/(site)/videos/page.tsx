import type { Metadata } from 'next';
import Link from 'next/link';
import { Note, PublicPage } from '@/components/PublicPage';

export const metadata: Metadata = { title: 'Videos', robots: { index: false, follow: true } };

export default function Page() {
  return (
    <PublicPage title="Videos" intro="Walkthroughs and build notes are planned for this page.">
      <Note>
        <p>There are no videos yet. For now, the best place to see how I work is the source code on GitHub, or the build logs on the work page.</p>
        <Link href="/#contact" className="btn btn-primary mt-6">Get in touch</Link>
      </Note>
    </PublicPage>
  );
}
