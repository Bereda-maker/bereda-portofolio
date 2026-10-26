import Image from 'next/image';
import FadeIn from '@/components/ui/FadeIn';
import ContactButton from '@/components/ui/ContactButton';
import { NAV, SITE } from '@/data/content';

export default function Hero() {
  return (
    <section id="top" className="hero-section">
      <div className="hero-backdrop" aria-hidden="true"><div className="hero-grid" /><div className="hero-halo" /></div>
      <div className="hero-shell">
        <nav className="site-nav" aria-label="Main navigation">
          <a className="site-brand" href="#top" aria-label="Bereda — back to top">
            <span className="brand-mark"><i /><i /><i /></span>
            <span className="brand-copy"><b>{SITE.name}</b><small>PRODUCT ENGINEER</small></span>
          </a>
          <div className="site-nav-links">
            {NAV.map((item) => <a key={item.href} href={item.href}>{item.label}</a>)}
          </div>
          <a className="nav-contact" href="#contact">Let&apos;s talk <span>↗</span></a>
        </nav>

        <div className="hero-main">
          <div className="hero-copy">
            <FadeIn y={20}>
              <div className="hero-kicker"><span className="status-dot" />FULL-STACK ENGINEER <i /> FRONT TO BACK</div>
              <h1>I build the<br />whole <em>product.</em></h1>
              <p className="hero-description">From a sharp interface to the systems behind it, I turn ambitious ideas into dependable software people can use.</p>
              <div className="hero-actions">
                <a className="button-primary" href="#projects">Explore selected work <span>↓</span></a>
                <ContactButton className="button-quiet" />
              </div>
            </FadeIn>
          </div>

          <FadeIn delay={0.12} y={24} className="hero-visual-wrap">
            <div className="hero-visual">
              <div className="portrait-frame">
                <div className="portrait-light" />
                <Image src="/images/hero.png" alt="Portrait of Bereda" fill priority sizes="(max-width: 760px) 90vw, 44vw" className="hero-portrait" />
                <div className="portrait-edge" />
                <div className="portrait-caption"><span>IDEA&nbsp; / &nbsp;ENGINEERING&nbsp; / &nbsp;SHIP</span><span>01 — 08</span></div>
              </div>
              <div className="hero-index"><span>BUILDING</span><b>WITH INTENT</b></div>
            </div>
          </FadeIn>
        </div>

        <div className="hero-foot"><span>Independent software engineer</span><a href="#about">Scroll to explore <span>↓</span></a></div>
      </div>
    </section>
  );
}
