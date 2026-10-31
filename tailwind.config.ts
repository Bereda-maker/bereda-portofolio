import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#F1F3EF',
        panel: '#E6EAE5',
        ink: '#111A16',
        muted: '#4A5A52',
        rule: '#C9D1CB',
        forest: { DEFAULT: '#1D5A43', dark: '#144432' },
        gold: '#D9A21B',
      },
      fontFamily: {
        display: ['"Bricolage Grotesque Variable"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        text: ['"Newsreader Variable"', 'Georgia', 'Cambria', 'serif'],
      },
    },
  },
  plugins: [],
};
export default config;
