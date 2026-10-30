import type { WorkspaceContext } from "../types";

/** DEMONSTRATION DATA — fictional institution used only by /preview routes. */
export const previewAdminWorkspace: WorkspaceContext = {
  role: "admin",
  organization: {
    id: "demo-ornek-akademi",
    name: "Örnek Akademi",
    subtitle: "Kurum Çalışma Alanı",
  },
  user: { name: "Ayşe Yılmaz", initials: "AY", roleLabel: "Kurum Yöneticisi" },
  isDemo: true,
};
