# Phase 00 — Foundation & Design Integration

Roadmap position: first of twelve phases (see [README.md](README.md)). Next: Phase 01 —
Architecture & Domain Modeling.

## Objectives

Initialize the application, extract the approved design system, and implement a
responsive Organization Administrator dashboard as real React components with typed
mock data — structured so auth, multi-tenancy and server data can be added without a
frontend rewrite.

## Checklist

- [x] Repository audit (empty repo; bootstrap commit created)
- [x] Design inspected (16 artboards read from the design artifact; local HTML file absent)
- [x] Online Dershanem reviewed read-only (shallow clone, nothing modified)
- [x] Next.js 16 + React 19 + strict TypeScript + Tailwind 4 + Geist
- [x] Design tokens (colors, type, spacing, radius, borders, elevation, layout, breakpoints, motion)
- [x] UI primitives: Button, IconButton, Input, Badge, Avatar, Card, Separator, Dropdown,
      Tooltip, Tabs, Skeleton, EmptyState (+ Kbd, Spinner, Toast)
- [x] App shell: workspace switcher, search, main/management nav, favorites, help, account,
      collapse to rail, mobile drawer, active/hover/focus states
- [x] Topbar: breadcrumbs, demo marker, date range, search/⌘K, notifications
- [x] Admin dashboard: greeting, 4 metrics, Bugünün Programı, Dikkat Gerektirenler,
      Öğrenci Gelişimi, Son Aktiviteler, Hızlı İşlemler
- [x] Typed mock data separated in `*.mock.ts`; demo clearly marked
- [x] `/preview/admin`, gated in production
- [x] Unit + component tests, Playwright smoke at 1440/1280/768/390
- [x] GitHub Actions quality workflow
- [x] README, CLAUDE.md, architecture, design map, ADR-0001

## Completed work

**Implemented (real behavior)**

- Sidebar collapse/expand (252 ↔ 64px) with tooltips in rail mode; mobile drawer (< 1024px).
- Role-aware navigation config for admin, teacher, student, parent (only admin rendered).
- ⌘K / Ctrl+K command palette (cmdk) with page and action search.
- Schedule status tabs (Tümü / Devam eden / Yaklaşan / Tamamlanan) filter the table.
- Date range (Bugün / Bu hafta / Bu ay) switches metric values.
- Progress window (Son 4 / 8 / 12 hafta) re-renders the chart, deltas and labels.
- Dropdowns: workspace, account, notifications, "Yeni Ekle", row actions, card options.
- Responsive: tables become lists in narrow containers.
- Touch targets: every visible control in the topbar and dashboard has an effective
  44×44px target below `lg` (1024px). Compact controls keep their visual size and get an
  invisible hit area via the `touch-hit` utility; the drawer uses real 44px rows.
- Active navigation uses segment-aware matching (`matchNavItem`): nested routes activate
  their parent entry, the most specific entry wins, unknown routes highlight nothing.

**Placeholders (explicit demo state)**

- Every backend action (add, take attendance, review, quick actions, mark notifications
  read, favorites) shows a toast: "Önizleme · … hiçbir değişiklik kaydedilmez".
- Navigation to screens not built yet shows "Bu ekran Faz NN kapsamında uygulanacak", with
  NN taken from the approved roadmap (typed in `src/config/roadmap.ts`).
- Workspace switching ("Faz 02") and sign-out ("Faz 03") are disabled menu items.

**Planned (not implemented)**: authentication, organizations, memberships, server
authorization, database, billing, all other screens.

## Review round 1 (PR #1 findings)

| Finding                    | Resolution                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P1 Roadmap consistency     | Added `docs/phases/README.md` and `src/config/roadmap.ts` (phases 00–11). Re-mapped every navigation `phase` (prototype screens → 04; others → domain phase), in-app "Faz" labels, README, CLAUDE.md, reference map (UI vs live-data phase), architecture overview and ADR-0001. A unit test fails if navigation references a phase outside the roadmap. Scope of Phase 00 unchanged.                                                                                                                                                                                                                                                                                                                   |
| P1 Mobile accessibility    | New Playwright audit (`tests/e2e/touch-targets.spec.ts`) probes the real tap area of every visible control at 390px and 768px with `elementFromPoint`. Before the fix it flagged 11 controls at 390px and 23 at 768px: segmented tabs, attention-list buttons, card menus, row actions, "Son 12 hafta", "Tümü", "Takvim", date range, "Yeni Ekle", demo badge and breadcrumb link. Fixed with the `touch-hit` utility on Button/IconButton/Tabs sizes and the remaining compact controls; the tab list no longer clips them. Drawer rows are also asserted (≥44px). Visuals unchanged: pixel diff of the reference screenshots shows only antialiasing/animated-dot noise (max channel delta < 24/255). |
| P2 Nested route navigation | `resolveActiveNavId()` now uses `matchNavItem()`: whole-segment prefix matching, most specific match wins, root matches only itself, unknown/foreign paths return `null`. Unit tests cover root (incl. trailing slash and query), nested, deep nested, similar prefixes, unknown, foreign base paths and specificity.                                                                                                                                                                                                                                                                                                                                                                                   |

## Validation evidence (2026-10-30, local container, after review round 1)

| Check                                     | Result                                      |
| ----------------------------------------- | ------------------------------------------- |
| `npm run lint`                            | pass, 0 warnings                            |
| `npm run typecheck`                       | pass                                        |
| `npm run format:check`                    | pass                                        |
| `npm test` (Vitest)                       | 3 files, 29 tests passed                    |
| `npm run build`                           | pass (`/` static, `/preview/admin` dynamic) |
| `npm run test:e2e` (Playwright, Chromium) | 12 tests passed                             |
| Touch-target audit (effective ≥44×44px)   | 29 controls at 390px, 31 at 768px: 0 fail   |
| Horizontal overflow at 1440/1280/768/390  | 0px at each                                 |
| Console errors at 1440/1280/768/390       | none                                        |
| Production build without flag             | `/preview/admin` → 404                      |

Reference screenshots: `docs/design/screenshots/admin-{desktop-1440,laptop-1280,tablet-768,mobile-390}.png`,
reviewed against the prototype. Fixes made after review: invisible primary-button text
(tailwind-merge custom text sizes), sidebar background height, quick-action label
truncation, overlapping chart labels, 3+1 group-bar wrap, clipped mobile tabs, wrapping
metric deltas.

## Remaining issues / known limitations

- At 1280px the schedule card is ~608px wide, so its tab row wraps under the title and
  topic text wraps in cells (same constraint as the prototype's flex layout).
- On narrow screens the schedule's "Takvim" link is hidden (reachable via ⌘K).
- Greeting and date are fixed demo values ("Günaydın", 3 Kasım 2026), not clock-derived.
- Sidebar collapse state is not persisted between visits.
- Only Chromium is covered by Playwright; no automated visual-diff baseline yet (the
  reference screenshots are reviewed manually).
- Touch targets are enforced below `lg` only, per project standards; desktop keeps the
  prototype's compact 28–32px controls.
- `touch-hit` relies on ancestors not clipping overflow; controls placed later inside an
  `overflow-hidden` box need a real 44px box instead (the audit test catches regressions
  on the dashboard only).
- At viewports narrower than ~340px the four schedule tabs may not fit; 390px is the
  smallest supported width.
- Branch name: work was pushed to the session's designated branch
  `claude/elegant-ride-92gwi2` and mirrored to `feat/phase-00-foundation` (PR source).

## Acceptance criteria

| Criterion                                  | Status                                                         |
| ------------------------------------------ | -------------------------------------------------------------- |
| Next.js app runs locally                   | ✅                                                             |
| TypeScript strict                          | ✅                                                             |
| Design tokens implemented                  | ✅                                                             |
| Geist Sans applied consistently            | ✅                                                             |
| Sidebar matches design                     | ✅ (screenshot review)                                         |
| Topbar matches design                      | ✅ (+ "Demo verisi" marker)                                    |
| Admin dashboard implemented                | ✅                                                             |
| Typed mock data                            | ✅                                                             |
| Basic interactions work                    | ✅ (unit + e2e)                                                |
| Desktop / tablet / mobile responsive       | ✅                                                             |
| Touch targets ≥ 44×44px below `lg`         | ✅ (audited in e2e at 390 and 768)                             |
| Roadmap consistent across code and docs    | ✅ (`roadmap.ts` + unit test)                                  |
| No unintended horizontal overflow          | ✅ (asserted in e2e)                                           |
| Essential UI tests pass                    | ✅                                                             |
| Lint / typecheck / build pass              | ✅                                                             |
| GitHub CI configured                       | ✅ (`.github/workflows/quality.yml`; both jobs green on PR #1) |
| README and CLAUDE.md                       | ✅                                                             |
| Architecture and design mapping documented | ✅                                                             |
| No secrets or backend connections          | ✅                                                             |
| Isolated from Online Dershanem             | ✅                                                             |
