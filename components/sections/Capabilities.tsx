import { SERVICES, STACK_ICON, TECH, TECH_GROUPS } from '@/data/content';
import TechIcon from '@/components/ui/TechIcon';

const ICON_KEY: Record<string, string> = { ...Object.fromEntries(TECH), ...STACK_ICON };

export default function Capabilities() {
  return (
    <section id="services" className="border-b border-rule bg-panel">
      <div className="wrap py-20 md:py-28">
        <div className="grid gap-5 md:grid-cols-[.8fr_1.2fr] md:gap-16"><div><p className="eyebrow">What I can own</p><h2 className="section-title mt-3 max-w-[12ch]">From product idea to a maintainable release.</h2></div><p className="max-w-[35rem] text-[1.15rem] text-muted">I do not start with a technology shopping list. I start with the user, the risk, and the smallest slice that can teach us something.</p></div>
        <dl className="mt-12 grid gap-4 sm:grid-cols-2">
          {SERVICES.map((s, i) => <div key={s.name} className="surface-card p-6 sm:p-7"><div className="flex items-center justify-between gap-4"><span className="font-display text-sm font-semibold text-gold">0{i + 1}</span><span className="h-2 w-2 rounded-full bg-forest" aria-hidden="true" /></div><dt className="mt-8 font-display text-[1.2rem] font-semibold">{s.name}</dt><dd className="mt-2 text-[1.02rem] text-muted">{s.text}</dd></div>)}
        </dl>
        <div className="tools-panel mt-16 overflow-hidden rounded-[2rem] shadow-soft"><div className="tools-panel-grid" aria-hidden="true" /><div className="relative z-[1] grid gap-10 p-6 sm:p-8 md:grid-cols-[.78fr_1.22fr] md:gap-16 md:p-10"><div className="flex flex-col justify-between gap-10"><div><p className="tools-eyebrow">Tools, not trophies</p><h3 className="mt-4 max-w-[11ch] font-display text-[clamp(2rem,4vw,3.4rem)] font-semibold leading-[.98] tracking-[-.055em] text-white">A stack should make the next decision easier.</h3><p className="mt-5 max-w-[28rem] text-[1.02rem] leading-relaxed text-white/65">I choose technology for the job in front of us: fast feedback while we learn, clear boundaries when the product grows, and a handoff another engineer can actually use.</p></div><div className="tools-principles" aria-label="Stack selection principles"><span><i aria-hidden="true">01</i>Fast feedback</span><span><i aria-hidden="true">02</i>Clear boundaries</span><span><i aria-hidden="true">03</i>Useful handoff</span></div></div><div className="tools-stack"><div className="mb-5 flex items-center justify-between gap-4"><p className="font-display text-[.7rem] font-semibold uppercase tracking-[.2em] text-white/45">The working stack</p><span className="tools-signal"><b aria-hidden="true" /> Built to move</span></div><div className="space-y-4">{TECH_GROUPS.map((g, i) => <div key={g.label} className="tools-lane"><div className="flex items-center justify-between gap-4"><p className="font-display text-[.88rem] font-semibold text-white/80">{g.label}</p><span className="font-display text-[.7rem] uppercase tracking-[.16em] text-white/35">Lane 0{i + 1}</span></div><ul className="mt-3 flex flex-wrap gap-2">{g.items.map((t) => <li key={t} className="tools-tag"><TechIcon k={ICON_KEY[t]} size={14} />{t}</li>)}</ul></div>)}</div></div></div></div>
      </div>
    </section>
  );
}
