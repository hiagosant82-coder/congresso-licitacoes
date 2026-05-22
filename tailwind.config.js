/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0A0706',
          800: '#14100E',
        },
        gold: {
          400: '#F3E5AB',
          500: '#D4AF37',
          600: '#AA7C11',
        },
        sky: {
          400: '#D4AF37', // Mapping sky-400 to gold for backward compatibility
        },
        premium: {
          dark: '#0A0706',
          darker: '#050403',
          card: '#16120F',
          gold: '#D4AF37',
          goldLight: '#F5E6C4',
          goldDark: '#9C7A3C',
        },
        brandOrange: '#D4AF37',
      },
      boxShadow: {
        '3xl': '0 35px 60px -15px rgba(0, 0, 0, 0.6)',
        'gold-glow': '0 0 25px rgba(212, 175, 55, 0.2)',
      },
      borderRadius: {
        '4xl': '3rem',
      }
    },
  },
  plugins: [],
}

