import { describe, expect, it } from "vitest";
import { isPreviewEnabled } from "@/config/app";
import { roleNavigation } from "@/config/navigation";
import { resolveActiveNavId } from "@/components/layout/shell-context";
import { sliceSeries } from "@/features/dashboard/components/student-progress";
import { filterLessons } from "@/features/dashboard/components/today-schedule";
import { adminDashboardMock } from "@/features/dashboard/data/admin-dashboard.mock";
import { scheduledLessonSchema } from "@/features/dashboard/types";
import { previewAdminWorkspace } from "@/features/workspace/data/preview-workspace.mock";
import { formatPercent, formatSignedDelta } from "@/lib/format";
import { WORKSPACE_ROLES } from "@/types/roles";

const env = (vars: Record<string, string>) => vars as unknown as NodeJS.ProcessEnv;

describe("preview gating", () => {
  it("is on in development and off in production by default", () => {
    expect(isPreviewEnabled(env({ NODE_ENV: "development" }))).toBe(true);
    expect(isPreviewEnabled(env({ NODE_ENV: "production" }))).toBe(false);
    expect(isPreviewEnabled(env({ NODE_ENV: "production", ENABLE_PREVIEW_ROUTES: "true" }))).toBe(
      true,
    );
  });
});

describe("role navigation config", () => {
  it.each(WORKSPACE_ROLES)("%s has unique item ids and labels", (role) => {
    const items = roleNavigation[role].sections.flatMap((s) => s.items);
    expect(items.length).toBeGreaterThan(0);
    expect(new Set(items.map((i) => i.id)).size).toBe(items.length);
    for (const item of items) expect(item.implemented || item.phase).toBeTruthy();
  });

  it("never gives non-admin roles management routes", () => {
    for (const role of ["teacher", "student", "parent"] as const) {
      const ids = roleNavigation[role].sections.flatMap((s) => s.items.map((i) => i.id));
      expect(ids).not.toContain("uyeler");
      expect(ids).not.toContain("abonelik");
    }
  });

  it("resolves the active item from the path", () => {
    expect(resolveActiveNavId(previewAdminWorkspace, "/preview/admin", "/preview/admin")).toBe(
      "genel",
    );
    expect(resolveActiveNavId(previewAdminWorkspace, "/preview/admin", "/preview/admin/")).toBe(
      "genel",
    );
  });
});

describe("dashboard data", () => {
  it("mock lessons satisfy the API contract", () => {
    for (const lesson of adminDashboardMock.schedule.lessons) {
      expect(scheduledLessonSchema.safeParse(lesson).success).toBe(true);
    }
  });

  it("groups attendance-pending lessons under completed", () => {
    const done = filterLessons(adminDashboardMock.schedule.lessons, "done");
    expect(done.map((l) => l.status)).toEqual(["done", "attendance_pending", "attendance_pending"]);
  });

  it("slices the progress series to the selected window", () => {
    const s = sliceSeries(adminDashboardMock.progress.series, 4);
    expect(s.weeks).toEqual(["13 Eki", "20 Eki", "27 Eki", "Bu hafta"]);
    expect(s.achievement).toHaveLength(4);
  });

  it("formats numbers the Turkish way", () => {
    expect(formatPercent(72.4)).toBe("%72,4");
    expect(formatSignedDelta(6.2)).toBe("+6,2");
    expect(formatSignedDelta(-1.4)).toBe("−1,4");
  });
});
