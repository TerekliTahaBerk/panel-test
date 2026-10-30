import type { PrincipalEvidence, VerifiedPrincipal } from "@/server/tenant/principal";
const principals = new WeakMap<VerifiedPrincipal, PrincipalEvidence>();
export function testPrincipal(userId: string, overrides: Partial<PrincipalEvidence> = {}) {
  if (process.env.NODE_ENV !== "test")
    throw new Error("Sentetik kimlik yalnız test runner içinde üretilebilir");
  const principal = Object.freeze({}) as VerifiedPrincipal;
  principals.set(principal, {
    userId,
    authVersion: 1,
    emailVerified: true,
    assurance: "AAL2",
    stepUpAt: Date.now() - 1000,
    expiresAt: Date.now() + 600000,
    ...overrides,
  });
  return principal;
}
export function testEvidence(principal: VerifiedPrincipal) {
  const evidence = principals.get(principal);
  if (!evidence || evidence.expiresAt <= Date.now()) throw new Error("Doğrulanmamış test kimliği");
  return evidence;
}
