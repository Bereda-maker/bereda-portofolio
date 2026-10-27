'use client';
import { motion, useScroll, useSpring } from 'framer-motion';

export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });
  return <motion.div style={{ scaleX, transformOrigin: '0 50%' }} className="fixed top-0 left-0 h-[3px] w-full z-[100] bg-gradient-to-r from-[#B600A8] via-[#7621B0] to-[#BE4C00]" />;
}
