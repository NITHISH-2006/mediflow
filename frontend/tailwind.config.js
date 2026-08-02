/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f1f9f9',
          100: '#d7f0f0',
          500: '#1f9ea3',
          600: '#16828a',
          700: '#126a72',
          900: '#0f4f56',
        },
      },
      boxShadow: {
        soft: '0 10px 30px -12px rgba(15, 79, 86, 0.35)',
      },
    },
  },
  plugins: [],
};
