import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#070a12",
        "cyber-dark": "#070a12",
        "cyber-card": "rgba(15, 23, 42, 0.65)",
        "cyber-primary": "#a855f7",
        "cyber-cyan": "#06b6d4",
        "cyber-accent": "#f43f5e",
        "cyber-border": "rgba(168, 85, 247, 0.2)",
        primary: "#a855f7",
        "primary-light": "#c084fc",
        secondary: "#e879f9",
        surface: "#0a0a0f",
        "surface-light": "#111118",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        "light-sweep": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(200%)" },
        },
        "pulse-subtle": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.6", transform: "scale(1.05)" },
        },
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 15px rgba(168, 85, 247, 0.3)" },
          "50%": { boxShadow: "0 0 30px rgba(168, 85, 247, 0.6)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.5s ease-out forwards",
        shimmer: "shimmer 2s linear infinite",
        "light-sweep": "light-sweep 2.5s ease-in-out infinite",
        "pulse-subtle": "pulse-subtle 3s ease-in-out infinite",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
      },
      boxShadow: {
        "glow-sm": "0 0 15px -3px rgba(168, 85, 247, 0.3)",
        "glow-md": "0 0 25px -5px rgba(168, 85, 247, 0.45)",
        "glow-cyan": "0 0 25px -5px rgba(6, 182, 212, 0.45)",
        "neon": "0 0 15px rgba(168, 85, 247, 0.4), 0 0 45px rgba(168, 85, 247, 0.15)",
        "neon-lg": "0 0 25px rgba(168, 85, 247, 0.5), 0 0 60px rgba(168, 85, 247, 0.2)",
        "neon-sm": "0 0 8px rgba(168, 85, 247, 0.3)",
      },
    },
  },
  plugins: [],
};

export default config;

