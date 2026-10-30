import "server-only";
import { DatabaseFailure } from "../db/errors";
import { tenantState, type TenantContext } from "./context";
export function assertBranchAccess(context: TenantContext, branchId: string | null) {
  const scope = tenantState(context).branchScope;
  if (scope.kind === "BRANCHES" && (!branchId || !scope.branchIds.includes(branchId)))
    throw new DatabaseFailure("UNAVAILABLE");
}
