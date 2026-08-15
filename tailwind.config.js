/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,jsx}",
    "./src/components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        burgundy: {
          DEFAULT: "#7B1E2B",
          light: "#9C2C3B",
          dark: "#5A1520",
        },
        gold: {
          DEFAULT: "#C9A227",
          light: "#E0C158",
          dark: "#9C7D1B",
        },
        ink: {
          DEFAULT: "#0E0B0C",
          soft: "#161213",
          card: "#1D1719",
          border: "#2B2325",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      boxShadow: {
        card: "0 4px 24px rgba(0,0,0,0.35)",
        glow: "0 0 0 1px rgba(201,162,39,0.25), 0 8px 30px rgba(0,0,0,0.4)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      keyframes: {
        pulseSoft: {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0.6 },
        },
      },
      animation: {
        pulseSoft: "pulseSoft 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
