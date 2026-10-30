import { z } from "zod";
export const organizationInput = z
  .object({
    name: z.string().trim().min(1).max(160),
    slug: z.string().regex(/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/),
    type: z.enum(["INDIVIDUAL", "CENTER", "SCHOOL"]),
    idempotencyKey: z.uuidv4(),
  })
  .strict();
export type OrganizationInput = z.input<typeof organizationInput>;
export interface ProvisioningResult {
  organizationId: string;
  ownerMembershipId: string;
  slug: string;
  replayed: boolean;
}
