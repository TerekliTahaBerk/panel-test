# Design reference map

**Source.** The approved prototype canvas "Eğitim Platformu" (claude.ai design artifact
`94732950-d6bf-4a10-8f8f-109cdec09e62`), 16 artboards. The file
`design/reference/education-platform.html` named in the Phase 00 brief was **not present**
in the repository; the same design was read directly from the artifact's source files.
The prototype is not committed (see ADR-0001).

Prototype showcase backgrounds/frames are presentation only; the application canvas is
pure white (`#FFFFFF`) with a `#F9F9F8` sidebar.

## Screen inventory

| #   | Artboard        | Screen                             | Role                        | Planned route                            | Phase                                |
| --- | --------------- | ---------------------------------- | --------------------------- | ---------------------------------------- | ------------------------------------ |
| 01  | `Main`          | Kurum Yöneticisi — Genel Bakış     | Org Admin                   | `/app/[org]` (preview: `/preview/admin`) | **00 ✅**                            |
| 02  | `Teacher`       | Öğretmen — Genel Bakış             | Teacher                     | `/app/[org]`                             | 02                                   |
| 03  | `Student`       | Öğrenci — Ana Sayfa                | Student                     | `/app/[org]`                             | 02                                   |
| 04  | `Parent`        | Veli — Genel Bakış                 | Parent                      | `/app/[org]`                             | 02                                   |
| 05  | `Students`      | Öğrenci Yönetimi                   | Org Admin, Teacher          | `/app/[org]/ogrenciler`                  | 02                                   |
| 06  | `StudentDetail` | Öğrenci Detayı                     | Org Admin, Teacher          | `/app/[org]/ogrenciler/[id]`             | 02                                   |
| 07  | `Groups`        | Sınıflar ve Gruplar                | Org Admin, Teacher          | `/app/[org]/gruplar`                     | 02                                   |
| 08  | `Calendar`      | Ders Takvimi                       | All workspace roles         | `/app/[org]/takvim`                      | 03                                   |
| 09  | `Assignments`   | Ödevler                            | Org Admin, Teacher, Student | `/app/[org]/odevler`                     | 03                                   |
| 10  | `Analytics`     | Analizler                          | Org Admin                   | `/app/[org]/analizler`                   | 04                                   |
| 11  | `Onboarding`    | Kurum Kurulumu                     | Org Admin (new org)         | `/kurulum`                               | 01                                   |
| 12  | `Subscription`  | Abonelik                           | Org Admin                   | `/app/[org]/abonelik`                    | 05                                   |
| 13  | `Mobile`        | Mobil — Yönetici Paneli            | Org Admin (≤ 760px)         | responsive `/app/[org]`                  | **00 ✅** (responsive behavior)      |
| 14  | `DesignSystem`  | Tasarım Sistemi                    | —                           | tokens/components (this repo)            | **00 ✅** (tokens + core components) |
| 15  | `Login`         | Giriş Yap                          | Public                      | `/giris`                                 | 01                                   |
| —   | `Sidebar`       | Kenar Çubuğu (rol bazlı) component | All                         | `components/navigation/sidebar.tsx`      | **00 ✅** (all 4 role configs)       |

Super Admin has no prototype screen yet; it will get a separate console design.

## Design tokens (extracted)

Implemented in `src/styles/tokens.css` → `src/app/globals.css` (`@theme inline`).

**Surfaces:** canvas `#FFFFFF` · sidebar `#F9F9F8` · subtle `#F7F7F7` · row hover `#FAFAFA` ·
hover `#F0F0EF` · selected `#ECECEB` · chip `#F4F4F3` · avatar `#EDEDEC` / `#E4E4E2`.
**Text:** primary `#171717` · secondary `#6B6B6B` (4.5:1 on all surfaces) · muted `#929292`
(placeholders, kbd, chevrons, axes only) · subtle `#3D3D3D`.
**Lines:** default `#EAEAEA` · strong `#DDDDDD` · row `#F1F1F0` · kbd `#E4E4E3`.
**Semantic (dots/small text only):** success `#1F7A4D`/`#1F9D5C` · warning `#9A5B00`/`#D98A00` ·
danger `#B42318`/`#D92D20` · info `#2C5BB8`/`#3B6FD4`.
**Identity tints:** blue `#E8EEF9/#2F55A4` · green `#E6F2EC/#1F6E47` · purple `#EFEAF8/#5B3FA0` ·
amber `#F7EFDF/#7A5200`.
**Charts:** current `#171717` · comparison `#A8A8A8`/`#9A9A9A` · history `#D6D6D5` · target dashed `#CFCFCE`.

**Typography (Geist Sans, 400/500/600, tabular numbers):**

| Token        | Size / line | Weight  | Tracking          |
| ------------ | ----------- | ------- | ----------------- |
| display      | 30 / 36     | 600     | −0.028em          |
| title (page) | 26 / 32     | 600     | −0.025em          |
| metric       | 28 / 32     | 600     | −0.03em           |
| section      | 15 / 20     | 600     | −0.012em          |
| body         | 14 / 20     | 400     | −0.006em          |
| nav          | 13.5 / 18   | 400–500 | −0.006em          |
| label        | 13 / 18     | 500     | −0.006em          |
| meta         | 12.5 / 17   | 400     | 0                 |
| overline     | 11 / 14     | 500     | 0.05em, uppercase |

**Radius:** xs 5 (kbd, favorite) · sm 6 (tag, segment) · 7 (small button) · md 8 (button,
input, nav) · lg 10 (option, toast) · xl 12 (card) · 2xl 14 (dialog) · full (avatar).
**Elevation:** flat + border by default · segment `0 1px 2px /6%, 0 0 0 1px /4%` ·
popover `0 8px 24px /12%` · drawer `0 8px 32px /8%` · dialog `0 24px 64px /14%`.
**Spacing:** 4, 6, 8, 10, 12, 16, 20, 24, 28, 32, 40, 48.
**Layout:** sidebar 252 / rail 64 · topbar 52 · content padding 28/40/48 desktop, 20/16 mobile ·
max width 1360 · section gap 20 · card gap 12.
**Motion:** 160ms ease for color states; 180ms ease-out for entering surfaces;
`prefers-reduced-motion` disables both.
**Focus:** 2px `#171717` outline, 2px offset.

## Breakpoints

| Width     | Behavior                                                                          |
| --------- | --------------------------------------------------------------------------------- |
| ≥ 1280    | Full layout: 4 metrics in a row, right column beside schedule/progress            |
| 1024–1279 | Same shell; metrics 2×2 when content is narrower than 860px                       |
| 768–1023  | Drawer navigation; single-column sections; tables stay tables                     |
| < 768     | Mobile topbar (workspace name), compact metrics, schedule as a list, 44px targets |

Prototype note: it switches to drawer navigation at ≤ 760px. The implementation uses
the drawer below 1024px, because at 768px a 252px sidebar would leave the content
narrower than the prototype's own minimum column width (560px).

## Shared patterns

AppShell · AppSidebar (role configs) · Topbar + Breadcrumbs · SearchField / CommandPalette ·
SegmentedControl / Tabs · CountChip / Tag / StatusLabel · Avatar · MetricCard (sparkline) ·
SectionCard · DataTable (header 38, rows 48–52, divider `#F1F1F0`, hover `#FAFAFA`) ·
ProgressBar · Line chart (current vs comparison, dashed "this week" marker) · EmptyState ·
Skeleton · Toast · Dropdown. Planned for later screens: BulkActionBar, Dialog forms,
Calendar week/month, EventChip, FileUpload, Stepper, Checkbox/Radio/Switch, Select.
