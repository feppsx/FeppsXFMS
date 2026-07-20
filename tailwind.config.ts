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
        // NEW mobile-design palette — the primary system going forward
        "brand-red":  "#9A121A",       // headers, nav, danger accents
        "brand-blue": "#003882",       // primary CTA, active states, borders
        "input-bg":   "#E5EAEF",       // pill inputs, textareas
        "success-green": "#9AE6B4",    // JOB ACCEPTED background
        "success-tick":  "#22C55E",    // checkmark icons inside green
        "danger-red":     "#FADBD8",   // urgent badge bg
        "danger-red-text": "#C0392B",  // urgent badge text
        "info-blue":     "#E3ECF6",    // info-table background
        "chip-blue":     "#DCE7F3",    // active filter chip

        // Original brand blue kept as `brand` scale for existing components —
        // mapped so the new brand-blue is the DEFAULT to keep things aligned.
        brand: {
          DEFAULT: "#003882",
          50:  "#eef4fa",
          100: "#d4e3f2",
          200: "#a9c7e5",
          300: "#7dabd7",
          400: "#4e88bf",
          500: "#003882",
          600: "#002a63",
          700: "#001f4a",
          800: "#001636",
          900: "#000e22",
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
          "linear-gradient(135deg, #001f4a 0%, #003882 40%, #1c6bb0 100%)",
        "brand-hero-soft":
          "linear-gradient(135deg, #eef4fa 0%, #d4e3f2 100%)",
      },
      boxShadow: {
        card: "0 1px 3px 0 rgb(0 56 130 / 0.06), 0 1px 2px -1px rgb(0 56 130 / 0.04)",
        pop:  "0 10px 30px -12px rgb(0 56 130 / 0.25)",
        // Floating white search bar and mobile bottom nav
        float: "0 8px 24px -6px rgb(0 0 0 / 0.15)",
      },
      borderRadius: {
        "pill": "9999px",
        "sheet": "35px",
      },
    },
  },
  plugins: [],
};

export default config;
