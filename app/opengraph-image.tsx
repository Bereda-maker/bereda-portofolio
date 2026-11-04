import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';

export const alt = 'Bereda Wako — Full-stack developer';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OgImage() {
  const portrait = await readFile(join(process.cwd(), 'public/images/about-portrait-og.png'));
  const portraitSrc = `data:image/png;base64,${portrait.toString('base64')}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#F6F8FD',
          color: '#0A1530',
          padding: 48,
        }}
      >
        <div style={{ width: 680, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingTop: 24, paddingBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 30, fontWeight: 700, color: '#001858' }}>
            <div style={{ width: 14, height: 14, borderRadius: 999, background: '#BC8B42' }} />
            Bereda Wako
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', fontSize: 66, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2.5, maxWidth: 650 }}>
              I build web applications, from the database to the interface.
            </div>
            <div style={{ display: 'flex', fontSize: 24, color: '#4C5B78' }}>
              Full-stack developer · TypeScript, React, PostgreSQL
            </div>
          </div>
          <div style={{ display: 'flex', fontSize: 18, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', color: '#68758E' }}>
            Product engineer · Ethiopia
          </div>
        </div>
        <div style={{ display: 'flex', width: 400, height: 500, overflow: 'hidden', borderRadius: 28, background: '#E4E8F0', border: '1px solid #D1D7E2' }}>
          <img src={portraitSrc} width="400" height="500" />
        </div>
      </div>
    ),
    size,
  );
}
