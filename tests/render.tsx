import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminDashboard } from "@/features/dashboard/components/admin-dashboard";
import { AdminPreviewShell } from "@/features/dashboard/components/admin-preview-shell";
import {
  adminDashboardMock,
  previewNotificationsMock,
} from "@/features/dashboard/data/admin-dashboard.mock";
import { previewAdminWorkspace } from "@/features/workspace/data/preview-workspace.mock";

export function renderAdminPreview() {
  const user = userEvent.setup();
  const utils = render(
    <AdminPreviewShell
      workspace={previewAdminWorkspace}
      basePath="/preview/admin"
      quickActions={adminDashboardMock.quickActions}
    >
      <AdminDashboard data={adminDashboardMock} notifications={previewNotificationsMock} />
    </AdminPreviewShell>,
  );
  return { user, ...utils };
}
