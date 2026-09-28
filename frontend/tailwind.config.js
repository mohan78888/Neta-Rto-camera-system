/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        panel: '#0f1420',
        panel2: '#161c2c',
        accent: '#3b82f6',
        danger: '#ef4444',
        warn: '#f59e0b',
        ok: '#22c55e',
      },
    },
  },
  plugins: [],
};
