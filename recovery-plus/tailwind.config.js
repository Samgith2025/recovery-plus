/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#E6F3FF',
          100: '#B3DFFF',
          500: '#007AFF',
          600: '#0056CC',
          700: '#003D99',
        },
        secondary: {
          50: '#E6F9FF',
          100: '#B3EFFF',
          500: '#5AC8FA',
          600: '#28A9E1',
          700: '#1F8BC4',
        },
        success: {
          50: '#E6F7EA',
          500: '#34C759',
          600: '#28A745',
        },
        warning: {
          50: '#FFF5E6',
          500: '#FF9500',
          600: '#E6850E',
        },
        error: {
          50: '#FFE6E6',
          500: '#FF3B30',
          600: '#E6342A',
        },
        background: '#F2F2F7',
        surface: '#FFFFFF',
        text: {
          primary: '#1C1C1E',
          secondary: '#8E8E93',
        },
      },
      fontFamily: {
        sans: ['SF Pro Display', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
