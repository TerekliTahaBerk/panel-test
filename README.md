# Eğitim Platformu

An independent, subscription-based education management SaaS for individual teachers,
private tutors, coaches, tutoring centers, private institutions and high schools.

Customer-facing roles: **Organization Administrator**, **Teacher**, **Student**, **Parent**.
An internal **Super Admin** role operates the platform. Each organization's data is strictly
isolated (multi-tenant infrastructure arrives in Phase 02, authentication in Phase 03).

> This project is fully independent from Online Dershanem. That product is a read-only
> reference for later phases; its repository, database and deployments are never modified.

## Phase status

Roadmap and scopes: [docs/phases/README.md](docs/phases/README.md).

| Phase | Title                            | Status                                                                 |
| ----- | -------------------------------- | ---------------------------------------------------------------------- |
| 00    | Foundation & Design Integration  | **In review** (see [docs/phases/phase-00.md](docs/phases/phase-00.md)) |
| 01    | Architecture & Domain Modeling   | Not started                                                            |
| 02    | Multi-Tenant Infrastructure      | Not started                                                            |
| 03    | Authentication & Permissions     | Not started                                                            |
| 04    | Complete Frontend Implementation | Not started                                                            |
| 05    | Organization Onboarding          | Not started                                                            |
| 06    | Academic Management              | Not started                                                            |
| 07    | Student & Parent Services        | Not started                                                            |
| 08    | Exams & Analytics                | Not started                                                            |
| 09    | Subscriptions & Billing          | Not started                                                            |
| 10    | Super Admin & Operations         | Not started                                                            |
| 11    | Security, QA & Production Launch | Not started                                                            |

## Stack

- Next.js 16 (App Router, Turbopack) · React 19 · TypeScript 5.9 (strict)
- Tailwind CSS 4 with CSS-variable design tokens · Geist Sans (self-hosted via `geist`)
- Radix UI primitives (dropdown, tooltip, tabs, dialog, toast) · cmdk · Lucide icons
- Zod for validation contracts
- ESLint (next/core-web-vitals + typescript) · Prettier
- Vitest + React Testing Library · Playwright

## Local setup

Requires Node.js ≥ 22.12 and npm 10.

```bash
npm ci
npm run dev
```

Open <http://localhost:3000/preview/admin>.

### Environment

Copy `.env.example` to `.env.local` if you need to change anything. The only variable in
Phase 00 is `ENABLE_PREVIEW_ROUTES`: preview routes are always on in `next dev` and return
404 in production builds unless it is set to `true`.

## Commands

| Command                           | What it does                                                                                    |
| --------------------------------- | ----------------------------------------------------------------------------------------------- |
| `npm run dev`                     | Development server                                                                              |
| `npm run build` / `npm start`     | Production build / serve                                                                        |
| `npm run lint`                    | ESLint                                                                                          |
| `npm run typecheck`               | `tsc --noEmit`                                                                                  |
| `npm run format` / `format:check` | Prettier                                                                                        |
| `npm test`                        | Vitest unit and component tests                                                                 |
| `npm run test:e2e`                | Playwright smoke tests (needs `npm run build` first; starts `next start` with previews enabled) |
| `npm run validate`                | lint + typecheck + unit + build                                                                 |

Playwright reference screenshots: `UPDATE_REFERENCE_SCREENSHOTS=1 npm run test:e2e` writes
them to `docs/design/screenshots/`.

## Project structure

```
src/
  app/                    routes (App Router)
    preview/              gated demo routes (fictional data)
      admin/              Organization Administrator dashboard preview
  components/
    ui/                   design-system primitives (Button, Badge, Tabs, Dropdown, ...)
    layout/               AppShell, Topbar, mobile drawer, shell state
    navigation/           Sidebar, breadcrumbs, command palette, notifications
  config/                 app config, preview gating, role navigation
  features/
    dashboard/            admin dashboard components, types, mock data
    workspace/            workspace context type + preview workspace
  hooks/                  shared hooks (demo-action notices)
  lib/                    cn(), formatting
  styles/tokens.css       design tokens (single source of truth)
  types/                  shared domain types (roles)
docs/                     architecture, design map, phases, ADRs
tests/unit, tests/e2e     Vitest and Playwright suites
```

See [docs/architecture/overview.md](docs/architecture/overview.md) for boundaries and
[docs/design/reference-map.md](docs/design/reference-map.md) for the prototype inventory.
