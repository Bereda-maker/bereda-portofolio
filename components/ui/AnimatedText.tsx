'use client';
import { Fragment, useRef } from 'react';
import { motion, useScroll, useTransform, MotionValue } from 'framer-motion';

function Char({ c, p, s, e }: { c: string; p: MotionValue<number>; s: number; e: number }) {
  const opacity = useTransform(p, [s, e], [0.2, 1]);
  return (
    <span className="relative">
      <span className="invisible">{c}</span>
      <motion.span style={{ opacity }} className="absolute left-0 top-0">{c}</motion.span>
    </span>
  );
}

export default function AnimatedText({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.8', 'end 0.2'] });
  let i = 0;
  return (
    <p ref={ref} className={className}>
      {text.split(' ').map((w, wi) => (
        <Fragment key={wi}>
          <span className="inline-block whitespace-nowrap">
            {[...w].map((c) => { const k = i++; return <Char key={k} c={c} p={scrollYProgress} s={k / text.length} e={(k + 1) / text.length} />; })}
          </span>{' '}
        </Fragment>
      ))}
    </p>
  );
}
