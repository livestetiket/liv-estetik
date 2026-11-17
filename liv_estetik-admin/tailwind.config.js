/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        evergreen: {
          950: "#082b1c",
          900: "#0f3726",
          800: "#214b36",
          700: "#38624a",
          600: "#557a5e",
        },
        champagne: {
          50: "#fbfaf3",
          100: "#f5f0d7",
          300: "#e3da93",
          500: "#cbbf7b",
          700: "#8c7c40",
        },
        porcelain: "#f7f7f2",
        ink: "#26352d",
      },
      boxShadow: {
        glow: "0 8px 26px rgba(15, 55, 38, 0.08)",
        emerald: "0 10px 32px rgba(15, 55, 38, 0.12)",
      },
      fontFamily: {
        display: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
