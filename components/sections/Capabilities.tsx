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
        <div className="mt-16 grid gap-8 md:grid-cols-[.6fr_1.4fr] md:gap-16"><div><p className="eyebrow">Tools, not trophies</p><h3 className="mt-3 font-display text-2xl font-semibold tracking-[-.03em]">Choose the stack that keeps the next decision simple.</h3></div><div className="space-y-7">{TECH_GROUPS.map((g) => <div key={g.label}><p className="font-display text-[.9rem] text-muted">{g.label}</p><ul className="mt-2.5 flex flex-wrap gap-2">{g.items.map((t) => <li key={t} className="tag"><TechIcon k={ICON_KEY[t]} size={14} />{t}</li>)}</ul></div>)}</div></div>
      </div>
    </section>
  );
}
