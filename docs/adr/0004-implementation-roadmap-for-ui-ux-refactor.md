# 0004. Implementation Roadmap for UI/UX Refactor

We decided to execute the NCPD MDT UI/UX overhaul across five sequential phases, starting from atomic design tokens up to high-impact workflows and CSS purging.

## Context
A major UI overhaul carries the risk of regressions across active features if done in an unstructured manner. The user confirmed agreement on the scope, visual identity, architectural foundation, and component prioritization through the grilling interview process.

## Decision
Execute the refactor in the following sequence:
1. **Phase 1: Design Tokens & Atomic UI Components**: Standardize the Tactical Dark Theme in Tailwind and refactor `components/ui.tsx` with a cohesive, accessible set of atomic primitives (Card, Field, Button, Badge, Modal, Table, Tabs, AlertBanner). Deprecate light theme toggle.
2. **Phase 2: Navigation & 4-Hub Shell**: Redesign `components/mdt-shell.tsx` into 4 operational Hubs (Command, Records, Enforcement, Administration) with live dynamic counters, keyboard navigation (`Ctrl+1..4`), Command Palette (`Ctrl+K`), and optimized Compact/Overlay Mode.
3. **Phase 3: Split-Screen Report Builder & Draft Vault**: Transform `components/report-builder.tsx` into a 2-column layout with real-time sticky penalty computations, Discord export, and 2-second debounced local draft preservation with crash recovery.
4. **Phase 4: Tactical Citizen Dossier**: Revitalize `app/mdt/database/citizens/[id]` with immediate threat banners (WANTED / ARMED & DANGEROUS), a 1-click Quick Action Bar, and clean segmented tabs for priors, vehicles, and firearms.
5. **Phase 5: Tactical Command Center & CSS Purge**: Convert `app/mdt/page.tsx` into an active situational awareness dashboard and systematically prune unused legacy rules from `app/globals.css`.
