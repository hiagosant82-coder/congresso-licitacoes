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
          900: '#001D3D',
          800: '#003566',
        },
        gold: {
          500: '#FFB703',
          600: '#EAB308',
        },
        sky: {
          400: '#00AEEF',
        },
        brandOrange: '#FB8500',
      },
      boxShadow: {
        '3xl': '0 35px 60px -15px rgba(0, 0, 0, 0.3)',
      },
      borderRadius: {
        '4xl': '3rem',
      }
    },
  },
  plugins: [],
}

