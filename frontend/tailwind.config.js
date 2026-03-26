/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#8ce043',
          hover: '#7ac53b',
          50: '#f7fee7',
          100: '#ecfccb',
          200: '#d9f99d',
          500: '#8ce043', // matching default
          600: '#65a30d',
          700: '#4d7c0f',
        },
        secondary: '#7f8b64',
      }
    },
  },
  plugins: [],
}
