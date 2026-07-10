import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        muted: "hsl(var(--muted))",
        "muted-foreground": "hsl(var(--muted-foreground))",
        primary: "hsl(var(--primary))",
        "primary-foreground": "hsl(var(--primary-foreground))",
        success: "hsl(var(--success))",
        warning: "hsl(var(--warning))",
        danger: "hsl(var(--danger))"
      },
      boxShadow: {
        soft: "0 18px 60px rgba(15, 23, 42, 0.08)"
      },
      keyframes: {
        "gradient-pan": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" }
        },
        "glow-drift": {
          "0%, 100%": { transform: "translate(0, 0) scale(1)", opacity: "0.5" },
          "50%": { transform: "translate(2%, 3%) scale(1.08)", opacity: "0.8" }
        },
        "particle-float": {
          "0%, 100%": { transform: "translateY(0)", opacity: "0.35" },
          "50%": { transform: "translateY(-16px)", opacity: "0.9" }
        },
        "grid-drift": {
          "0%": { backgroundPosition: "0px 0px" },
          "100%": { backgroundPosition: "28px 28px" }
        }
      },
      animation: {
        "gradient-pan": "gradient-pan 6s ease-in-out infinite",
        "glow-drift": "glow-drift 10s ease-in-out infinite",
        "particle-float": "particle-float 6s ease-in-out infinite",
        "grid-drift": "grid-drift 14s linear infinite"
      }
    }
  },
  plugins: []
};

export default config;
