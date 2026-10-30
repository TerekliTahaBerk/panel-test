import "server-only";
import type { OrganizationRole } from "../generated/prisma/enums";
import type { PrincipalEvidence } from "./principal";
import { DatabaseFailure } from "../db/errors";
declare const contextBrand: unique symbol;
export interface TenantContext {
  readonly [contextBrand]: true;
}
export interface TenantState {
  readonly organizationId: string;
  readonly actorUserId: string;
  readonly membershipId: string;
  readonly roles: readonly OrganizationRole[];
  readonly branchScope: {
    readonly kind: "ORGANIZATION" | "BRANCHES";
    readonly branchIds: readonly string[];
  };
  readonly assurance: "AAL1" | "AAL2";
  readonly policyVersion: number;
  readonly requestId: string;
  readonly principal: PrincipalEvidence;
}
const contexts = new WeakMap<TenantContext, TenantState>();
/** Yalnız resolver kullanır; public sunucu sözleşmesi değildir. */
export function issueContext(state: TenantState): TenantContext {
  const context = Object.freeze({}) as TenantContext;
  contexts.set(
    context,
    Object.freeze({
      ...state,
      roles: Object.freeze([...state.roles]),
      branchScope: Object.freeze({
        ...state.branchScope,
        branchIds: Object.freeze([...state.branchScope.branchIds]),
      }),
      principal: Object.freeze({ ...state.principal }),
    }),
  );
  return context;
}
export function tenantState(context: TenantContext): TenantState {
  const state = contexts.get(context);
  if (!state || state.principal.expiresAt <= Date.now()) throw new DatabaseFailure("UNAVAILABLE");
  return state;
}
