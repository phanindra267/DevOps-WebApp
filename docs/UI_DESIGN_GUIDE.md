# CloudOps Sentinel — Premium UI Design Guide (Session 2026–27)

## Overview

The entire 11-page application was upgraded from a functional dashboard into a
premium, modern, responsive control-plane experience. The redesign is
**project-wide** — shared design system, application shell, navigation,
components, and every module — not just the homepage.

All screenshots are real captures of the running local application at
`http://localhost:3000` (see `evidence/ui/`), produced by `scripts/verify_ui.js`.

## Design system (`frontend/styles/globals.css`)

- Deep-navy ambient lighting with radial accent washes and a subtle cyber grid.
- Glass surfaces (`backdrop-filter`), gradient borders, soft and glow shadows.
- Consistent 14–16 px radii, tabular numeric values, refined Inter/system typography.
- **Local-only fonts** — no Google Fonts / external CDN request at runtime.
- Unified tokens for easing, surfaces, gradients, shadows and header height.
- Reusable primitives: `.ui-panel`, `.ui-grid`, `.ui-split`, `.ui-toolbar`,
  `.ui-chip`, `.glass`, `.gradient-text`, `.hover-lift`, `.reveal`, `.chart-tooltip`.
- `prefers-reduced-motion` support and visible `:focus-visible` rings.

## Motion & interaction

- Framer Motion page transitions (fade + slide + subtle blur) keyed on route.
- Staggered card reveals via IntersectionObserver (`.reveal`).
- Hover lift, sheen sweep on stat cards, pinging status dots, pulsing glows.
- Animated modals (ESC / overlay close, focus handling, scroll lock, aria-modal).
- Toast notifications with auto-dismiss, progress bar and `aria-live` region.
- Command palette: **Ctrl / ⌘ + K**, fuzzy filter, arrow keys + Enter.
- Tooltips via `data-tip`, back-to-top button, polished scrollbars.

## Application shell (`src/components/Layout.tsx`)

- Collapsible desktop sidebar (persisted preference).
- True mobile drawer at ≤ 900 px with scrim, full labels and touch-friendly targets.
- Breadcrumb, compact status pill, external-tool shortcuts, account dropdown.
- Responsive topbar that degrades gracefully to icon-only actions on mobile.

## Shared components

| Component | Upgrade |
|---|---|
| `DataTable` | Real client-side search, clickable sort, pagination, CSV export, row-click, staggered rows, skeleton + empty states |
| `Modal` | Motion, ESC/overlay close, focus, scroll lock, accessibility, max-height |
| `Card` | Trend/sparkline, clickable/href, loading state, animated hover only when interactive |
| `StatusBadge` | Pulse/halo animation, better contrast, `role="status"` |
| `Charts` | Recharts area/bar/donut/line/sparkline with themed dark tooltips and graceful empty states |
| `PageHeader` | Eyebrow, icon, gradient title, actions, breadcrumbs |
| `ToastContext` | `toast.success/error/info`, stacked viewport, auto-dismiss |

## Module-by-module

- **Dashboard** — real `/api/v1/metrics-data` telemetry timeline, alert severity donut, live API health, honest empty states, real navigation shortcuts (no fabricated "scan results").
- **Cost & FinOps** — gradient/rounded recharts, animated budget progress, recommendation tabs, search, sortable savings, expandable rows.
- **Monitoring** — real numeric metric bar chart, firing/resolved donut, alert & metric search and tabs.
- **Security** — severity donut, working project selector, severity tabs, finding search, scan feedback and gate banner.
- **Governance** — compliance-coverage donut, 4-stat strip, severity tabs, policy + audit-log search.
- **Reliability** — debt-priority bars, experiment/debt tabs, searches, recovery-flow indicators.
- **Projects / Deployments / Pipelines / Infrastructure / Curriculum Hub** — inherit the shared shell, motion, responsive grid, table, modal and tooltip upgrades.
- **Login** — animated entrance, password visibility toggle, one-click demo credentials, toasts, ambient orbs.

## Telemetry integrity

`scripts/seed_local_metrics.ps1` writes **real Prometheus query results** into
the local metric store through the authenticated API (no invented values), so
the dashboard and monitoring charts display genuine local service data.

## Verification

```powershell
cd frontend; npx tsc --noEmit          # clean
docker compose build --no-cache frontend
docker compose up -d --force-recreate frontend
node scripts\verify_ui.js <jwt-file> evidence\ui
```

`evidence/ui/ui_report.json` contains captured page URLs, titles and any browser
errors. The final run reported no runtime JavaScript exceptions; remaining
network 404 is the optional favicon and does not affect the UI.
