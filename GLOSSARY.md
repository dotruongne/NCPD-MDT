# Novaris City NCPD MDT

The internal tactical and operational system for the Night City / Novaris City Police Department, providing officer management, dispatch, criminal records, and case reporting.

## Language

### Operational Concepts

**MDT (Mobile Data Terminal)**:
The primary tactical operating terminal used by police officers on duty to query records, manage incidents, and log reports.
_Avoid_: Police Portal, Admin Panel, CAD

**Hub**:
A top-level operational zone in navigation that clusters related workflows into a focused workspace (Command & Dispatch, Records, Enforcement, Administration).
_Avoid_: Category, Menu group, Folder

**Compact Mode**:
A high-density, minimal-chrome layout mode engineered specifically for secondary monitors or in-game overlays while patrolling.
_Avoid_: Mobile view, Responsive mode

**Report Builder**:
The interactive multi-step incident reporting tool that automatically computes fines, jail sentences, and binds warrants and evidence.
_Avoid_: Report form, Ticket maker, Form tạo án

**Citizen Record**:
The canonical master profile of an individual citizen containing priors, licenses, registered vehicles, and weapons.
_Avoid_: User profile, Citizen page, Profile công dân

**Tactical Dossier**:
An actionable operational view of a citizen profile prioritizing threat levels (WANTED, ARMED & DANGEROUS), quick enforcement actions, and categorized legal records.
_Avoid_: Citizen details, Profile view, Hồ sơ cá nhân

**Live Summary**:
The real-time calculation sidebar within the Report Builder that dynamically aggregates charge penalties, prison sentences, and threat tier adjustments as charges are toggled.
_Avoid_: Penalty calculator, Bill, Bảng tính phạt

**Command Palette**:
The global quick-action search modal triggered via Ctrl+K, indexing citizens, vehicles, reports, and active warrants for zero-latency retrieval.
_Avoid_: Search bar, Quick search, Hộp tìm kiếm

**Tactical Command Center**:
The primary dashboard landing interface presenting real-time situational awareness, emergency feeds (10-13, BOLO), duty controls, and instant launchers.
_Avoid_: Home page, Admin dashboard, Trang chủ

**Draft Vault**:
The client-side persistence and recovery mechanism that continuously snapshots incomplete incident reports and restores them after crashes or disconnections.
_Avoid_: Local cache, Temp file, Bộ nhớ tạm

**Tactical Dark Theme**:
The sole standardized visual theme optimized for low-light operational environments with deep navy backdrops, high-contrast text, and semantic police status accents.
_Avoid_: Night mode, Dark mode toggle, Chế độ tối


