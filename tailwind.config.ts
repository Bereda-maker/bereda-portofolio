import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: 'rgb(var(--paper) / <alpha-value>)',
        panel: 'rgb(var(--panel) / <alpha-value>)',
        card: 'rgb(var(--card) / <alpha-value>)',
        ink: 'rgb(var(--ink) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        rule: 'rgb(var(--rule) / <alpha-value>)',
        forest: { DEFAULT: 'rgb(var(--forest) / <alpha-value>)', dark: 'rgb(var(--forest-dark) / <alpha-value>)' },
        gold: 'rgb(var(--gold) / <alpha-value>)',
      },
      fontFamily: {
        display: ['"Bricolage Grotesque Variable"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        text: ['"Newsreader Variable"', 'Georgia', 'Cambria', 'serif'],
      },
      boxShadow: { soft: '0 18px 55px rgb(var(--shadow) / .12)' },
    },
  },
  plugins: [],
};

export default config;
