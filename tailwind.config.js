/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Марсианская тема
        mars: {
          50: '#fef7f0',
          100: '#fdebd9',
          200: '#fad4b2',
          300: '#f6b57f',
          400: '#f18d4a',
          500: '#ed6c24',
          600: '#de5119',
          700: '#b83c16',
          800: '#933019',
          900: '#762a18',
          950: '#40130a',
        },
        space: {
          50: '#f4f6fb',
          100: '#e8ecf6',
          200: '#ccd7eb',
          300: '#9fb5da',
          400: '#6b8dc5',
          500: '#486eae',
          600: '#375592',
          700: '#2d4577',
          800: '#293c63',
          900: '#263454',
          950: '#0f141f',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
