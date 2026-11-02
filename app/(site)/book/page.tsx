import type { Metadata } from 'next';
import BookingForm from '@/components/booking/BookingForm';
import { PublicPage } from '@/components/PublicPage';

export const metadata: Metadata = { title: 'Book a conversation', description: 'Choose a meeting purpose and request an available time with Bereda.' };

export default function BookPage() {
  return <PublicPage title="Book a conversation" intro="Start with your role and goal. We’ll use that context to make the conversation focused, relevant, and worth your time.">
    <div className="wrap pb-24">
      <div className="booking-page-grid">
        <aside className="booking-aside">
          <p className="eyebrow">A focused first step</p>
          <h2 className="mt-3 font-display text-3xl font-semibold leading-tight tracking-[-.04em]">Bring the context. Leave with a next step.</h2>
          <p className="mt-5 text-muted">The short intake helps me understand who you are, what you need, and how to prepare before we meet.</p>
          <ol className="booking-aside-steps mt-8">
            <li><span>01</span><div><strong>Choose your context</strong><p>Tell me whether you are hiring, building, investing, learning, or partnering.</p></div></li>
            <li><span>02</span><div><strong>Set the agenda</strong><p>Select the outcome and meeting format that best fits your situation.</p></div></li>
            <li><span>03</span><div><strong>Pick a time</strong><p>Choose a slot in your local time zone and share the details I should know.</p></div></li>
          </ol>
          <div className="booking-note mt-8"><strong>Good to know</strong><p className="mt-2">Availability and bookings are checked against the connected calendar. You’ll receive the meeting details after confirmation.</p></div>
        </aside>
        <div><BookingForm /></div>
      </div>
    </div>
  </PublicPage>;
}
