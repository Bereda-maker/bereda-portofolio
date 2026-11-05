import type { Metadata, Viewport } from 'next';
import '@fontsource-variable/bricolage-grotesque';
import '@fontsource-variable/newsreader';
import './globals.css';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bereda-portofolio.onrender.com';
const TITLE = 'Bereda Wako — Full-stack product engineer for web apps';
const DESCRIPTION = 'Build your next web product with an end-to-end engineering partner. MVP definition, intuitive product UI, dependable backends, and deployment for founders and teams.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: TITLE, template: '%s — Bereda Wako' },
  description: DESCRIPTION,
  alternates: { canonical: '/' },
  openGraph: { title: TITLE, description: DESCRIPTION, type: 'website', siteName: 'Bereda Wako' },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
  icons: {
    icon: [
      { url: '/favicon.ico?v=20261104', sizes: 'any' },
      { url: '/favicon-16x16.png?v=20261104', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png?v=20261104', sizes: '32x32', type: 'image/png' },
      { url: '/android-chrome-512x512.png?v=20261104', sizes: '512x512', type: 'image/png' },
      { url: '/android-chrome-192x192.png?v=20261104', sizes: '192x192', type: 'image/png' },
    ],
    shortcut: '/favicon.ico?v=20261104',
    apple: [{ url: '/apple-touch-icon.png?v=20261104', sizes: '180x180', type: 'image/png' }],
  },
  manifest: '/site.webmanifest?v=20261104',
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#001858' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en" suppressHydrationWarning><body><script dangerouslySetInnerHTML={{ __html: "try{var t=localStorage.getItem('bereda-theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}" }} />{children}</body></html>;
}
