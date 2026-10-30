/**
 * Customer-facing workspace roles plus the internal operator role.
 *
 * A role here only selects which UI configuration is rendered. It is NOT a
 * security boundary: authorization must be enforced on the server against the
 * user's organization membership (Phase 01+).
 */
export const WORKSPACE_ROLES = ["admin", "teacher", "student", "parent"] as const;
export type WorkspaceRole = (typeof WORKSPACE_ROLES)[number];

export type PlatformRole = "super_admin";
export type AppRole = WorkspaceRole | PlatformRole;
