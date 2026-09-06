/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--color-primary)',
          hover: 'var(--color-primary-hover)',
          active: 'var(--color-primary-active)',
          light: 'var(--color-primary-light)',
        },

        bg: {
          DEFAULT: 'var(--color-bg)',
          surface: 'var(--color-surface)',
        },

        text: {
          DEFAULT: 'var(--color-text)',
          muted: 'var(--color-text-muted)',
        },

        border: {
          DEFAULT: 'var(--color-border)',
        },
        tint: {
          DEFAULT: 'var(--color-tint)',
          sun: 'var(--color-sun-tint)',
          berry: 'var(--color-berry-tint)',
          violet: 'var(--color-violet-tint)',
          mint: 'var(--color-mint-tint)',
          sky: 'var(--color-sky-tint)',
          peach: 'var(--color-peach-tint)',
        },
        secondary: 'var(--color-secondary)',
        ink: {
          DEFAULT: 'var(--color-text)',
          soft: 'var(--color-text-muted)',
          muted: 'var(--color-text-subtle)',
        },
        canvas: 'var(--color-bg)',
        surface: 'var(--color-surface)',
        line: {
          DEFAULT: 'var(--color-border)',
          sun: 'var(--color-sun-line)',
          berry: 'var(--color-berry-line)',
          violet: 'var(--color-violet-line)',
          mint: 'var(--color-mint-line)',
          sky: 'var(--color-sky-line)',
          peach: 'var(--color-peach-line)',
        },
        accent: {
          sun: 'var(--color-sun)',
          berry: 'var(--color-berry)',
          violet: 'var(--color-violet)',
          grass: 'var(--color-grass)',
          sky: 'var(--color-sky)',
        },
      },
    },
  },
  plugins: [],
  darkMode: 'class',
};
