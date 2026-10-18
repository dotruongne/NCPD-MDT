# 0003. Pure Tactical Dark Theme and Draft Vault Resilience

We decided to eliminate the Light Mode toggle in favor of an exclusively tuned Tactical Dark Theme and build a dedicated client-side Draft Vault for report preservation.

## Context
Supporting a light theme in a specialized police roleplay MDT required double maintenance of hundreds of color tokens, resulting in low-contrast visual bugs in nested components. Furthermore, FiveM players frequently encounter game crashes, tab closures, and network reconnections while composing lengthy incident reports.

## Decision
1. **Retire Light Theme**: Remove `data-theme="light"` overrides and the theme toggle component. Re-allocate all design bandwidth into perfecting a high-contrast Tactical Dark Theme (Deep Navy `#070d18`, Panel Slate `#0d1726`, semantic alert accents) compliant with WCAG AA readability.
2. **Implement Draft Vault**: Equip the Report Builder with continuous 2-second debounced local persistence, visual "Saved" timestamps, and an explicit crash recovery modal.
3. **Adaptive Viewport**: Ensure all operational layouts gracefully collapse from multi-column desktop views into single-column fluid panels for 4:3 in-game tablets and auxiliary monitors without horizontal scrolling.
