/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#6750A4',
        'primary-light': '#EDE7F6',
        surface: '#FFFBFE',
        'surface-variant': '#E7E0EC',
      },
      borderRadius: {
        '4xl': '2rem',
      }
    }
  },
  plugins: []
};