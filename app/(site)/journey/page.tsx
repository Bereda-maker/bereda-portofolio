import type { Metadata } from 'next';
import { PublicPage } from '@/components/PublicPage';

export const metadata: Metadata = { title: 'How I work', description: 'How I take a project from a loose idea to something deployed.' };

const STEPS = [
  ['Start with the question', 'Before choosing a stack, work out what needs to become easier for the people using the product.'],
  ['Make the first version real', 'A small, working slice leads to better conversations than a perfect plan kept in a document.'],
  ['Strengthen the foundations', 'Clear API contracts, useful errors and a sound data model make the next feature cheaper to build.'],
  ['Leave the path visible', 'The work isn’t finished when it ships. Whoever inherits it should be able to understand it.'],
];

export default function JourneyPage() {
  return (
    <PublicPage title="How I work" intro="How a project goes from a loose idea to something deployed.">
      <ol className="wrap pb-24">
        {STEPS.map(([title, text], i) => (
          <li key={title} className="grid gap-3 border-t border-rule py-8 sm:grid-cols-[4rem_1fr_1.2fr] sm:gap-8">
            <span className="font-display text-[1.1rem] font-semibold text-forest">{i + 1}</span>
            <h2 className="font-display text-[1.4rem] font-semibold leading-tight tracking-[-.01em]">{title}</h2>
            <p className="max-w-[28rem] text-muted">{text}</p>
          </li>
        ))}
      </ol>
    </PublicPage>
  );
}
