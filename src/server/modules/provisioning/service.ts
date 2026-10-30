import "server-only";
import { DatabaseFailure } from "../../db/errors";
import type { VerifiedPrincipal } from "../../tenant/principal";
import { principalEvidence } from "../../tenant/principal";
import type { OrganizationInput, ProvisioningResult } from "./contracts";
/** Faz 03 principal/MFA ve Faz 05 origin/rate limit/kota bağlanmadan dış çağrı açılmaz. */
export async function createOrganizationWithOwner(
  principal: VerifiedPrincipal,
  _input: OrganizationInput,
  _requestId: string,
): Promise<ProvisioningResult> {
  principalEvidence(principal);
  void _input;
  void _requestId;
  throw new DatabaseFailure("UNAVAILABLE");
}
