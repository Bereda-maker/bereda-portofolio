import { SERVICES, STACK_ICON, TECH, TECH_GROUPS } from '@/data/content';
import TechIcon from '@/components/ui/TechIcon';

const ICON_KEY: Record<string, string> = { ...Object.fromEntries(TECH), ...STACK_ICON };

export default function Capabilities() {
  return (
    <section id="services" className="border-t border-rule bg-panel">
      <div className="wrap py-20 md:py-28">
        <h2 className="section-title max-w-[22ch]">What I can build for you</h2>
        <dl className="mt-12 grid gap-x-16 gap-y-9 md:grid-cols-2">
          {SERVICES.map((s) => (
            <div key={s.name} className="border-t border-ink/20 pt-4">
              <dt className="font-display text-[1.15rem] font-semibold tracking-[-.01em]">{s.name}</dt>
              <dd className="mt-1.5 max-w-[30rem] text-[1.05rem] text-muted">{s.text}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-16 grid gap-10 md:grid-cols-[1fr_2fr] md:gap-16">
          <h3 className="font-display text-[1.15rem] font-semibold">Tools</h3>
          <div className="space-y-7">
            {TECH_GROUPS.map((g) => (
              <div key={g.label}>
                <p className="font-display text-[.9rem] text-muted">{g.label}</p>
                <ul className="mt-2.5 flex flex-wrap gap-2">
                  {g.items.map((t) => <li key={t} className="tag !bg-white"><TechIcon k={ICON_KEY[t]} size={14} />{t}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
