import type { Metadata, Viewport } from 'next';
import '@fontsource-variable/bricolage-grotesque';
import '@fontsource-variable/newsreader';
import './globals.css';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bereda-dev.vercel.app';
const TITLE = 'Bereda Wako — Full-stack developer';
const DESCRIPTION = 'Bereda Wako is a full-stack developer in Ethiopia. He builds web applications with TypeScript, React and PostgreSQL, from database to interface.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: TITLE, template: '%s — Bereda Wako' },
  description: DESCRIPTION,
  alternates: { canonical: '/' },
  openGraph: { title: TITLE, description: DESCRIPTION, type: 'website', siteName: 'Bereda Wako' },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#F1F3EF' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
