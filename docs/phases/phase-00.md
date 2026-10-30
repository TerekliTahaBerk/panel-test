# Phase 00 — Project foundation & design integration

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
- Responsive: tables become lists in narrow containers; 44px touch targets below `lg`.

**Placeholders (explicit demo state)**

- Every backend action (add, take attendance, review, quick actions, mark notifications
  read, favorites) shows a toast: "Önizleme · … hiçbir değişiklik kaydedilmez".
- Navigation to screens not built yet shows "Bu ekran Faz NN kapsamında uygulanacak".
- Workspace switching and sign-out are disabled menu items labelled "Faz 01".

**Planned (not implemented)**: authentication, organizations, memberships, server
authorization, database, billing, all other screens.

## Validation evidence (2026-10-30, local container)

| Check                                     | Result                                      |
| ----------------------------------------- | ------------------------------------------- |
| `npm run lint`                            | pass, 0 warnings                            |
| `npm run typecheck`                       | pass                                        |
| `npm run format:check`                    | pass                                        |
| `npm test` (Vitest)                       | 3 files, 24 tests passed                    |
| `npm run build`                           | pass (`/` static, `/preview/admin` dynamic) |
| `npm run test:e2e` (Playwright, Chromium) | 9 tests passed                              |
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
- Only Chromium is covered by Playwright; no automated visual-diff baseline yet.
- Branch name: work was pushed to the session's designated branch
  `claude/elegant-ride-92gwi2` and mirrored to `feat/phase-00-foundation` (PR source).

## Acceptance criteria

| Criterion                                  | Status                                                            |
| ------------------------------------------ | ----------------------------------------------------------------- |
| Next.js app runs locally                   | ✅                                                                |
| TypeScript strict                          | ✅                                                                |
| Design tokens implemented                  | ✅                                                                |
| Geist Sans applied consistently            | ✅                                                                |
| Sidebar matches design                     | ✅ (screenshot review)                                            |
| Topbar matches design                      | ✅ (+ "Demo verisi" marker)                                       |
| Admin dashboard implemented                | ✅                                                                |
| Typed mock data                            | ✅                                                                |
| Basic interactions work                    | ✅ (unit + e2e)                                                   |
| Desktop / tablet / mobile responsive       | ✅                                                                |
| No unintended horizontal overflow          | ✅ (asserted in e2e)                                              |
| Essential UI tests pass                    | ✅                                                                |
| Lint / typecheck / build pass              | ✅                                                                |
| GitHub CI configured                       | ✅ (`.github/workflows/quality.yml`; first run happens on the PR) |
| README and CLAUDE.md                       | ✅                                                                |
| Architecture and design mapping documented | ✅                                                                |
| No secrets or backend connections          | ✅                                                                |
| Isolated from Online Dershanem             | ✅                                                                |
