import type { Metadata, Viewport } from 'next';
import { Kanit } from 'next/font/google';
import './globals.css';

const kanit = Kanit({ subsets: ['latin'], weight: ['300', '400', '500', '600', '700', '800', '900'] });
export const metadata: Metadata = { title: 'Bereda — Full-Stack Product Engineer', description: 'Bereda builds thoughtful digital products across product design, frontend, backend and infrastructure.' };
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="en"><body className={kanit.className}>{children}</body></html>);
}
