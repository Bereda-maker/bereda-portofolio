import type { Metadata } from 'next';
import BookingForm from '@/components/booking/BookingForm';
import { PublicPage } from '@/components/PublicPage';

export const metadata: Metadata = { title: 'Book a conversation', description: 'Choose a meeting purpose and request an available time with Bereda.' };

export default function BookPage() {
  return <PublicPage title="Book a conversation" intro="Turn interest into a real conversation. Choose a purpose, find an available time, and receive the meeting details."><div className="wrap pb-24"><BookingForm /><p className="mt-5 text-sm text-muted">Your time zone is detected automatically. All bookings are checked against availability and the connected calendar.</p></div></PublicPage>;
}
