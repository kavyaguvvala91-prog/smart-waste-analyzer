/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      boxShadow: {
        glow: '0 0 0 1px rgba(255,255,255,0.08), 0 20px 80px rgba(16, 185, 129, 0.16)',
      },
      backgroundImage: {
        'eco-grid':
          'radial-gradient(circle at 1px 1px, rgba(16,185,129,0.14) 1px, transparent 0)',
      },
      colors: {
        brand: {
          emerald: '#10B981',
          forest: '#059669',
          light: '#34D399',
          mint: '#6EE7B7',
          sage: '#A7F3D0',
        },
      },
    },
  },
  plugins: [],
};
