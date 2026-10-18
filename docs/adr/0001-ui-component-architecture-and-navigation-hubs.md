# 0001. Tailwind Component Architecture and 4-Hub Navigation

We decided to refactor the NCPD MDT UI from legacy bespoke CSS rules into a centralized Tailwind-first component library and restructure the 20+ navigation tabs into 4 operational Hubs.

## Context
The application had accumulated over 4,000 lines of isolated CSS in `globals.css` with conflicting naming conventions and duplicate selectors. The sidebar contained over 20 separate items presented simultaneously, causing high cognitive load during rapid roleplay scenarios.

## Decision
1. Purge legacy bespoke utility classes from `globals.css` and standardize all interactive elements into atomic React components in `components/ui.tsx` (Card, Table, Modal, Badge, Button, Input) using utility-first Tailwind CSS.
2. Consolidate navigation into 4 distinct Hubs: Command & Dispatch, Records, Enforcement, and Administration, backed by a persistent high-density Compact Mode for secondary displays.
3. Focus initial redesign effort exclusively on the internal officer MDT (`/mdt`), specifically prioritizing the Report Builder and Citizen Profile workflows.
