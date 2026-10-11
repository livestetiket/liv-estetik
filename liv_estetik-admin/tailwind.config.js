/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        evergreen: {
          950: "#082525",
          900: "#0f3b3b",
          800: "#164545",
          700: "#1a4a4a",
          600: "#256262",
        },
        champagne: {
          50: "#fffaf0",
          100: "#f7edd1",
          300: "#e8d08a",
          500: "#c9a84c",
          700: "#9a7928",
        },
        porcelain: "#faf8f5",
        ink: "#172323",
      },
      boxShadow: {
        glow: "0 24px 70px rgba(201, 168, 76, 0.24)",
        emerald: "0 24px 90px rgba(15, 59, 59, 0.22)",
      },
      fontFamily: {
        display: ["Cormorant Garamond", "Georgia", "serif"],
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "luxury-radial":
          "radial-gradient(circle at 20% 20%, rgba(232,208,138,.24), transparent 28%), radial-gradient(circle at 80% 0%, rgba(37,98,98,.26), transparent 30%), linear-gradient(135deg, #0f3b3b 0%, #082525 58%, #1a4a4a 100%)",
      },
    },
  },
  plugins: [],
};
