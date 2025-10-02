export default {
  content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}'
],
  theme: {
    extend: {
      colors: {
        blue: {
          700: '#1e3a8a', // Dark blue from logo
          500: '#3b82f6', // Medium blue
          100: '#dbeafe', // Light blue
        },
      },
    },
  },
  plugins: [],
}