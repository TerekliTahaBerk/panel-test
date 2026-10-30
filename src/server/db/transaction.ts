import "server-only";
import { runtimeClient } from "./client";
import type { Prisma } from "../generated/prisma/client";
import { tenantState, type TenantContext } from "../tenant/context";
import { safeDatabaseError, DatabaseFailure } from "./errors";
import type { PrincipalEvidence } from "../tenant/principal";
export type Transaction = Prisma.TransactionClient;
/** İç DAL API; route/feature koduna açılmaz. */
export async function bootstrapTransaction<T>(
  evidence: PrincipalEvidence,
  operation: (tx: Transaction) => Promise<T>,
): Promise<T> {
  if (evidence.expiresAt <= Date.now()) throw new DatabaseFailure("UNAUTHENTICATED");
  try {
    return await runtimeClient().$transaction(
      async (tx) => {
        await tx.$executeRaw`SELECT set_config('app.organization_id','',true),set_config('app.actor_id',${evidence.userId},true)`;
        const user = await tx.user.findFirst({
          where: { id: evidence.userId, status: "ACTIVE", authVersion: evidence.authVersion },
          select: { id: true },
        });
        if (!user) throw new DatabaseFailure("UNAVAILABLE");
        return operation(tx);
      },
      { isolationLevel: "Serializable", maxWait: 3000, timeout: 5000 },
    );
  } catch (error) {
    throw safeDatabaseError(error);
  }
}
export async function withTenantTransaction<T>(
  context: TenantContext,
  operation: (tx: Transaction) => Promise<T>,
): Promise<T> {
  const state = tenantState(context);
  return bootstrapTransaction(state.principal, async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.organization_id',${state.organizationId},true)`;
    // Kilit sırası: kurum → üyelik. İptal/grant güncellemesi bu satırlarla yarışır.
    const orgs = await tx.$queryRaw<
      { id: string }[]
    >`SELECT id FROM public."Organization" WHERE id=${state.organizationId}::uuid AND status='ACTIVE' FOR SHARE`;
    const members = await tx.$queryRaw<
      { id: string }[]
    >`SELECT id FROM public."OrganizationMembership" WHERE "organizationId"=${state.organizationId}::uuid AND id=${state.membershipId}::uuid AND "userId"=${state.actorUserId}::uuid AND status='ACTIVE' AND version=${state.policyVersion} FOR SHARE`;
    if (!orgs.length || !members.length) throw new DatabaseFailure("UNAVAILABLE");
    return operation(tx);
  });
}
