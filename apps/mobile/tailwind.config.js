/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      // Resolve through nativewindTheme.ts; do not maintain a second type scale.
      fontSize: {
        xs: ['var(--type-caption-size)', { lineHeight: 'var(--type-caption-line)' }],
        sm: ['var(--type-label-size)', { lineHeight: 'var(--type-label-line)' }],
        base: ['var(--type-body-size)', { lineHeight: 'var(--type-body-line)' }],
        lg: ['var(--type-cardTitle-size)', { lineHeight: 'var(--type-cardTitle-line)' }],
        xl: ['var(--type-screenTitle-size)', { lineHeight: 'var(--type-screenTitle-line)' }],
        '2xl': ['var(--type-pageTitle-size)', { lineHeight: 'var(--type-pageTitle-line)' }],
        '3xl': ['var(--type-display-size)', { lineHeight: 'var(--type-display-line)' }],
        '4xl': ['var(--type-phrase-size)', { lineHeight: 'var(--type-phrase-line)' }],
        '5xl': ['var(--type-word-size)', { lineHeight: 'var(--type-word-line)' }],
      },
      fontWeight: {
        normal: 'var(--weight-regular)',
        medium: 'var(--weight-medium)',
        semibold: 'var(--weight-semibold)',
        bold: 'var(--weight-bold)',
      },
      borderRadius: {
        lg: 'var(--radius-small)',
        xl: 'var(--radius-control)',
        '2xl': 'var(--radius-card)',
        '3xl': 'var(--radius-hero)',
      },
      spacing: {
        1: 'var(--space-xs)', 2: 'var(--space-sm)', 3: 'var(--space-md)',
        4: 'var(--space-lg)', 5: 'var(--space-xl)', 6: 'var(--space-xxl)',
        8: 'var(--space-section)', 10: 'var(--space-spacious)',
      },
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
