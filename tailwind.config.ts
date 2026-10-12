import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "rgb(var(--app-bg) / <alpha-value>)",
        panel: "rgb(var(--app-panel) / <alpha-value>)",
        panel2: "rgb(var(--app-panel2) / <alpha-value>)",
        line: "rgb(var(--app-line) / <alpha-value>)",
        neon: "#8ab4d0",
        police: "#315d82",
        gold: "#c39a49",
        danger: "#b84a4a",
        warn: "#f59e0b",
        ok: "#10b981",
      },
      fontFamily: {
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
      },
      boxShadow: {
        neon: "0 0 0 1px rgba(138,180,208,.12)",
        police: "0 0 0 1px rgba(49,93,130,.16)",
        danger: "0 0 0 1px rgba(184,74,74,.14)",
        gold: "0 0 0 1px rgba(195,154,73,.14)",
        ok: "0 0 0 1px rgba(16,185,129,.12)",
        card: "0 8px 24px -20px rgba(0,0,0,.75)",
      },
    },
  },
  plugins: [],
};
export default config;
