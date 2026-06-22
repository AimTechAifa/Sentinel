import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          25: "#f2f7ff",
          50: "#ecf3ff",
          100: "#dde9ff",
          200: "#c2d6ff",
          300: "#9cb9ff",
          400: "#7592ff",
          500: "#465fff",
          600: "#3641f5",
          700: "#2a31d8",
          800: "#252dae",
          900: "#262e89",
          950: "#161950",
        },
        success: {
          50: "#ecfdf3",
          500: "#12b76a",
          600: "#039855",
        },
        error: {
          50: "#fef3f2",
          500: "#f04438",
          600: "#d92d20",
        },
        warning: {
          50: "#fffaeb",
          500: "#f79009",
          600: "#dc6803",
        },
        ai: "#7a5af8",
        sidebar: "#0B0E14",
        primary: "#465fff",
        surface: "#F9FAFB",
        border: "#E4E7EC",
      },
      fontFamily: {
        sans: ["var(--font-outfit)", "system-ui", "sans-serif"],
      },
      fontSize: {
        "title-sm": ["1.875rem", { lineHeight: "2.375rem" }],
        "theme-sm": ["0.875rem", { lineHeight: "1.25rem" }],
        "theme-xs": ["0.75rem", { lineHeight: "1.125rem" }],
      },
      boxShadow: {
        "theme-sm": "0px 1px 3px 0px rgba(16, 24, 40, 0.1), 0px 1px 2px 0px rgba(16, 24, 40, 0.06)",
        "theme-md": "0px 4px 8px -2px rgba(16, 24, 40, 0.1), 0px 2px 4px -2px rgba(16, 24, 40, 0.06)",
      },
      animation: {
        shimmer: "shimmer 1.5s infinite",
        pulseDot: "pulseDot 2s infinite",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        pulseDot: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.5", transform: "scale(1.2)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
