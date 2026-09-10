/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        luxury: {
          ivory: '#FDFBF7',
          charcoal: '#18181B',
          gold: {
            DEFAULT: '#C5A059',
            light: '#E2C889',
            dark: '#9A7730',
          },
          beige: '#F5F0EB',
          gray: '#71717A',
          border: '#E4E4E7',
          card: '#FFFFFF',
        },
      },
      fontFamily: {
        serif: ['Cormorant Garamond', 'Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', 'Manrope', 'sans-serif'],
      },
      boxShadow: {
        'luxury': '0 10px 30px -10px rgba(197, 160, 89, 0.15)',
        'card': '0 4px 20px -2px rgba(24, 24, 27, 0.05)',
      },
    },
  },
  plugins: [],
}

