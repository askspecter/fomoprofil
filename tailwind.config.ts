import type { Config } from "tailwindcss";

/**
 * Pork — cinematic design tokens.
 * Warm near-black canvas, a rose→amber signature gradient, hairline glass.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Light "Prism" surfaces (repurposed ink.* so existing utilities flip).
        ink: {
          950: "#ffffff",
          900: "#fff3fa",
          800: "#ffffff",
          700: "#ffe3f1",
          line: "rgba(0,0,0,0.08)",
        },
        // Brand pink, sampled from the Pork ribbon mark.
        pink: {
          DEFAULT: "#ec0e7b",
          soft: "#ff5fa5",
          deep: "#b00a5e",
        },
        // Legacy aliases kept pink so the theme stays black/white/pink.
        rose: {
          DEFAULT: "#ec0e7b",
          soft: "#ff5fa5",
        },
        ember: {
          DEFAULT: "#ff5fa5",
          soft: "#ff8bc0",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(236,14,123,0.35), 0 20px 60px -20px rgba(236,14,123,0.5)",
        card: "0 30px 80px -40px rgba(0,0,0,0.95)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "glow-pulse": {
          "0%,100%": { opacity: "0.55" },
          "50%": { opacity: "1" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.7s cubic-bezier(0.16,1,0.3,1) both",
        "glow-pulse": "glow-pulse 4s ease-in-out infinite",
        marquee: "marquee 32s linear infinite",
        shimmer: "shimmer 2.2s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
