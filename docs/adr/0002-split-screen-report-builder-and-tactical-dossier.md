# 0002. Split-Screen Report Builder and Tactical Dossier Layout

We decided to adopt a split-screen live calculation layout for the Report Builder and restructure the citizen detail view into a high-threat Tactical Dossier.

## Context
Writing reports is the highest-frequency operational task in the MDT. Officers previously had to scroll up and down repeatedly to verify charges and prison sentences against incident notes. Additionally, when conducting high-risk traffic stops, officers needed immediate awareness of an individual's threat level rather than reading through tabular raw data.

## Decision
1. **Report Builder**: Implement a persistent split-screen view on desktop screens where the left pane contains the case facts, suspect selection, and searchable charge catalog, while the right pane remains sticky, calculating total fines, prison months, and Discord export formatting in real time.
2. **Citizen Detail (Tactical Dossier)**: Place high-visibility emergency threat banners (WANTED / ARMED & DANGEROUS) above the fold, accompanied by a 1-click Quick Action Bar (traffic citation, attach to new report, license suspension).
3. **Phased CSS Migration**: Introduce new modular components in `components/ui.tsx` first to power these flagship flows before incrementally pruning legacy rules from `globals.css`.
