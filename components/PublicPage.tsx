import { SiteFooter, SiteHeader } from '@/components/SiteChrome';

export function PublicPage({ children, title, intro }: { children: React.ReactNode; title: React.ReactNode; intro?: string }) {
  return (
    <>
      <SiteHeader />
      <main>
        <header className="wrap pb-12 pt-14 sm:pt-20">
          <h1 className="max-w-[18ch] font-display text-[clamp(2.25rem,5.2vw,3.75rem)] font-semibold leading-[1.04] tracking-[-.03em]">{title}</h1>
          {intro && <p className="mt-6 max-w-[36rem] text-[1.2rem] text-muted">{intro}</p>}
        </header>
        {children}
      </main>
      <SiteFooter />
    </>
  );
}

export function Note({ children }: { children: React.ReactNode }) {
  return <div className="wrap pb-24"><div className="max-w-[36rem] rounded-lg border border-rule bg-panel p-6 sm:p-8">{children}</div></div>;
}
