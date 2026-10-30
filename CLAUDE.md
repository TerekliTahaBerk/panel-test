# CLAUDE.md — project rules

Persistent instructions for Claude Code (and humans) working in this repository.

## Repository boundaries

- This repo is an independent product. **Never** modify, push to, or connect to Online
  Dershanem (its repository, database, deployments or services). Read it only for reference.
- Do not copy its Prisma schema or legacy data model wholesale; the new domain model is
  designed in Phase 01 for the multi-tenant infrastructure of Phase 02.
- Do not commit exported prototype bundles, embedded font binaries, credentials, `.env*`
  files (except `.env.example`) or build output.

## Phase-by-phase policy

- Work happens in numbered phases following the approved roadmap in
  `docs/phases/README.md` (mirrored in `src/config/roadmap.ts`): 00 Foundation & Design
  Integration · 01 Architecture & Domain Modeling · 02 Multi-Tenant Infrastructure ·
  03 Authentication & Permissions · 04 Complete Frontend Implementation · 05 Organization
  Onboarding · 06 Academic Management · 07 Student & Parent Services · 08 Exams & Analytics ·
  09 Subscriptions & Billing · 10 Super Admin & Operations · 11 Security, QA & Production
  Launch.
- Only build what the current phase defines; each phase has `docs/phases/phase-NN.md`.
  Record decisions as ADRs in `docs/decisions/`. When the roadmap changes, update
  `roadmap.ts`, the `phase` values in `navigation.ts`, README, the reference map and the
  architecture overview together.
- Each phase doc keeps: objectives, checklist, completed work, validation evidence, open
  issues, acceptance criteria. Never mark a criterion done without evidence.
- Not in scope until a phase asks for it: microservices, monorepo tooling, Redis, workers,
  payment or auth providers (Phase 03 / 09), production database connections (Phase 02).

## Coding conventions

- TypeScript strict (`noUncheckedIndexedAccess` on). No `any`; prefer types inferred from
  `as const` arrays and Zod schemas.
- Path alias `@/*` → `src/*`. Feature code lives in `src/features/<feature>/{components,data,types}`;
  shared primitives in `src/components/ui`.
- Server Components by default; add `"use client"` only where interaction needs it.
- Styling: Tailwind utilities backed by tokens in `src/styles/tokens.css` and the
  `@theme` bridge in `src/app/globals.css`. No raw hex values in components; add a token.
  Use `cn()` (it knows the custom type scale — add new text tokens there too).
- Use Radix primitives for menus, dialogs, tooltips, tabs and toasts — do not hand-roll
  focus management.
- UI copy is Turkish. Numbers: `tr-TR` (`%72,4`, `−1,4` with a true minus sign).
- Prettier formats everything (`npm run format`).

## Security principles

- Role-based navigation decides what is **shown**, never what is **allowed**. Every
  permission check belongs on the server, scoped to the user's organization membership.
- Never trust client-supplied organization ids or roles.
- Mock data lives in `*.mock.ts` files under `features/*/data` and is imported only by
  `/preview` routes and tests. Preview routes 404 in production unless
  `ENABLE_PREVIEW_ROUTES=true`.
- No secrets in the repo; document new variables in `.env.example`.

## Design fidelity

- The approved prototype (16 screens, see `docs/design/reference-map.md`) is the source of
  truth. Do not redesign; match spacing, type, colors and hierarchy.
- Neutral-first palette; semantic colors only on dots, small text and data.
- Geist Sans only (weights 400/500/600); `tabular` utility for numbers.
- Verify against screenshots at 1440 / 1280 / 768 / 390. No horizontal page overflow; touch
  targets ≥ 44×44px below `lg` (use `max-lg:touch-hit` to enlarge the hit area of compact
  controls without changing their look; `tests/e2e/touch-targets.spec.ts` audits this).
- Actions that need a backend use `useDemoAction()` (explicit "nothing was saved" notice).
  No fake success, no dead buttons.

## Testing requirements

Before every commit that changes code: `npm run lint && npm run typecheck && npm test &&
npm run build`. For UI changes also run `npm run test:e2e` and look at the screenshots in
`test-results/`. Add a unit/component test for new behavior and a Playwright check for new
layouts or responsive behavior.

## Commit and PR workflow

- Branch from `main` per phase or feature; never push directly to `main` after bootstrap.
- Small, focused commits with imperative messages (`feat:`, `fix:`, `docs:`, `test:`,
  `chore:`).
- PRs target `main`, describe scope and validation evidence, and are never auto-merged.
  CI (`.github/workflows/quality.yml`) must be green.
