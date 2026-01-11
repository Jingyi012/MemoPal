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
        },
      },
    },
  },
  plugins: [],
  darkMode: 'class',
};
