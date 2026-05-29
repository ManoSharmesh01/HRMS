/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'glass-sm': '0 2px 8px 0 rgba(31, 38, 135, 0.08)',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.12)',
        'glass-lg': '0 12px 40px 0 rgba(31, 38, 135, 0.2)',
      },
      backdropBlur: {
        'xs': '2px',
      },
      colors: {
        glass: {
          50: 'rgba(255, 255, 255, 0.05)',
          100: 'rgba(255, 255, 255, 0.1)',
          200: 'rgba(255, 255, 255, 0.15)',
          300: 'rgba(255, 255, 255, 0.2)',
          400: 'rgba(255, 255, 255, 0.3)',
          text: '#f8fafc',
        }
      }
    },
  },
  plugins: [],
}