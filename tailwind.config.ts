import type { Config } from "tailwindcss";
import { palette } from "./lib/palette";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: palette.brand,
        accent: palette.accent,
        gray: palette.gray,
        success: palette.success,
        error: palette.error,
        warning: palette.warning,
        ai: palette.ai,
        sidebar: palette.sidebar,
        primary: palette.brand[500],
        surface: palette.surface,
        border: palette.border,
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
        "text-shimmer": "text-shimmer 4s linear infinite",
        marquee: "marquee 40s linear infinite",
        "border-beam": "border-beam 4s linear infinite",
        float: "float 5s ease-in-out infinite",
        glow: "glow 2s ease-in-out infinite",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "text-shimmer": {
          "0%": { backgroundPosition: "0% center" },
          "100%": { backgroundPosition: "200% center" },
        },
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(calc(-100% - var(--gap, 1rem)))" },
        },
        pulseDot: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.5", transform: "scale(1.2)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        glow: {
          "0%, 100%": { opacity: "0.5" },
          "50%": { opacity: "1" },
        },
        "border-beam": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
