import "server-only";
import { withTenantTransaction } from "../../db/transaction";
import { DatabaseFailure } from "../../db/errors";
import { tenantState, type TenantContext } from "../../tenant/context";
import { organizationSelect } from "../../tenant/resolver";
export { listOrganizationsForPrincipal, resolveWorkspace } from "../../tenant/resolver";
export async function findOrganizationById(context: TenantContext, id: string) {
  const s = tenantState(context);
  if (id !== s.organizationId) throw new DatabaseFailure("UNAVAILABLE");
  return withTenantTransaction(context, (tx) =>
    tx.organization.findFirstOrThrow({
      where: { id: s.organizationId },
      select: organizationSelect,
    }),
  );
}
export async function findOrganizationBySlug(context: TenantContext, slug: string) {
  const s = tenantState(context);
  return withTenantTransaction(context, async (tx) => {
    const org = await tx.organization.findFirst({
      where: { id: s.organizationId, slug },
      select: organizationSelect,
    });
    if (!org) throw new DatabaseFailure("UNAVAILABLE");
    return org;
  });
}
export async function getActiveMembership(context: TenantContext) {
  const s = tenantState(context);
  return withTenantTransaction(context, (tx) =>
    tx.organizationMembership.findFirstOrThrow({
      where: {
        organizationId: s.organizationId,
        id: s.membershipId,
        userId: s.actorUserId,
        status: "ACTIVE",
      },
      select: { id: true, accessScope: true, version: true },
    }),
  );
}
export async function getMembershipRoles(context: TenantContext) {
  const s = tenantState(context);
  return withTenantTransaction(context, (tx) =>
    tx.roleAssignment.findMany({
      where: { organizationId: s.organizationId, membershipId: s.membershipId },
      select: { role: true },
    }),
  );
}
export async function getBranchAccess(context: TenantContext) {
  const s = tenantState(context);
  return withTenantTransaction(context, (tx) =>
    tx.branch.findMany({
      where: {
        organizationId: s.organizationId,
        status: "ACTIVE",
        ...(s.branchScope.kind === "BRANCHES" ? { id: { in: [...s.branchScope.branchIds] } } : {}),
      },
      select: { id: true, name: true, code: true },
      orderBy: { code: "asc" },
    }),
  );
}
