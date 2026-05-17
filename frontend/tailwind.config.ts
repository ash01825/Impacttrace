import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: "#09090B", // Zinc 950
          surface: "#18181B", // Zinc 900
          elevated: "#27272A", // Zinc 800
        },
        text: {
          primary: "#FAFAFA", // Zinc 50
          secondary: "#A1A1AA", // Zinc 400
          muted: "#71717A", // Zinc 500
        },
        accent: {
          DEFAULT: "#FAFAFA",
          dim: "#A1A1AA",
        },
        risk: {
          high: "#F87171", // Red 400
          medium: "#FBBF24", // Amber 400
          low: "#34D399", // Emerald 400
        }
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out forwards",
        "slide-up": "slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
