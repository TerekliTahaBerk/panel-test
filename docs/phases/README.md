# Roadmap

The approved delivery roadmap. `src/config/roadmap.ts` mirrors this list; navigation
entries (`src/config/navigation.ts`) reference these ids. Each phase gets its own
`phase-NN.md` when it starts.

| Phase | Title                            | Scope (summary)                                                                                                                | Status      |
| ----- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ----------- |
| 00    | Foundation & Design Integration  | App scaffold, design tokens, UI primitives, app shell, admin dashboard preview, CI                                             | Completed   |
| 01    | Architecture & Domain Modeling   | Validate ADR-0001 assumptions; domain model (User, Organization, Membership, Branch, Role, Student, Teacher, Group, ...); ADRs | Completed   |
| 02    | Multi-Tenant Infrastructure      | Database, organization scoping of every tenant-owned row, workspace routing (`/app/[orgSlug]`), organization switching         | Completed   |
| 03    | Authentication & Permissions     | Sign-in (`/giris`), sessions, memberships and roles, server-side authorization, account settings, sign-out                     | Not started |
| 04    | Complete Frontend Implementation | Every screen in the approved prototype as real routes and components (role dashboards, management screens, calendar, ...)      | Not started |
| 05    | Organization Onboarding          | Organization setup flow (`/kurulum`), organization profile and settings, inviting members                                      | Not started |
| 06    | Academic Management              | Teachers, groups, lessons, attendance, homework, materials — backed by real data                                               | Not started |
| 07    | Student & Parent Services        | Student and parent experiences: children, progress, goals, notifications, homework tracking                                    | Not started |
| 08    | Exams & Analytics                | Mock exams, results, progress analytics and reporting                                                                          | Not started |
| 09    | Subscriptions & Billing          | Plans, quotas, payments and invoices per organization                                                                          | Not started |
| 10    | Super Admin & Operations         | Internal platform console, organization support tooling, operational dashboards                                                | Not started |
| 11    | Security, QA & Production Launch | Security review, hardening, full QA, performance, production deployment                                                        | Not started |

## How screens map to phases

- A screen that exists in the approved prototype is delivered as UI in **Phase 04** and
  wired to real data by its domain phase (e.g. the Subscription screen UI in 04, billing in 09).
- Exceptions: the Login and Onboarding flows ship with Phases 03 and 05.
- A screen with no prototype arrives with its domain phase (e.g. Teachers → 06, Exams → 08).
- The navigation `phase` field records the phase that first delivers the screen.
