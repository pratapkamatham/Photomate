/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
      colors: {
        primary: '#1a1a1a',
        accent: '#c9a96e',
        surface: '#111111',
      },
    },
  },
  plugins: [],
}

