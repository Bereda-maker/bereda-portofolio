import type { Metadata, Viewport } from 'next';
import { Kanit } from 'next/font/google';
import './globals.css';

const kanit = Kanit({ subsets: ['latin'], weight: ['300', '400', '500', '600', '700', '800', '900'] });
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: { default: 'Bereda Wako — Digital products, documented', template: '%s — Bereda Wako' },
  description: 'Bereda Wako builds useful digital products, documents the journey, and shares practical knowledge about software development.',
  alternates: { canonical: '/' },
  openGraph: { title: 'Bereda Wako — Digital products, documented', description: 'Software, learning, and the work between the first idea and the final deploy.', type: 'website' },
  twitter: { card: 'summary_large_image', title: 'Bereda Wako — Digital products, documented', description: 'Software, learning, and the work between the first idea and the final deploy.' },
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="en"><body className={kanit.className}>{children}</body></html>);
}
