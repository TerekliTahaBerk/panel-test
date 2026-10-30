import {
  BookOpen,
  Building2,
  Calendar,
  ChartLine,
  ClipboardList,
  CreditCard,
  FileText,
  GraduationCap,
  House,
  LayoutGrid,
  Presentation,
  Settings,
  ShieldCheck,
  Target,
  TrendingUp,
  Users,
  Bell,
  type LucideIcon,
} from "lucide-react";
import type { WorkspaceRole } from "@/types/roles";
import type { RoadmapPhaseId } from "./roadmap";

/**
 * Role-aware sidebar configuration. One sidebar component renders all roles;
 * only items, sections and the account block change.
 *
 * `href` is the future route segment relative to the workspace root
 * (e.g. `/app/[org]/ogrenciler`). `implemented` marks screens that exist in
 * the current phase; the rest render normally but explain they are planned.
 *
 * `phase` follows the approved roadmap (docs/phases/README.md): screens that
 * exist in the approved prototype are delivered by Phase 04 (Complete
 * Frontend Implementation); screens without a prototype arrive with their
 * domain phase (03 Auth & Permissions, 05 Onboarding, 06 Academic,
 * 07 Student & Parent Services, 08 Exams & Analytics).
 *
 * This decides what is SHOWN, never what is ALLOWED. Server-side
 * authorization remains the boundary.
 */

export type NavItemId = string;

export interface NavItem {
  id: NavItemId;
  label: string;
  icon: LucideIcon;
  href: string;
  count?: number;
  implemented?: boolean;
  /** Roadmap phase that delivers the screen (two digits, e.g. "04"). */
  phase?: RoadmapPhaseId;
}

export type IdentityTone = "blue" | "green" | "purple" | "amber";

export interface FavoriteItem {
  id: string;
  label: string;
  initial: string;
  tone: IdentityTone;
  meta?: string;
}

export interface NavSection {
  id: string;
  /** Overline label; omitted for the primary section. */
  label?: string;
  items: NavItem[];
}

export interface RoleNavigation {
  role: WorkspaceRole;
  sections: NavSection[];
  favorites: { label: string; items: FavoriteItem[]; canAdd: boolean };
}

export const roleNavigation: Record<WorkspaceRole, RoleNavigation> = {
  admin: {
    role: "admin",
    sections: [
      {
        id: "main",
        items: [
          { id: "genel", label: "Genel Bakış", icon: LayoutGrid, href: "", implemented: true },
          {
            id: "ogrenciler",
            label: "Öğrenciler",
            icon: GraduationCap,
            href: "/ogrenciler",
            count: 248,
            phase: "04",
          },
          {
            id: "ogretmenler",
            label: "Öğretmenler",
            icon: Presentation,
            href: "/ogretmenler",
            phase: "06",
          },
          {
            id: "gruplar",
            label: "Sınıflar ve Gruplar",
            icon: Users,
            href: "/gruplar",
            phase: "04",
          },
          { id: "takvim", label: "Ders Takvimi", icon: Calendar, href: "/takvim", phase: "04" },
          {
            id: "odevler",
            label: "Ödevler",
            icon: ClipboardList,
            href: "/odevler",
            count: 14,
            phase: "04",
          },
          {
            id: "denemeler",
            label: "Deneme Sınavları",
            icon: FileText,
            href: "/denemeler",
            phase: "08",
          },
          { id: "analiz", label: "Analizler", icon: ChartLine, href: "/analizler", phase: "04" },
          {
            id: "materyal",
            label: "Materyaller",
            icon: BookOpen,
            href: "/materyaller",
            phase: "06",
          },
        ],
      },
      {
        id: "management",
        label: "YÖNETİM",
        items: [
          { id: "kurum", label: "Kurum Yönetimi", icon: Building2, href: "/kurum", phase: "05" },
          { id: "uyeler", label: "Üyeler", icon: ShieldCheck, href: "/uyeler", phase: "03" },
          { id: "abonelik", label: "Abonelik", icon: CreditCard, href: "/abonelik", phase: "04" },
          { id: "ayarlar", label: "Ayarlar", icon: Settings, href: "/ayarlar", phase: "05" },
        ],
      },
    ],
    favorites: {
      label: "FAVORİLER",
      canAdd: true,
      items: [
        { id: "12a-mat", label: "12/A Matematik", initial: "M", tone: "blue" },
        { id: "tyt", label: "TYT Hazırlık", initial: "T", tone: "green" },
        { id: "lgs8", label: "LGS 8. Sınıf", initial: "L", tone: "purple" },
      ],
    },
  },
  teacher: {
    role: "teacher",
    sections: [
      {
        id: "main",
        items: [
          { id: "genel", label: "Genel Bakış", icon: LayoutGrid, href: "", phase: "04" },
          {
            id: "derslerim",
            label: "Derslerim",
            icon: Presentation,
            href: "/derslerim",
            phase: "06",
          },
          {
            id: "ogrenciler",
            label: "Öğrencilerim",
            icon: GraduationCap,
            href: "/ogrenciler",
            count: 86,
            phase: "04",
          },
          { id: "gruplar", label: "Gruplarım", icon: Users, href: "/gruplar", phase: "04" },
          { id: "takvim", label: "Takvim", icon: Calendar, href: "/takvim", phase: "04" },
          {
            id: "odevler",
            label: "Ödevler",
            icon: ClipboardList,
            href: "/odevler",
            count: 9,
            phase: "04",
          },
          {
            id: "materyal",
            label: "Materyaller",
            icon: BookOpen,
            href: "/materyaller",
            phase: "06",
          },
          {
            id: "denemeler",
            label: "Deneme Sonuçları",
            icon: FileText,
            href: "/denemeler",
            phase: "08",
          },
          {
            id: "gelisim",
            label: "Öğrenci Gelişimi",
            icon: TrendingUp,
            href: "/gelisim",
            phase: "08",
          },
        ],
      },
      {
        id: "settings",
        items: [{ id: "ayarlar", label: "Ayarlar", icon: Settings, href: "/ayarlar", phase: "03" }],
      },
    ],
    favorites: {
      label: "GRUPLARIM",
      canAdd: false,
      items: [
        { id: "12a-mat", label: "12/A Matematik", initial: "M", tone: "blue", meta: "26" },
        { id: "tyt", label: "TYT Hazırlık", initial: "T", tone: "green", meta: "22" },
        { id: "ayt-mat", label: "AYT Matematik", initial: "A", tone: "amber", meta: "18" },
        { id: "11a-say", label: "11/A Sayısal", initial: "S", tone: "purple", meta: "20" },
      ],
    },
  },
  student: {
    role: "student",
    sections: [
      {
        id: "main",
        items: [
          { id: "genel", label: "Ana Sayfa", icon: House, href: "", phase: "04" },
          { id: "program", label: "Ders Programım", icon: Calendar, href: "/program", phase: "04" },
          {
            id: "odevler",
            label: "Ödevlerim",
            icon: ClipboardList,
            href: "/odevler",
            count: 3,
            phase: "04",
          },
          {
            id: "materyal",
            label: "Materyallerim",
            icon: BookOpen,
            href: "/materyaller",
            phase: "07",
          },
          {
            id: "denemeler",
            label: "Deneme Sonuçlarım",
            icon: FileText,
            href: "/denemeler",
            phase: "08",
          },
          { id: "gelisim", label: "Gelişimim", icon: TrendingUp, href: "/gelisim", phase: "07" },
          { id: "hedef", label: "Hedeflerim", icon: Target, href: "/hedefler", phase: "07" },
          {
            id: "bildirim",
            label: "Bildirimler",
            icon: Bell,
            href: "/bildirimler",
            count: 2,
            phase: "07",
          },
        ],
      },
      {
        id: "settings",
        items: [{ id: "ayarlar", label: "Ayarlar", icon: Settings, href: "/ayarlar", phase: "03" }],
      },
    ],
    favorites: {
      label: "DERSLERİM",
      canAdd: false,
      items: [
        { id: "mat", label: "Matematik", initial: "M", tone: "blue" },
        { id: "fiz", label: "Fizik", initial: "F", tone: "green" },
        { id: "kim", label: "Kimya", initial: "K", tone: "purple" },
        { id: "tde", label: "Türk Dili ve Edebiyatı", initial: "T", tone: "amber" },
      ],
    },
  },
  parent: {
    role: "parent",
    sections: [
      {
        id: "main",
        items: [
          { id: "genel", label: "Genel Bakış", icon: LayoutGrid, href: "", phase: "04" },
          { id: "cocuklar", label: "Çocuklarım", icon: Users, href: "/cocuklarim", phase: "07" },
          { id: "takvim", label: "Ders Takvimi", icon: Calendar, href: "/takvim", phase: "04" },
          {
            id: "gelisim",
            label: "Akademik Gelişim",
            icon: TrendingUp,
            href: "/gelisim",
            phase: "07",
          },
          {
            id: "odevler",
            label: "Ödev Takibi",
            icon: ClipboardList,
            href: "/odevler",
            phase: "07",
          },
          {
            id: "denemeler",
            label: "Deneme Sonuçları",
            icon: FileText,
            href: "/denemeler",
            phase: "08",
          },
          {
            id: "bildirim",
            label: "Bildirimler",
            icon: Bell,
            href: "/bildirimler",
            count: 1,
            phase: "07",
          },
        ],
      },
      {
        id: "settings",
        items: [{ id: "ayarlar", label: "Ayarlar", icon: Settings, href: "/ayarlar", phase: "03" }],
      },
    ],
    favorites: {
      label: "ÇOCUKLARIM",
      canAdd: false,
      items: [
        { id: "ali", label: "Ali Çelik", initial: "A", tone: "blue", meta: "12. Sınıf" },
        { id: "elif", label: "Elif Çelik", initial: "E", tone: "green", meta: "8. Sınıf" },
      ],
    },
  },
};

export function getRoleNavigation(role: WorkspaceRole): RoleNavigation {
  return roleNavigation[role];
}

function normalizePath(path: string) {
  const withoutQuery = path.split(/[?#]/)[0] ?? "";
  const trimmed = withoutQuery.replace(/\/+$/, "");
  return trimmed === "" ? "/" : trimmed;
}

/**
 * The nav item for `pathname`, matched by whole path segments:
 * - the workspace root (`href: ""`) matches only the root itself, so unknown
 *   paths never highlight the dashboard;
 * - other items match their own path and anything nested under it
 *   (`/ogrenciler/123` → Öğrenciler), never a similar prefix
 *   (`/ogrenciler-arsiv` does not match `/ogrenciler`);
 * - when several items match, the longest (most specific) href wins.
 * Returns `null` when nothing matches.
 */
export function matchNavItem<T extends Pick<NavItem, "href">>(
  items: readonly T[],
  basePath: string,
  pathname: string | null | undefined,
): T | null {
  if (!pathname) return null;
  const path = normalizePath(pathname);
  const base = normalizePath(basePath);
  let best: T | null = null;
  let bestLength = -1;
  for (const item of items) {
    const target = normalizePath(`${base === "/" ? "" : base}${item.href}`);
    const isRoot = item.href === "";
    const matches = isRoot ? path === target : path === target || path.startsWith(`${target}/`);
    if (matches && target.length > bestLength) {
      best = item;
      bestLength = target.length;
    }
  }
  return best;
}

export function findNavItem(role: WorkspaceRole, id: NavItemId): NavItem | undefined {
  return roleNavigation[role].sections.flatMap((s) => s.items).find((item) => item.id === id);
}
