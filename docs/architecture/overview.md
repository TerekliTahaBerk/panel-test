# Architecture overview (Phase 00)

## Frontend architecture

```
app/layout.tsx                 fonts (Geist via next/font), globals, <html lang="tr">
app/page.tsx                   placeholder home; links to preview only when enabled
app/preview/layout.tsx         gate: notFound() unless isPreviewEnabled(); noindex
app/preview/admin/layout.tsx   AdminPreviewShell(workspace = preview mock)
app/preview/admin/page.tsx     AdminDashboard(data = mock)
```

**Shell.** `AppShell` (client) composes Tooltip/Toast providers, `ShellProvider`
(collapse state, drawer state, palette state, active nav item derived from the pathname),
the desktop sidebar (`w-sidebar` 252px ↔ `w-rail` 64px, sticky, independently scrollable),
the mobile drawer (Radix Dialog, below `lg` = 1024px), the ⌘K command palette and a skip link.
Pages render their own `Topbar` so they can inject page controls (date range).

**Navigation** is configuration (`src/config/navigation.ts`): one `RoleNavigation` per
workspace role (sections, items, favorites). Items carry `implemented` and the roadmap
`phase` that delivers them (typed against `src/config/roadmap.ts`); unimplemented targets
show an explicit "planned" notice. Super Admin gets a separate platform console in
Phase 10, not a workspace role config.

**Active navigation** is resolved by `matchNavItem()` with segment-aware prefix matching:
the workspace root matches only itself, other entries match their path and anything nested
under it (`/ogrenciler/123` → Öğrenciler, but not `/ogrenciler-arsiv`), the most specific
href wins, and unknown paths highlight nothing.

**Workspace context** (`features/workspace/types.ts`): `{ role, organization, user, isDemo }`.
Today it comes from `preview-workspace.mock.ts`. From Phase 02 (organization) and Phase 03
(session, membership, role) the same shape is produced server-side and passed into the same
shell — no component rewrite.

**Features** own their components, types and mock data. Components receive data via props;
no business data is hard-coded in reusable UI.

**Design tokens** live once in `src/styles/tokens.css` (`--ds-*`) and are bridged to Tailwind
in `globals.css` (`@theme inline`), so utilities like `bg-sidebar`, `text-fg-secondary`,
`text-section`, `rounded-xl`, `w-sidebar` map 1:1 to the prototype.

## Planned route conventions

| Route                      | Purpose                                                             | Phase |
| -------------------------- | ------------------------------------------------------------------- | ----- |
| `/preview/*`               | Demo screens with fictional data, gated                             | 00    |
| `/app/[orgSlug]`           | Workspace root; organization resolved and scoped server-side        | 02    |
| `/giris`, `/kayit`         | Authentication                                                      | 03    |
| `/app/[orgSlug]/<segment>` | Segments from `navigation.ts` hrefs (`/ogrenciler`, `/takvim`, ...) | 04+   |
| `/kurulum`                 | Organization onboarding                                             | 05    |
| `/admin/*`                 | Super Admin console (separate layout, separate auth check)          | 10    |

The workspace layout will: authenticate → load membership for `orgSlug` → 404 if none →
build `WorkspaceContext` → render `AppShell`. Every data loader and mutation re-checks
membership and role on the server.

## Future system boundaries (pending Phase 01: Architecture & Domain Modeling)

Domain concepts: User, Organization, OrganizationMembership (user × org × role), Branch,
Role, Student, Teacher, ParentStudentRelationship, Group, Lesson, Attendance, Assignment,
Exam, Subscription.

Working assumptions (see ADR-0001, to be confirmed in Phase 01):

1. Single Next.js application (modular monolith); route handlers / server actions as the API.
2. One relational database (PostgreSQL) with an `organizationId` on every tenant-owned row,
   enforced in a data-access layer (and evaluated for row-level security) — built in Phase 02.
3. A User may belong to several organizations with different roles; role is per membership,
   enforced on the server — Phase 03.
4. Parents link to students through `ParentStudentRelationship`, scoped to one organization —
   Phase 07.
5. Billing is per organization (Subscription) — Phase 09.

No schema, migrations or database connections exist in Phase 00.

## Online Dershanem (read-only reference)

Reviewed at a shallow clone: Next.js 16 / React 19 / Tailwind 4 / Prisma with ~157 models
split by domain (`auth`, `education`, `commerce`, ...), single-tenant user model. Useful
later for education workflows (lessons, attendance, assignments, exams). It is not imported,
linked or deployed with this project.
