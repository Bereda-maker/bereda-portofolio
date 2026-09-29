'use client';
import { useState } from 'react';
import TechIcon from '@/components/ui/TechIcon';
import { STACK_ICON, type Project } from '@/data/content';

/** Screenshot area: click to preview a local image (not persisted). Put real files in /public/projects and pass `image`. */
export default function PictureSlot({ p, hue, image }: { p: Project; hue: number; image?: string }) {
  const [src, setSrc] = useState<string | undefined>(image);
  return (
    <label className="slot relative block cursor-pointer overflow-hidden rounded-[28px] sm:rounded-[36px]"
      style={{ aspectRatio: '16/10', border: '1px solid rgba(215,226,234,.25)', background: `linear-gradient(135deg,hsl(${hue} 60% 16%),#0C0C0C 58%,hsl(${hue + 50} 70% 20%))` }}>
      <div className="absolute top-0 left-0 right-0 h-8 flex items-center gap-1.5 px-4 z-10" style={{ background: 'rgba(215,226,234,.08)' }}>
        {['#ff5f57', '#febc2e', '#28c840'].map((c) => <i key={c} className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />)}
        <span className="ml-3 text-[10px] tracking-widest uppercase" style={{ color: 'rgba(215,226,234,.5)' }}>{p.title}</span>
      </div>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={p.title} className="absolute inset-0 w-full h-full object-cover pt-8" />
      ) : (
        <div className="absolute inset-0 pt-10 px-5 pb-4 flex flex-col text-[#D7E2EA]">
          <div className="flex gap-3 flex-1">
            <div className="w-1/4 rounded-xl" style={{ background: 'rgba(215,226,234,.07)' }} />
            <div className="flex-1 flex flex-col gap-3">
              <div className="h-1/3 rounded-xl" style={{ background: 'rgba(215,226,234,.1)' }} />
              <div className="flex gap-3 flex-1"><div className="flex-1 rounded-xl" style={{ background: 'rgba(215,226,234,.07)' }} /><div className="flex-1 rounded-xl" style={{ background: 'rgba(215,226,234,.07)' }} /></div>
            </div>
          </div>
          <div className="flex items-center justify-between mt-3">
            <div className="flex gap-2">{p.stack.slice(0, 3).map((t) => <TechIcon key={t} k={STACK_ICON[t]} size={20} />)}</div>
            <span className="uppercase tracking-widest text-[10px] sm:text-xs opacity-70">Click to add screenshot</span>
          </div>
        </div>
      )}
      <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) setSrc(URL.createObjectURL(f)); }} />
    </label>
  );
}
