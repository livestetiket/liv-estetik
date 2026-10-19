/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        evergreen: {
          950: "#163b34",
          900: "#214c43",
          800: "#2d5d52",
          700: "#426f62",
          600: "#5b8375",
        },
        champagne: {
          50: "#f8f6ef",
          100: "#f0ecdc",
          300: "#ddd1ad",
          500: "#b89f68",
          700: "#816c40",
        },
        porcelain: "#faf8f5",
        ink: "#172323",
      },
      boxShadow: {
        glow: "0 24px 70px rgba(201, 168, 76, 0.24)",
        emerald: "0 24px 90px rgba(15, 59, 59, 0.22)",
      },
      fontFamily: {
        display: ["Fraunces", "Georgia", "serif"],
        sans: ["DM Sans", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "luxury-radial":
          "radial-gradient(circle at 20% 20%, rgba(221,209,173,.24), transparent 28%), radial-gradient(circle at 80% 0%, rgba(91,131,117,.2), transparent 30%), linear-gradient(135deg, #214c43 0%, #163b34 58%, #2d5d52 100%)",
      },
    },
  },
  plugins: [],
};
