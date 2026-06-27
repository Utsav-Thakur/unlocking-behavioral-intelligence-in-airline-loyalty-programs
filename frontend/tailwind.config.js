/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0d1117',
        card: '#161b22',
        border: '#30363d',
        accent: '#58a6ff',
        success: '#3fb950',
        danger: '#f85149',
        warning: '#d29922',
        'text-primary': '#e6edf3',
        'text-secondary': '#8b949e',
        'card-hover': '#1c2129'
      }
    },
  },
  plugins: [],
}
