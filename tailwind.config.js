/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      /**
       * Design tokens from the 2026-09 design audit (F1, F6).
       *
       * One accent, taken from the logo's teal. `accent-fill` is the only
       * primary-button fill (white on teal-700 is 5.5:1); `accent` itself is
       * for text, icons and tints on the dark ground. `ink-3` is the minimum
       * text colour — nothing dimmer, and no opacity on text.
       * `ok` / `warn` / `bad` are reserved for flight status and errors.
       */
      colors: {
        bg: '#020617',
        surface: '#0f172a',
        'surface-2': '#1e293b',
        line: 'rgba(255, 255, 255, 0.06)',
        ink: '#f1f5f9',
        'ink-2': '#cbd5e1',
        'ink-3': '#94a3b8',
        accent: {
          DEFAULT: '#2dd4bf',
          tint: 'rgba(45, 212, 191, 0.12)',
          fill: '#0f766e',
          'fill-hover': '#0d9488',
          'fill-active': '#115e59',
        },
        'brand-navy': '#1a365d',
        rating: '#fbbf24',
        ok: '#10b981',
        warn: '#f59e0b',
        bad: '#f43f5e',
      },
      fontFamily: {
        sans: ['"Noto Sans Georgian"', 'sans-serif'],
      },
      keyframes: {
        'post-enter': {
          '0%':   { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        // Replaces framer-motion for toasts, which was the only reason a 110 KB
        // animation library sat in the eager first-load bundle.
        'toast-enter': {
          '0%':   { opacity: '0', transform: 'translateY(20px) scale(0.9)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
      },
      animation: {
        'post-enter': 'post-enter 0.38s ease-out both',
        'toast-enter': 'toast-enter 0.22s cubic-bezier(0.16, 1, 0.3, 1) both',
      },
    },
  },
  plugins: [],
}
