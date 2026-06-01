/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'var(--ev-background)',
        foreground: 'var(--ev-foreground)',
        border: 'var(--ev-border)',
        input: 'var(--ev-border)',
        ring: 'var(--ev-ring)',
        primary: {
          DEFAULT: 'var(--ev-entity)',
          foreground: 'var(--ev-background)',
        },
        secondary: {
          DEFAULT: 'var(--ev-accent)',
          foreground: 'var(--ev-accent-foreground)',
        },
        muted: {
          DEFAULT: 'var(--ev-accent)',
          foreground: 'var(--ev-muted)',
        },
        accent: {
          DEFAULT: 'var(--ev-accent)',
          foreground: 'var(--ev-accent-foreground)',
        },
        card: {
          DEFAULT: 'var(--ev-node)',
          foreground: 'var(--ev-foreground)',
        },
        entity: 'var(--ev-entity)',
        relation: 'var(--ev-relation)',
        table: 'var(--ev-table)',
        package: 'var(--ev-package)',
        property: 'var(--ev-property)',
        node: 'var(--ev-node)',
      },
      borderRadius: {
        lg: '0.5rem',
        md: '0.375rem',
        sm: '0.25rem',
      },
    },
  },
  plugins: [],
};
