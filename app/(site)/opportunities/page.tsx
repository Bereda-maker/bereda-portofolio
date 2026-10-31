import type { Metadata } from 'next';
import Link from 'next/link';
import { Note, PublicPage } from '@/components/PublicPage';

export const metadata: Metadata = { title: 'Opportunities', robots: { index: false, follow: true } };

export default function Page() {
  return (
    <PublicPage title="Opportunities" intro="Collaborations and roles will be listed here.">
      <Note>
        <p>Nothing is listed at the moment. If you have a project or a role in mind, the contact form is the quickest route.</p>
        <Link href="/#contact" className="btn btn-primary mt-6">Get in touch</Link>
      </Note>
    </PublicPage>
  );
}
