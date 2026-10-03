/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        gov: {
          navy: '#0b1e3f',
          blue: '#1e3a8a',
          teal: '#0f766e',
          gold: '#d97706',
          bg: '#f8fafc',
          border: '#1e293b',
          card: '#ffffff',
          lightBlue: '#eff6ff',
          lightGreen: '#f0fdf4',
          lightAmber: '#fefce8',
        },
        action: {
          yellow: '#fbbf24',
          yellowHover: '#f59e0b',
          yellowLight: '#fef3c7',
          dark: '#0f172a',
        },
      },
      boxShadow: {
        'card-solid': '0 4px 0 0 #0f172a',
        'card-solid-lg': '0 6px 0 0 #0f172a',
        'card-solid-hover': '0 2px 0 0 #0f172a',
        'btn-solid': '0 4px 0 0 #0f172a',
        'btn-solid-active': '0 1px 0 0 #0f172a',
      },
      borderRadius: {
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      fontSize: {
        'elderly-sm': ['1.125rem', { lineHeight: '1.75rem' }],
        'elderly-base': ['1.25rem', { lineHeight: '1.875rem' }],
        'elderly-lg': ['1.5rem', { lineHeight: '2rem' }],
        'elderly-xl': ['1.875rem', { lineHeight: '2.25rem' }],
        'elderly-2xl': ['2.25rem', { lineHeight: '2.625rem' }],
        'elderly-3xl': ['2.75rem', { lineHeight: '3.125rem' }],
      }
    },
  },
  plugins: [],
}
