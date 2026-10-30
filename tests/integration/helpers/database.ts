import { Pool, type PoolClient } from "pg";
import { randomUUID } from "node:crypto";
import { testDestination, roleUrl } from "../../../scripts/database/safety";
import type { ProvisioningResult } from "@/server/modules/provisioning/contracts";
const url = testDestination(process.env.TEST_DATABASE_URL);
export const admin = new Pool({ connectionString: url.toString(), max: 3 });
export const runtime = new Pool({ connectionString: roleUrl(url, "panel_runtime"), max: 1 });
export const caller = new Pool({ connectionString: roleUrl(url, "panel_provisioner"), max: 3 });
process.env.DATABASE_URL = roleUrl(url, "panel_runtime");
export async function newUser() {
  const id = randomUUID();
  await admin.query(
    'INSERT INTO public."User"(id,"emailNormalized","displayName","updatedAt") VALUES($1,$2,$3,now())',
    [id, `${id}@example.invalid`, "Sentetik Kullanıcı"],
  );
  return id;
}
export async function provision(
  actor: string,
  slug = `org-${randomUUID()}`,
  key = randomUUID(),
  options: {
    name?: string;
    authVersion?: number;
    step?: Date;
    expires?: Date;
    after?: (c: PoolClient) => Promise<void>;
  } = {},
) {
  for (let attempt = 0; ; attempt++) {
    const c = await caller.connect();
    try {
      await c.query("BEGIN ISOLATION LEVEL SERIALIZABLE");
      await c.query("SET LOCAL statement_timeout='5s'");
      const result = await c.query<ProvisioningResult>(
        "SELECT * FROM security.create_organization($1,$2,$3,$4,$5,$6,$7,$8,$9)",
        [
          actor,
          options.authVersion ?? 1,
          options.step ?? new Date(Date.now() - 1000),
          options.expires ?? new Date(Date.now() + 600000),
          options.name ?? "Sentetik Kurum",
          slug,
          "INDIVIDUAL",
          key,
          randomUUID(),
        ],
      );
      await options.after?.(c);
      await c.query("COMMIT");
      return result.rows[0]!;
    } catch (error) {
      await c.query("ROLLBACK");
      if (["40001", "40P01"].includes((error as { code: string }).code) && attempt < 2) {
        await new Promise((resolve) => setTimeout(resolve, 10 + Math.random() * 30));
        continue;
      }
      throw error;
    } finally {
      c.release();
    }
  }
}
export async function tenantQuery<T>(
  organizationId: string | null,
  fn: (c: PoolClient) => Promise<T>,
) {
  const c = await runtime.connect();
  try {
    await c.query("BEGIN");
    if (organizationId)
      await c.query("SELECT set_config('app.organization_id',$1,true)", [organizationId]);
    const result = await fn(c);
    await c.query("COMMIT");
    return result;
  } catch (error) {
    await c.query("ROLLBACK");
    throw error;
  } finally {
    c.release();
  }
}
export async function member(
  organizationId: string,
  userId: string,
  status = "ACTIVE",
  scope = "ORGANIZATION",
) {
  const id = randomUUID();
  await admin.query(
    'INSERT INTO public."OrganizationMembership"(id,"organizationId","userId",status,"accessScope","updatedAt") VALUES($1,$2,$3,$4,$5,now())',
    [id, organizationId, userId, status, scope],
  );
  return id;
}
