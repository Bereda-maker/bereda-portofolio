import { ImageResponse } from 'next/og';

export const alt = 'Bereda Wako — Full-stack developer';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: '#F6F8FD', color: '#0A1530', padding: 80 }}>
        <div style={{ display: 'flex', fontSize: 34, fontWeight: 600, color: '#001858' }}>Bereda Wako</div>
        <div style={{ display: 'flex', fontSize: 78, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2, maxWidth: 940 }}>
          I build web applications, from the database to the interface.
        </div>
        <div style={{ display: 'flex', fontSize: 30, color: '#4C5B78' }}>Full-stack developer · TypeScript, React, PostgreSQL</div>
      </div>
    ),
    size,
  );
}
