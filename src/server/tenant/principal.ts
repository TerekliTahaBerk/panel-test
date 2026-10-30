import "server-only";
import { DatabaseFailure } from "../db/errors";
declare const principalBrand: unique symbol;
export interface VerifiedPrincipal {
  readonly [principalBrand]: true;
}
export interface PrincipalEvidence {
  readonly userId: string;
  readonly authVersion: number;
  readonly emailVerified: boolean;
  readonly assurance: "AAL1" | "AAL2";
  readonly stepUpAt: number;
  readonly expiresAt: number;
}
/** Faz 03 gerçek session adapter'ını bağlayana kadar her giriş reddedilir. */
export function principalEvidence(_principal: VerifiedPrincipal): PrincipalEvidence {
  void _principal;
  throw new DatabaseFailure("UNAUTHENTICATED");
}
export async function requirePrincipal(): Promise<VerifiedPrincipal> {
  throw new DatabaseFailure("UNAUTHENTICATED");
}
