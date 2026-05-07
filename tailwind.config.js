export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./src/App.jsx"
  ],
  theme: {
    extend: {
      colors: {
        gracie: {
          red: '#E30613',
          'red-dark': '#B30410',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
