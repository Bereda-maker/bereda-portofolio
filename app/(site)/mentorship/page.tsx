import type { Metadata } from 'next';
import Link from 'next/link';
import { Note, PublicPage } from '@/components/PublicPage';

export const metadata: Metadata = { title: 'Mentorship', robots: { index: false, follow: true } };

export default function Page() {
  return (
    <PublicPage title="Mentorship" intro="Focused one-to-one conversations, not a course.">
      <Note>
        <p>Choose a focused conversation and request a time that works for both of us. Availability is checked against the connected calendar before a booking is confirmed.</p>
        <Link href="/book" className="btn btn-primary mt-6">Book a conversation</Link>
      </Note>
    </PublicPage>
  );
}
