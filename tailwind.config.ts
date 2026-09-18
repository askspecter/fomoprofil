import type { Config } from "tailwindcss";

/**
 * Vibz — cinematic monochrome design tokens.
 * A warm near-black canvas, sculpted white / silver signature, hairline glass
 * surfaces — matched to the sculpted white infinity monogram on espresso black.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Warm charcoal glass surfaces (ink.* utilities flip to dark).
        ink: {
          950: "#080706",
          900: "#0b0a09",
          800: "#141210",
          700: "#1f1c19",
          line: "rgba(255,255,255,0.10)",
        },
        // Brand accent = the logo's sculpted white / warm silver.
        pink: {
          DEFAULT: "#f4f1ea",
          soft: "#ffffff",
          deep: "#c8c3b8",
        },
        // Legacy aliases kept on the monochrome ramp.
        rose: {
          DEFAULT: "#f4f1ea",
          soft: "#ffffff",
        },
        ember: {
          DEFAULT: "#d9d5cc",
          soft: "#f4f1ea",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(255,255,255,0.22), 0 20px 60px -20px rgba(255,255,255,0.28)",
        card: "0 40px 90px -50px rgba(0,0,0,0.85)",
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
