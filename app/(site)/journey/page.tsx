import { PublicPage } from '@/components/PublicPage';

const STEPS = [
  ['01', 'Start with the question', 'Before choosing a stack, understand what needs to become easier for the people using the product.'],
  ['02', 'Make the first shape real', 'A small, working slice creates better conversations than a perfect plan kept in a document.'],
  ['03', 'Strengthen the foundations', 'Clear contracts, useful errors and durable data models make the next feature less expensive.'],
  ['04', 'Leave the path visible', 'The work is not finished when it ships. A product should be understandable to the people who inherit it.'],
];

export default function JourneyPage() {
  return <PublicPage eyebrow="08 / How I work" title={<>From loose idea<br /><span className="text-[#D7E2EA]">to something real.</span></>} intro="A practical journey through the messy middle: product questions, technical decisions and the steady work of making software feel simple."><section className="mx-auto max-w-6xl px-5 pb-20 sm:px-8 md:px-10">{STEPS.map(([n, title, text]) => <article key={n} className="grid gap-5 border-t border-[#D7E2EA]/20 py-8 sm:grid-cols-[140px_1fr_1.2fr] sm:gap-8 sm:py-12"><span className="hero-heading text-5xl font-black sm:text-7xl">{n}</span><h2 className="text-2xl font-medium uppercase tracking-tight sm:text-4xl">{title}</h2><p className="max-w-xl text-lg font-light leading-relaxed text-[#D7E2EA]/65">{text}</p></article>)}</section></PublicPage>;
}
