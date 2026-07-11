/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: "#142D65",
        navyDark: "#0F1D42",
        cream: "#F2EFE9",
        sand: "#DAD4C6",
        amber: "#E8A33D",
        forest: "#1E7A52",
        stone: "#8B8478",
        ink: "#5c584f",
        danger: "#A02018",
        neon: "#C6FE1F",
      },
      fontFamily: {
        sans: ["var(--font-poppins)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        ticket: "4px 4px 0 #142D65",
      },
    },
  },
  plugins: [],
};
