import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Corporate blue — full 50–900 range so gradients look good
        brand: {
          DEFAULT: "#0f4c81",
          50:  "#eef4fa",
          100: "#d4e3f2",
          200: "#a9c7e5",
          300: "#7dabd7",
          400: "#4e88bf",
          500: "#0f4c81",
          600: "#0d4271",
          700: "#0a355c",
          800: "#082948",
          900: "#051d33",
        },
        // Warm accent for KPI variety, hover accents, etc.
        accent: {
          DEFAULT: "#f97316",
          50:  "#fff7ed",
          100: "#ffedd5",
          400: "#fb923c",
          500: "#f97316",
          600: "#ea580c",
        },
      },
      backgroundImage: {
        "brand-hero":
          "linear-gradient(135deg, #0a355c 0%, #0f4c81 40%, #1c6bb0 100%)",
        "brand-hero-soft":
          "linear-gradient(135deg, #eef4fa 0%, #d4e3f2 100%)",
      },
      boxShadow: {
        card: "0 1px 3px 0 rgb(15 76 129 / 0.06), 0 1px 2px -1px rgb(15 76 129 / 0.04)",
        pop: "0 10px 30px -12px rgb(15 76 129 / 0.25)",
      },
    },
  },
  plugins: [],
};

export default config;
