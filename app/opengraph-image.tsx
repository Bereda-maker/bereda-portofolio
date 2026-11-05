import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';
import { SITE } from '@/data/content';

export const alt = 'Bereda Wako builds web products for founders and teams';
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
          padding: 44,
        }}
      >
        <div style={{ width: 660, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingTop: 18, paddingBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 14, height: 14, borderRadius: 999, background: '#BC8B42' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 27, fontWeight: 700, color: '#001858' }}>Bereda Wako</span>
              <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: 1.4, color: '#68758E' }}>FULL-STACK PRODUCT ENGINEER</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ display: 'flex', fontSize: 61, fontWeight: 700, lineHeight: 1.02, letterSpacing: -2.2, maxWidth: 650 }}>
              Build your next web product.
            </div>
            <div style={{ display: 'flex', fontSize: 23, lineHeight: 1.35, color: '#4C5B78', maxWidth: 640 }}>
              I help founders and teams shape MVPs, build intuitive interfaces and dependable backends, and ship to production.
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 2 }}>
              {['MVP definition', 'Product UI', 'Backend + deployment'].map((service) => (
                <div key={service} style={{ display: 'flex', border: '1px solid #D6DEEB', borderRadius: 999, padding: '7px 12px', fontSize: 15, fontWeight: 600, color: '#31415F', background: '#FFFFFF' }}>
                  {service}
                </div>
              ))}
            </div>
          </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, borderRadius: 12, background: '#001858', color: '#FFFFFF', padding: '14px 18px', fontSize: 18, fontWeight: 700 }}>
              Tell me what you’re building
            </div>
            <span style={{ display: 'flex', fontSize: 15, color: '#4C5B78' }}>{SITE.email}</span>
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
