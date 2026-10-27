import Link from 'next/link';

export function AdminPageHeader({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <header className="flex flex-col gap-3">
      <p className="uppercase tracking-[0.25em] text-xs opacity-50">{eyebrow}</p>
      <h1 className="text-3xl sm:text-4xl font-black uppercase">{title}</h1>
      <p className="max-w-2xl text-sm sm:text-base opacity-70 leading-relaxed">{description}</p>
    </header>
  );
}

export function SetupRequired({ title = 'Setup required', children }: { title?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[28px] border border-[#D7E2EA]/15 p-6 sm:p-8">
      <div className="flex items-start gap-4">
        <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[#E0B04B]" aria-hidden="true" />
        <div>
          <h2 className="font-bold text-lg">{title}</h2>
          <div className="mt-2 text-sm opacity-70 leading-relaxed">{children}</div>
        </div>
      </div>
    </section>
  );
}

export function EmptyAdminState({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-dashed border-[#D7E2EA]/20 px-5 py-8 text-sm opacity-60">{children}</div>;
}

export function AdminLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <Link href={href} className="inline-flex rounded-full border border-[#D7E2EA]/25 px-5 py-2.5 text-xs uppercase tracking-widest hover:border-[#D7E2EA]/60 transition">{children}</Link>;
}
