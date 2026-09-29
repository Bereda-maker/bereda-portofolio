'use client';
import { useEffect, useRef, type CSSProperties } from 'react';

/** Photo that drifts at a different speed than the page. Its parent should be overflow-hidden. */
export default function ParallaxImage({ src, className = '', style }: { src: string; className?: string; style?: CSSProperties }) {
  const ref = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const f = () => {
      const el = ref.current, p = el?.parentElement;
      if (!el || !p) return;
      const r = p.getBoundingClientRect(), vh = window.innerHeight;
      if (r.bottom < -200 || r.top > vh + 200) return;
      el.style.scale = '1.35';
      el.style.translate = `0 ${-(((r.top + r.height / 2) - vh / 2) / vh) * r.height * 0.22}px`;
    };
    f();
    window.addEventListener('scroll', f, { passive: true });
    window.addEventListener('resize', f);
    return () => { window.removeEventListener('scroll', f); window.removeEventListener('resize', f); };
  }, []);
  // eslint-disable-next-line @next/next/no-img-element
  return <img ref={ref} src={src} alt="" className={`bgv ${className}`} style={style} />;
}
