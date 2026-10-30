import type { WorkspaceRole } from "@/types/roles";

/**
 * What the shell needs to know about the current workspace. In Phase 01 this
 * is resolved on the server from the session and organization membership;
 * in the preview it comes from demonstration data.
 */
export interface WorkspaceContext {
  role: WorkspaceRole;
  organization: { id: string; name: string; subtitle: string };
  user: { name: string; initials: string; roleLabel: string };
  /** True when everything rendered is fictional demonstration data. */
  isDemo: boolean;
}
