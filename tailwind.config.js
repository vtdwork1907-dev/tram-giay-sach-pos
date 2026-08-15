/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./*.html", "./*.js"],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f5f3ff',
          100: '#e0e7ff',
          600: '#4f46e5',
          800: '#3730a3',
          900: '#312e81'
        },
        cyanBrand: '#38bdf8'
      }
    }
  },
  plugins: [],
}
