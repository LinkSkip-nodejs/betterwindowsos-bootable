import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        accent: "var(--accent-color)",
      },
      boxShadow: {
        glass: "0 10px 30px rgba(0, 0, 0, 0.3)",
      },
      fontFamily: {
        sans: ["var(--font-family)"],
        mono: ["var(--font-mono)"],
      },
    },
  },
  plugins: [],
} satisfies Config;
