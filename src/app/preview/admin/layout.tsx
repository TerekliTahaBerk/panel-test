import type { ReactNode } from "react";
import { routes } from "@/config/app";
import { AdminPreviewShell } from "@/features/dashboard/components/admin-preview-shell";
import { adminDashboardMock } from "@/features/dashboard/data/admin-dashboard.mock";
import { previewAdminWorkspace } from "@/features/workspace/data/preview-workspace.mock";

export default function AdminPreviewLayout({ children }: { children: ReactNode }) {
  return (
    <AdminPreviewShell
      workspace={previewAdminWorkspace}
      basePath={routes.preview.admin}
      quickActions={adminDashboardMock.quickActions}
    >
      {children}
    </AdminPreviewShell>
  );
}
