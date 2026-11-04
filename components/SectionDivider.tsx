'use client';

import { useEffect, useId, useRef, useState, type RefObject } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';

/**
 * Section transition boundaries.
 *
 * Each variant maps to one of the recommended styles:
 *   smooth       -> 1  Single Smooth Wave
 *   layered      -> 2  Layered Waves
 *   organic      -> 3  Asymmetric Organic Curve
 *   translucent  -> 5  Translucent Fluid Layers
 *   flow         -> 12 Animated Water Flow
 *   ribbon       -> 17 Flowing Ribbon Transition
 *   split        -> 23 Asymmetric Split Wave
 *   parallax     -> 24 Parallax Wave Transition (scroll-linked)
 *   morph        -> 25 Morphing SVG Wave
 *   topo         -> 33 Layered Topographic Curves
 *
 * Placement: the divider is a zero-flow overlay. `overlay="up"` pulls it over the
 * bottom of the section above; `overlay="down"` pulls it over the top of the section
 * below. It is always painted on the DARK / gradient side so that side's own
 * background shows through untouched. `to` is the colour token of the lighter
 * neighbouring section the wave is filled with.
 */
export type DividerVariant = 'flow' | 'smooth' | 'organic' | 'topo' | 'translucent' | 'ribbon' | 'morph' | 'split' | 'parallax' | 'layered';
type Tone = 'paper' | 'panel';
type Props = { variant: DividerVariant; to: Tone; overlay?: 'up' | 'down'; flipX?: boolean };

const W = 1440;
const H = 120;
const n = (v: number) => (Math.round(v * 10) / 10).toString();

/* Rendered height per variant. Max 7rem keeps the overlay inside the 5rem/7rem section padding. */
export const DIVIDER_HEIGHT: Record<DividerVariant, string> = {
  flow: 'clamp(5rem, 11vw, 10rem)',
  smooth: 'clamp(3.25rem, 7vw, 6rem)',
  organic: 'clamp(4rem, 8.5vw, 7rem)',
  topo: 'clamp(3.5rem, 7vw, 6rem)',
  translucent: 'clamp(4rem, 8.5vw, 7rem)',
  ribbon: 'clamp(4.5rem, 9vw, 7rem)',
  morph: 'clamp(4rem, 8.5vw, 7rem)',
  split: 'clamp(4rem, 8.5vw, 7rem)',
  parallax: 'clamp(4.5rem, 9vw, 7rem)',
  layered: 'clamp(4rem, 8.5vw, 7rem)',
};

/* ---------- path helpers (viewBox 1440 x 120) ---------- */

type Wave = { d: string; x0: number; x1: number };

/** Smooth sine-like wave built from cubic segments with horizontal tangents at every crest/trough. */
function wave(o: { x0?: number; x1?: number; half: number; amp: number; base: number; high?: boolean }): Wave {
  const { half, amp, base, high = true } = o;
  const x0 = o.x0 ?? -half;
  const x1 = o.x1 ?? W + half;
  let x = x0;
  let up = high;
  let d = `M${n(x)},${n(base + (up ? -amp : amp))}`;
  while (x < x1 - 0.01) {
    const a = base + (up ? -amp : amp);
    const b = base + (up ? amp : -amp);
    d += ` C${n(x + half / 2)},${n(a)} ${n(x + half / 2)},${n(b)} ${n(x + half)},${n(b)}`;
    x += half;
    up = !up;
  }
  return { d, x0, x1: x };
}
const fillOf = (w: Wave) => `${w.d} L${n(w.x1)},${H} L${n(w.x0)},${H} Z`;

type Pt = [number, number];
/** Quadratic smoothing through sampled points. */
function smooth(pts: Pt[], move = true) {
  let d = `${move ? 'M' : 'L'}${n(pts[0][0])},${n(pts[0][1])}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const [x, y] = pts[i];
    const [nx, ny] = pts[i + 1];
    d += ` Q${n(x)},${n(y)} ${n((x + nx) / 2)},${n((y + ny) / 2)}`;
  }
  const last = pts[pts.length - 1];
  return `${d} L${n(last[0])},${n(last[1])}`;
}
const sample = (fn: (x: number) => number, step = 40): Pt[] => {
  const pts: Pt[] = [];
  for (let x = -step; x <= W + step; x += step) pts.push([x, fn(x)]);
  return pts;
};
const TAU = Math.PI * 2;

/* ---------- static geometry ---------- */

const SMOOTH = 'M0,60 C240,8 480,8 720,52 C960,96 1200,96 1440,36 L1440,120 L0,120 Z';
const ORGANIC = 'M0,96 C110,92 170,22 330,22 C520,22 560,82 780,78 C980,74 1060,38 1220,40 C1320,42 1390,58 1440,70 L1440,120 L0,120 Z';

const SPLIT_FRONT = 'M0,30 C90,96 210,104 330,70 C430,42 520,14 620,30 C660,36 700,52 720,60 C820,100 1000,96 1160,74 C1280,58 1370,44 1440,52 L1440,120 L0,120 Z';
const SPLIT_BACK = 'M0,52 C120,100 240,88 380,62 C520,36 600,26 720,52 C860,82 1040,70 1200,48 C1300,34 1380,40 1440,36 L1440,120 L0,120 Z';

const MORPH_FRONT: [string, string] = [
  'M0,58 C160,22 300,22 480,52 C640,80 760,84 960,56 C1120,34 1280,30 1440,52 L1440,120 L0,120 Z',
  'M0,38 C180,78 320,84 480,60 C640,36 780,26 960,58 C1120,88 1280,84 1440,46 L1440,120 L0,120 Z',
];
const MORPH_BACK: [string, string] = [
  'M0,46 C200,84 340,78 520,52 C700,26 800,34 980,62 C1140,86 1300,70 1440,40 L1440,120 L0,120 Z',
  'M0,64 C160,30 320,34 500,62 C680,90 820,86 1000,52 C1160,26 1300,40 1440,66 L1440,120 L0,120 Z',
];

const TRANSLUCENT = [
  { w: wave({ half: 600, amp: 26, base: 44, x0: -300 }), fill: 'rgb(var(--forest) / .05)' },
  { w: wave({ half: 420, amp: 20, base: 62, x0: -140, high: false }), fill: 'rgb(var(--forest) / .07)' },
  { w: wave({ half: 300, amp: 14, base: 78, x0: -60 }), fill: 'rgb(var(--forest) / .06)' },
  { w: wave({ half: 540, amp: 10, base: 98, x0: -200, high: false }), fill: null },
];

const LAYERED = [
  { w: wave({ half: 480, amp: 20, base: 46, x0: -120 }), fill: 'rgb(var(--forest) / .10)' },
  { w: wave({ half: 360, amp: 14, base: 64, x0: -60, high: false }), fill: 'rgb(var(--gold) / .16)' },
  { w: wave({ half: 540, amp: 12, base: 88, x0: -200 }), fill: null },
];

/* Animated Water Flow: paths are 2 x 1440 wide and every period divides 1440, so a -1440 shift loops seamlessly. */
const FLOW = [
  { w: wave({ x0: 0, x1: 2880, half: 720, amp: 14, base: 68 }), a: 0.22, dur: '40s', reverse: true, crest: false },
  { w: wave({ x0: 0, x1: 2880, half: 360, amp: 11, base: 84, high: false }), a: 0.5, dur: '27s', reverse: false, crest: false },
  { w: wave({ x0: 0, x1: 2880, half: 480, amp: 8, base: 99 }), a: 1, dur: '19s', reverse: true, crest: true },
];

/* Parallax: layers are wider than the viewBox so they can drift with scroll. */
const PARALLAX = [
  { w: wave({ x0: -900, x1: W + 900, half: 520, amp: 16, base: 46 }), a: 0.2, range: [90, -90] },
  { w: wave({ x0: -900, x1: W + 900, half: 380, amp: 14, base: 66, high: false }), a: 0.45, range: [-200, 200] },
  { w: wave({ x0: -900, x1: W + 900, half: 440, amp: 10, base: 92 }), a: 1, range: [320, -320] },
];

/* Topographic contour lines. */
const TOPO = Array.from({ length: 7 }, (_, i) => {
  const base = 22 + i * 14;
  const a1 = 9 + (i % 3) * 3;
  const a2 = 4 + (i % 2) * 3;
  const p1 = i * 0.7;
  const p2 = i * 1.3 + 0.5;
  const pts = sample((x) => base + a1 * Math.sin((x / W) * TAU * 1.25 + p1) + a2 * Math.sin((x / W) * TAU * 2.75 + p2), 36);
  return { d: smooth(pts), opacity: 0.12 + i * 0.045, gold: i === 3 };
});

/* Flowing ribbon: a twisting band that rides the fill edge. */
const edgeY = (x: number) => 70 + 24 * Math.sin((x / W) * TAU * 1.25 + 0.4) + 7 * Math.sin((x / W) * TAU * 2.5);
const ribbonT = (x: number) => 3 + 14 * (0.5 + 0.5 * Math.sin((x / W) * TAU * 1.75 + 1.2));
const RIBBON_EDGE = sample(edgeY, 30);
const RIBBON_FILL = `${smooth(RIBBON_EDGE)} L${W + 30},${H} L-30,${H} Z`;
const RIBBON_BAND = `${smooth(RIBBON_EDGE)} ${smooth(
  sample((x) => edgeY(x) - ribbonT(x), 30).reverse(),
  false,
)} Z`;
const RIBBON_HAIR = smooth(sample((x) => edgeY(x) - ribbonT(x) - 9, 30));

/* ---------- scroll-linked parallax layers ---------- */

function ParallaxLayers({ target, paint }: { target: RefObject<HTMLDivElement>; paint: (a: number) => string }) {
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target, offset: ['start end', 'end start'] });
  const x0 = useTransform(scrollYProgress, [0, 1], PARALLAX[0].range);
  const x1 = useTransform(scrollYProgress, [0, 1], PARALLAX[1].range);
  const x2 = useTransform(scrollYProgress, [0, 1], PARALLAX[2].range);
  const xs = [x0, x1, x2];
  return (
    <>
      {PARALLAX.map((l, i) => (
        <motion.path key={i} d={fillOf(l.w)} fill={paint(l.a)} style={reduced ? undefined : { x: xs[i] }} />
      ))}
    </>
  );
}

/* ---------- component ---------- */

export default function SectionDivider({ variant, to, overlay = 'up', flipX = false }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const uid = useId().replace(/:/g, '');
  const reducedPref = useReducedMotion();
  // SMIL can't be paused from CSS, so only mount <animate> after hydration and only when motion is allowed.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const animate = mounted && reducedPref === false;
  const paint = (a = 1) => `rgb(var(--${to}) / ${a})`;

  let shape: React.ReactNode = null;
  switch (variant) {
    case 'smooth':
      shape = <path d={SMOOTH} fill={paint()} />;
      break;
    case 'organic':
      shape = <path d={ORGANIC} fill={paint()} />;
      break;
    case 'translucent':
      shape = TRANSLUCENT.map((l, i) => <path key={i} d={fillOf(l.w)} fill={l.fill ?? paint()} />);
      break;
    case 'layered':
      shape = LAYERED.map((l, i) => <path key={i} d={fillOf(l.w)} fill={l.fill ?? paint()} />);
      break;
    case 'split':
      shape = (
        <>
          <path d={SPLIT_BACK} fill={paint(0.3)} />
          <path d={SPLIT_FRONT} fill={paint()} />
        </>
      );
      break;
    case 'morph':
      shape = (
        <>
          <path d={MORPH_BACK[0]} fill={paint(0.35)}>
            {animate && <animate attributeName="d" dur="17s" repeatCount="indefinite" calcMode="spline" keyTimes="0;0.5;1" keySplines=".45 0 .55 1;.45 0 .55 1" values={`${MORPH_BACK[0]};${MORPH_BACK[1]};${MORPH_BACK[0]}`} />}
          </path>
          <path d={MORPH_FRONT[0]} fill={paint()}>
            {animate && <animate attributeName="d" dur="11s" repeatCount="indefinite" calcMode="spline" keyTimes="0;0.5;1" keySplines=".45 0 .55 1;.45 0 .55 1" values={`${MORPH_FRONT[0]};${MORPH_FRONT[1]};${MORPH_FRONT[0]}`} />}
          </path>
        </>
      );
      break;
    case 'flow':
      shape = FLOW.map((l, i) => (
        <g key={i} className="sdiv-flow" style={{ animationDuration: l.dur, animationDirection: l.reverse ? 'reverse' : 'normal' }}>
          <path d={fillOf(l.w)} fill={paint(l.a)} />
          {l.crest && <path d={l.w.d} fill="none" stroke="rgba(240,189,72,.6)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />}
        </g>
      ));
      break;
    case 'parallax':
      shape = <ParallaxLayers target={ref} paint={paint} />;
      break;
    case 'topo':
      shape = TOPO.map((l, i) => (
        <path key={i} d={l.d} fill="none" stroke={l.gold ? 'rgb(var(--gold) / .55)' : `rgb(var(--forest) / ${l.opacity.toFixed(2)})`} strokeWidth="1.25" vectorEffect="non-scaling-stroke" />
      ));
      break;
    case 'ribbon':
      shape = (
        <>
          <defs>
            <linearGradient id={`rb${uid}`} x1="0" x2="1" y1="0" y2="0">
              <stop offset="0" stopColor="#efb941" stopOpacity="0" />
              <stop offset=".16" stopColor="#efb941" stopOpacity=".95" />
              <stop offset=".58" stopColor="#7da3ff" stopOpacity=".9" />
              <stop offset="1" stopColor="#7da3ff" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={RIBBON_FILL} fill={paint()} />
          <path d={RIBBON_BAND} fill={`url(#rb${uid})`} />
          <path d={RIBBON_HAIR} fill="none" stroke="rgba(125,163,255,.4)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        </>
      );
      break;
  }

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={`sdiv sdiv--${overlay}${flipX ? ' sdiv--flipx' : ''}`}
      data-divider={variant}
      style={{ ['--sdiv-h' as string]: DIVIDER_HEIGHT[variant] }}
    >
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" focusable="false">
        {shape}
      </svg>
    </div>
  );
}
