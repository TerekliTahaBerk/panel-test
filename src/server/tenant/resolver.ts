import "server-only";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { bootstrapTransaction } from "../db/transaction";
import { DatabaseFailure } from "../db/errors";
import { principalEvidence, type VerifiedPrincipal } from "./principal";
import { issueContext } from "./context";
export const organizationSelect = {
  id: true,
  slug: true,
  name: true,
  type: true,
  status: true,
  ownerMembershipId: true,
} as const;
export async function listOrganizationsForPrincipal(principal: VerifiedPrincipal) {
  const evidence = principalEvidence(principal);
  return bootstrapTransaction(evidence, (tx) =>
    tx.organization.findMany({
      where: {
        status: "ACTIVE",
        memberships: { some: { userId: evidence.userId, status: "ACTIVE" } },
      },
      select: { id: true, name: true, slug: true },
      orderBy: { slug: "asc" },
    }),
  );
}
export async function resolveWorkspace(
  principal: VerifiedPrincipal,
  orgSlug: string,
  requestId = randomUUID(),
) {
  const evidence = principalEvidence(principal);
  if (
    !z.string().uuid().safeParse(requestId).success ||
    !/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(orgSlug)
  )
    throw new DatabaseFailure("UNAVAILABLE");
  return bootstrapTransaction(evidence, async (tx) => {
    const organization = await tx.organization.findFirst({
      where: {
        slug: orgSlug,
        status: "ACTIVE",
        memberships: { some: { userId: evidence.userId, status: "ACTIVE" } },
      },
      select: organizationSelect,
    });
    if (!organization) throw new DatabaseFailure("UNAVAILABLE");
    await tx.$executeRaw`SELECT set_config('app.organization_id',${organization.id},true)`;
    const membership = await tx.organizationMembership.findFirst({
      where: { organizationId: organization.id, userId: evidence.userId, status: "ACTIVE" },
      select: {
        id: true,
        version: true,
        accessScope: true,
        roles: { select: { role: true } },
        branches: { where: { branch: { status: "ACTIVE" } }, select: { branchId: true } },
      },
    });
    if (!membership) throw new DatabaseFailure("UNAVAILABLE");
    return issueContext({
      organizationId: organization.id,
      actorUserId: evidence.userId,
      membershipId: membership.id,
      roles: membership.roles.map((r) => r.role),
      branchScope: {
        kind: membership.accessScope,
        branchIds: membership.branches.map((b) => b.branchId),
      },
      assurance: evidence.assurance,
      policyVersion: membership.version,
      requestId,
      principal: evidence,
    });
  });
}
