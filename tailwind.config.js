/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#E01818", // Premium Red
        background: "#000000",
        surface: "#121212",
        "surface-light": "#1E1E1E",
      },
    },
  },
  plugins: [],
}
