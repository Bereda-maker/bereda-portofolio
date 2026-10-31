import type { Metadata } from 'next';
import Link from 'next/link';
import { Note, PublicPage } from '@/components/PublicPage';

export const metadata: Metadata = { title: 'Mentorship', robots: { index: false, follow: true } };

export default function Page() {
  return (
    <PublicPage title="Mentorship" intro="Focused one-to-one conversations, not a course.">
      <Note>
        <p>There is no booking calendar or paid programme yet. If you have a specific technical or career question and would like to talk it through, send me a note and I’ll tell you whether I can help.</p>
        <Link href="/#contact" className="btn btn-primary mt-6">Get in touch</Link>
      </Note>
    </PublicPage>
  );
}
