import type { Config } from "tailwindcss";

// Tactical Dark Theme – Novaris City NCPD MDT
// All colors reference CSS custom properties defined in globals.css
// WCAG AA compliant: text on background ≥ 4.5:1 ratio

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  // Light mode is not supported in the MDT. Dark mode is the sole theme.
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // --- Structural surfaces (CSS var driven for dynamic overrides) ---
        bg:     "rgb(var(--app-bg)     / <alpha-value>)",
        panel:  "rgb(var(--app-panel)  / <alpha-value>)",
        panel2: "rgb(var(--app-panel2) / <alpha-value>)",
        line:   "rgb(var(--app-line)   / <alpha-value>)",

        // --- Semantic status palette ---
        // Brand / accent (sky-steel: #7aadcc) — primary interactive accent
        neon:   "#7aadcc",
        // Agency navy (dark police blue) — nav active state, badge backgrounds
        police: "#1e4a6b",
        // Warrant / threat — used for WANTED banners, danger actions
        danger: "#b84a4a",
        // Caution / pending — warnings, pending states
        warn:   "#e09c3a",
        // Operational green — on-duty, cleared, ok states
        ok:     "#22a870",
        // Gold / rank / finance
        gold:   "#c39a49",
      },

      fontFamily: {
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
      },

      fontSize: {
        // MDT compact typography scale
        "2xs": ["0.65rem",  { lineHeight: "1rem"  }],
        xs:    ["0.75rem",  { lineHeight: "1.1rem" }],
        sm:    ["0.8125rem",{ lineHeight: "1.25rem"}],
        base:  ["0.875rem", { lineHeight: "1.4rem" }],
      },

      boxShadow: {
        // Glow shadows for focus rings and active states
        neon:   "0 0 0 1px rgba(122,173,204,.18), 0 0 12px -4px rgba(122,173,204,.18)",
        police: "0 0 0 1px rgba(30,74,107,.22)",
        danger: "0 0 0 1px rgba(184,74,74,.18)",
        warn:   "0 0 0 1px rgba(224,156,58,.16)",
        ok:     "0 0 0 1px rgba(34,168,112,.16)",
        gold:   "0 0 0 1px rgba(195,154,73,.16)",
        card:   "0 4px 16px -8px rgba(0,0,0,.65)",
      },

      borderRadius: {
        // MDT uses tight radius (0.25rem) to match tactical HUD aesthetic
        DEFAULT: "0.25rem",
      },

      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to:   { opacity: "1" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-dot": {
          "0%, 100%": { opacity: "1" },
          "50%":       { opacity: "0.4" },
        },
      },

      animation: {
        "fade-in":  "fade-in 150ms ease-out both",
        "slide-up": "slide-up 180ms cubic-bezier(.2,.75,.25,1) both",
        "pulse-dot": "pulse-dot 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
