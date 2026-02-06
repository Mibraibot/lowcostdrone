// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        warningBlink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.3" },
        },
        criticalPulse: {
          "0%": {
            boxShadow: "0 0 0 0 rgba(239,68,68,0.9)",
          },
          "70%": {
            boxShadow: "0 0 0 16px rgba(239,68,68,0)",
          },
          "100%": {
            boxShadow: "0 0 0 0 rgba(239,68,68,0)",
          },
        },
      },
      animation: {
        warning: "warningBlink 1.2s infinite",
        critical: "criticalPulse 0.7s infinite",
      },
    },
  },
  plugins: [],
};

export default config;
