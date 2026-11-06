/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
        gov: {
          blue: '#1e3a8a',
          dark: '#0f172a',
          card: '#1e293b',
          surface: '#0f172a',
          border: '#334155'
        }
      }
    },
  },
  plugins: [],
}
