import type { Metadata } from 'next';
import { ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { PublicPage } from '@/components/PublicPage';

export const metadata: Metadata = { title: 'How I work', description: 'How Bereda scopes, builds, integrates, deploys, and maintains product work.' };

const STEPS = [
  ['01', 'Discover the real workflow', 'Start with who needs the product, what they do today, what is painful, and what must be true for the first release to be useful. The output is a short problem statement, user journeys, risks, and a definition of done.'],
  ['02', 'Scope a teachable MVP', 'Keep the first version narrow enough to ship and real enough to learn from. Separate the core loop from nice-to-have surfaces, define the smallest data model, and identify integrations that can block the path.'],
  ['03', 'Choose a practical architecture', 'Use the team’s strengths and the product’s risk to choose the stack. I prefer clear boundaries: typed contracts, server-side secrets, simple migrations, explicit ownership checks, and interfaces that can be changed without rewriting the product.'],
  ['04', 'Make integrations fail well', 'Auth, payments, media, messaging, AI, and third-party APIs are part of the product. I model pending, success, failure, retry, and manual-review states so the user is not left with a spinner and the team is not left guessing.'],
  ['05', 'Deploy with a maintenance path', 'Separate preview, staging, and production. Document environment variables, migrations, backups, observability, rollback steps, and the first post-launch review. A handoff is successful when the next person can operate the product without a private conversation with me.'],
];

const DELIVERABLES = ['A short discovery brief with users, journeys, constraints, and risks', 'A prioritized MVP scope with explicit out-of-scope items', 'Architecture decision notes and data/API contracts', 'A working product slice with responsive UI and failure states', 'Test evidence, deployment notes, and a maintenance checklist'];

export default function JourneyPage() {
  return <PublicPage title="How I work" intro="A practical path from a loose product idea to something a team can run, test, and keep improving.">
    <section className="wrap pb-20 md:pb-28"><ol className="border-t border-rule">{STEPS.map(([number, title, text]) => <li key={number} className="grid gap-4 border-b border-rule py-8 sm:grid-cols-[4rem_1fr_1.2fr] sm:gap-8"><span className="font-display text-[1.1rem] font-semibold text-gold">{number}</span><h2 className="font-display text-[1.45rem] font-semibold leading-tight tracking-[-.02em]">{title}</h2><p className="max-w-[34rem] text-muted">{text}</p></li>)}</ol></section>
    <section className="border-y border-rule bg-panel"><div className="wrap grid gap-10 py-20 md:grid-cols-[.8fr_1.2fr] md:gap-20 md:py-24"><div><p className="eyebrow">What you receive</p><h2 className="section-title mt-3 max-w-[12ch]">A proposal you can actually discuss.</h2></div><ul className="grid gap-4">{DELIVERABLES.map((item) => <li key={item} className="flex gap-3 border-b border-rule pb-4 text-[1.05rem]"><CheckCircle2 size={19} className="mt-1 shrink-0 text-forest" aria-hidden="true" />{item}</li>)}</ul></div></section>
    <section className="wrap py-20 md:py-28"><div className="max-w-[45rem]"><p className="eyebrow">Bring the first question</p><h2 className="section-title mt-3">Tell me what you want to make easier.</h2><p className="mt-6 text-[1.15rem] text-muted">A useful first message can be rough. Describe the people, the current workflow, the outcome you want, and any deadline or integration you already know about. I&rsquo;ll reply with the questions that matter first.</p><a href="/#contact" className="btn btn-primary mt-8">Tell me about your project <ArrowUpRight size={16} aria-hidden="true" /></a></div></section>
  </PublicPage>;
}
