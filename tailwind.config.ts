import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#0f4c81",
          50: "#eef4fa",
          100: "#d4e3f2",
          500: "#0f4c81",
          600: "#0d4271",
          700: "#0a355c",
        },
      },
    },
  },
  plugins: [],
};

export default config;
