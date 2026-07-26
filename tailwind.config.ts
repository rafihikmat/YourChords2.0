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
        background: "#000000",         // Pure black
        primary: "#A855F7",            // Electric Purple / Neon Purple
        "primary-light": "#C084FC",    // Lighter purple for hover
        secondary: "#E879F9",          // Fuchsia accent
        surface: "#0A0A0F",            // Slightly lighter than black for cards
        "surface-light": "#111118",    // Card hover / elevated surface
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
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 15px rgba(168, 85, 247, 0.3)" },
          "50%": { boxShadow: "0 0 30px rgba(168, 85, 247, 0.6)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.5s ease-out forwards",
        shimmer: "shimmer 2s linear infinite",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
      },
      boxShadow: {
        "neon": "0 0 15px rgba(168, 85, 247, 0.4), 0 0 45px rgba(168, 85, 247, 0.15)",
        "neon-lg": "0 0 25px rgba(168, 85, 247, 0.5), 0 0 60px rgba(168, 85, 247, 0.2)",
        "neon-sm": "0 0 8px rgba(168, 85, 247, 0.3)",
      },
    },
  },
  plugins: [],
};

export default config;
