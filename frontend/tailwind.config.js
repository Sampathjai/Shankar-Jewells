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
          ivory: '#FBF9F5',
          charcoal: '#1D1B19',
          gold: {
            DEFAULT: '#B9913F',
            light: '#D4AF57',
            dark: '#8C6921',
          },
          beige: '#F5F0EB',
          gray: '#6B655F',
          border: '#E8E1D6',
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

