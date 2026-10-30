import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import {
  admin,
  runtime,
  caller,
  newUser,
  provision,
  tenantQuery,
  member,
} from "./helpers/database";
import { testPrincipal } from "./helpers/principals";
vi.mock("@/server/tenant/principal", async () => {
  const actual = await vi.importActual<typeof import("@/server/tenant/principal")>(
    "@/server/tenant/principal",
  );
  const helpers = await import("./helpers/principals");
  return { ...actual, principalEvidence: helpers.testEvidence };
});
import {
  resolveWorkspace,
  listOrganizationsForPrincipal,
  findOrganizationById,
  findOrganizationBySlug,
  getActiveMembership,
  getMembershipRoles,
  getBranchAccess,
} from "@/server/modules/organizations/repository";
import { tenantState, type TenantContext } from "@/server/tenant/context";
import { assertBranchAccess } from "@/server/tenant/authorization-boundary";
import { withTenantTransaction } from "@/server/db/transaction";
import { runtimeClient } from "@/server/db/client";
import { createOrganizationWithOwner } from "@/server/modules/provisioning/service";
import { connectionString } from "@/server/db/config";
import { safeDatabaseError } from "@/server/db/errors";
import { testDestination } from "../../scripts/database/safety";
const slugA = `fixture-alpha-${randomUUID()}`;
const slugB = `fixture-beta-${randomUUID()}`;
let a: string,
  b: string,
  ownerA: string,
  ownerB: string,
  shared: string,
  onlyA: string,
  limited: string,
  revoked: string,
  suspended: string;
let sharedA: string,
  sharedB: string,
  limitedId: string,
  branchA: string,
  branchA2: string,
  branchB: string;
beforeAll(async () => {
  ownerA = await newUser();
  ownerB = await newUser();
  shared = await newUser();
  onlyA = await newUser();
  limited = await newUser();
  revoked = await newUser();
  suspended = await newUser();
  a = (await provision(ownerA, slugA)).organizationId;
  b = (await provision(ownerB, slugB)).organizationId;
  sharedA = await member(a, shared);
  sharedB = await member(b, shared);
  await member(a, onlyA);
  limitedId = await member(a, limited, "ACTIVE", "BRANCHES");
  await member(a, revoked, "REVOKED");
  await member(a, suspended, "SUSPENDED");
  await admin.query(
    'INSERT INTO public."RoleAssignment"("organizationId","membershipId",role) VALUES($1,$2,\'ADMIN\'),($3,$4,\'TEACHER\')',
    [a, sharedA, b, sharedB],
  );
  branchA = randomUUID();
  branchA2 = randomUUID();
  branchB = randomUUID();
  await admin.query(
    "INSERT INTO public.\"Branch\"(id,\"organizationId\",code,name,\"updatedAt\") VALUES($1,$2,'ONE','Şube A',now()),($3,$2,'TWO','Şube A2',now()),($4,$5,'ONE','Şube B',now())",
    [branchA, a, branchA2, branchB, b],
  );
  await admin.query(
    'INSERT INTO public."BranchMembership"("organizationId","membershipId","branchId") VALUES($1,$2,$3)',
    [a, limitedId, branchA],
  );
});
afterAll(async () => {
  await runtimeClient().$disconnect();
  await Promise.all([admin.end(), runtime.end(), caller.end()]);
});

describe("Gerçek PostgreSQL: catalog ve roller", () => {
  it("yedi model, doğal PK, bileşik FK, CHECK, deferred trigger ve zorunlu RLS", async () => {
    const tables = await admin.query(
      "SELECT relname,relrowsecurity,relforcerowsecurity,pg_get_userbyid(relowner) owner FROM pg_class WHERE relnamespace='public'::regnamespace AND relkind='r' AND relname<>'_prisma_migrations'",
    );
    expect(tables.rows).toHaveLength(7);
    for (const row of tables.rows) {
      expect(row.relrowsecurity).toBe(true);
      expect(row.relforcerowsecurity).toBe(true);
      expect(row.owner).toBe("panel_migrator");
    }
    const constraints = await admin.query(
      "SELECT conname,contype,pg_get_constraintdef(oid) definition FROM pg_constraint WHERE connamespace='public'::regnamespace",
    );
    expect(constraints.rows.filter((r) => r.contype === "c")).toHaveLength(5);
    expect(
      constraints.rows.filter(
        (r) => r.contype === "f" && r.definition.includes('FOREIGN KEY ("organizationId",'),
      ),
    ).toHaveLength(4);
    expect(
      constraints.rows.find((r) => r.conname === "Organization_id_ownerMembershipId_fkey")
        ?.definition,
    ).toContain('FOREIGN KEY (id, "ownerMembershipId")');
    expect(constraints.rows.find((r) => r.conname === "RoleAssignment_pkey")?.definition).toContain(
      'PRIMARY KEY ("organizationId", "membershipId", role)',
    );
    expect(
      constraints.rows.find((r) => r.conname === "BranchMembership_pkey")?.definition,
    ).toContain('PRIMARY KEY ("organizationId", "membershipId", "branchId")');
    const triggers = await admin.query(
      "SELECT tgname,tgdeferrable,tginitdeferred FROM pg_trigger WHERE tgname IN ('organization_owner_valid','membership_owner_valid')",
    );
    expect(triggers.rows).toHaveLength(2);
    expect(triggers.rows.every((t) => t.tgdeferrable && t.tginitdeferred)).toBe(true);
    const indexes = await admin.query(
      "SELECT indexname FROM pg_indexes WHERE tablename IN ('RoleAssignment','BranchMembership')",
    );
    expect(indexes.rows).toHaveLength(4);
  });
  it("runtime ve caller superuser/owner/BYPASSRLS değildir; function-owner NOLOGIN", async () => {
    const { rows } = await admin.query(
      "SELECT rolname,rolsuper,rolbypassrls,rolcreaterole,rolcreatedb,rolcanlogin FROM pg_roles WHERE rolname IN ('panel_runtime','panel_provisioner','panel_provision_owner')",
    );
    for (const r of rows) {
      expect(r.rolsuper || r.rolbypassrls || r.rolcreatedb || r.rolcreaterole).toBe(false);
      if (r.rolname === "panel_provision_owner") expect(r.rolcanlogin).toBe(false);
    }
    const f = await admin.query(
      "SELECT prosecdef,proconfig,pg_get_userbyid(proowner) owner FROM pg_proc WHERE proname='create_organization'",
    );
    expect(f.rows[0]).toMatchObject({
      prosecdef: true,
      owner: "panel_provision_owner",
      proconfig: ["search_path=pg_catalog"],
    });
    const policies = await admin.query("SELECT roles FROM pg_policies WHERE schemaname='public'");
    expect(policies.rows.every((r) => !r.roles.includes("public"))).toBe(true);
  });
  for (const role of ["panel_migrator", "panel_provisioner", "panel_provision_owner"])
    it(`runtime SET ROLE ${role} reddedilir`, async () => {
      await expect(runtime.query(`SET ROLE ${role}`)).rejects.toMatchObject({ code: "42501" });
    });
  for (const sql of [
    "CREATE TABLE public.forbidden(id int)",
    "CREATE TEMP TABLE forbidden(id int)",
    'ALTER TABLE public."Branch" DISABLE ROW LEVEL SECURITY',
    'TRUNCATE public."Branch"',
  ])
    it(`runtime DDL/TRUNCATE reddi: ${sql}`, async () => {
      await expect(runtime.query(sql)).rejects.toMatchObject({ code: "42501" });
    });
  it("runtime provisioning fonksiyonunu çağıramaz ve makbuzları okuyamaz", async () => {
    await expect(
      runtime.query(
        "SELECT * FROM security.create_organization(NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL)",
      ),
    ).rejects.toMatchObject({ code: "42501" });
    await expect(
      runtime.query('SELECT "provisioningKeyHash" FROM public."Organization"'),
    ).rejects.toMatchObject({ code: "42501" });
  });
  for (const verb of ["SELECT * FROM", "DELETE FROM"])
    it(`caller tablo erişimi reddedilir: ${verb}`, async () => {
      await expect(caller.query(`${verb} public."OrganizationMembership"`)).rejects.toMatchObject({
        code: "42501",
      });
    });
  it("PUBLIC EXECUTE yok; caller DML/rol/DDL alamaz", async () => {
    const result = await admin.query(
      "SELECT has_function_privilege('public','security.create_organization(uuid,integer,timestamptz,timestamptz,text,text,text,uuid,uuid)','EXECUTE') allowed",
    );
    expect(result.rows[0].allowed).toBe(false);
    await expect(caller.query("SET ROLE panel_provision_owner")).rejects.toMatchObject({
      code: "42501",
    });
    await expect(caller.query('INSERT INTO public."Branch" DEFAULT VALUES')).rejects.toMatchObject({
      code: "42501",
    });
  });
  it("migration geçmişi üç başarılı kayıt taşır; canonical SQL dosyaları mevcut", async () => {
    const result = await admin.query(
      'SELECT migration_name FROM "_prisma_migrations" WHERE finished_at IS NOT NULL',
    );
    expect(result.rows).toHaveLength(3);
    for (const row of result.rows)
      expect(
        readFileSync(`prisma/migrations/${row.migration_name}/migration.sql`, "utf8").length,
      ).toBeGreaterThan(500);
  });
});

describe("Tenant izolasyonu, ilişkiler ve havuz", () => {
  it("A context B üyelerini/count/aggregate göremez", async () => {
    await tenantQuery(a, async (c) => {
      expect(
        (
          await c.query('SELECT * FROM public."OrganizationMembership" WHERE "organizationId"=$1', [
            b,
          ])
        ).rows,
      ).toHaveLength(0);
      expect(
        (
          await c.query(
            'SELECT count(*)::int n FROM public."OrganizationMembership" WHERE "organizationId"=$1',
            [b],
          )
        ).rows[0].n,
      ).toBe(0);
      const total = await c.query(
        'SELECT count(DISTINCT "organizationId")::int n FROM public."OrganizationMembership"',
      );
      expect(total.rows[0].n).toBe(1);
    });
  });
  it("A B satırlarını update/delete edemez", async () => {
    await tenantQuery(a, async (c) => {
      expect(
        (await c.query("UPDATE public.\"Branch\" SET name='Yabancı' WHERE id=$1", [branchB]))
          .rowCount,
      ).toBe(0);
      expect((await c.query('DELETE FROM public."Branch" WHERE id=$1', [branchB])).rowCount).toBe(
        0,
      );
    });
  });
  for (const table of [
    "OrganizationMembership",
    "RoleAssignment",
    "Branch",
    "BranchMembership",
    "AuditLog",
  ])
    it(`bağlamsız ${table} sıfır satır`, async () => {
      expect((await runtime.query(`SELECT * FROM public."${table}"`)).rows).toHaveLength(0);
    });
  it("eksik/geçersiz tenant ayarı insert reddeder", async () => {
    await expect(
      tenantQuery(null, (c) =>
        c.query(
          'INSERT INTO public."Branch"(id,"organizationId",code,name,"updatedAt") VALUES($1,$2,\'X\',\'X\',now())',
          [randomUUID(), a],
        ),
      ),
    ).rejects.toMatchObject({ code: "42501" });
    await tenantQuery("invalid-uuid", async (c) => {
      expect((await c.query('SELECT * FROM public."Branch"')).rows).toHaveLength(0);
    });
  });
  it("A → B → bağlamsız aynı havuzda context sızıntısı yok", async () => {
    const pidA = await tenantQuery(a, async (c) => {
      expect((await c.query('SELECT id FROM public."Branch"')).rows).toHaveLength(2);
      return (await c.query("SELECT pg_backend_pid() pid")).rows[0].pid;
    });
    const pidB = await tenantQuery(b, async (c) => {
      expect((await c.query('SELECT id FROM public."Branch"')).rows).toHaveLength(1);
      return (await c.query("SELECT pg_backend_pid() pid")).rows[0].pid;
    });
    expect(pidA).toBe(pidB);
    expect((await runtime.query('SELECT id FROM public."Branch"')).rows).toHaveLength(0);
  });
  it("rollback context'i temizler ve bağlantı tekrar kullanılabilir", async () => {
    await expect(
      tenantQuery(a, async (c) => {
        await c.query("SELECT 1/0");
      }),
    ).rejects.toMatchObject({ code: "22012" });
    expect((await runtime.query('SELECT id FROM public."Branch"')).rows).toHaveLength(0);
    expect((await runtime.query("SELECT 1 n")).rows[0].n).toBe(1);
  });
  it("cross-tenant direct ve bulk FK reddi", async () => {
    await expect(
      tenantQuery(a, (c) =>
        c.query(
          'INSERT INTO public."BranchMembership"("organizationId","membershipId","branchId") VALUES($1,$2,$3)',
          [a, sharedA, branchB],
        ),
      ),
    ).rejects.toMatchObject({ code: "23503" });
    await expect(
      tenantQuery(a, (c) =>
        c.query(
          'INSERT INTO public."RoleAssignment"("organizationId","membershipId",role) VALUES($1,$2,\'PARENT\'),($1,$3,\'STUDENT\')',
          [a, sharedA, sharedB],
        ),
      ),
    ).rejects.toMatchObject({ code: "23503" });
  });
  it("Prisma nested create ve compound-key connect tenant dışına çıkamaz", async () => {
    const ctx = await resolveWorkspace(testPrincipal(shared), slugA);
    await expect(
      withTenantTransaction(ctx, (tx) =>
        tx.branch.create({
          data: {
            organizationId: a,
            code: "NESTED",
            name: "Nested",
            memberships: { create: { membershipId: sharedB } },
          },
        }),
      ),
    ).rejects.toBeDefined();
    await expect(
      withTenantTransaction(ctx, (tx) =>
        tx.branchMembership.create({
          data: {
            organization: { connect: { id: a } },
            membership: { connect: { organizationId_id: { organizationId: a, id: sharedB } } },
            branch: { connect: { organizationId_id: { organizationId: a, id: branchA } } },
          },
        }),
      ),
    ).rejects.toBeDefined();
  });
  it("grant doğal PK duplicate reddi ve değişmezliği", async () => {
    await expect(
      tenantQuery(a, (c) =>
        c.query(
          'INSERT INTO public."RoleAssignment"("organizationId","membershipId",role) VALUES($1,$2,\'ADMIN\')',
          [a, sharedA],
        ),
      ),
    ).rejects.toMatchObject({ code: "23505" });
    await expect(
      admin.query(
        'UPDATE public."RoleAssignment" SET role=\'PARENT\' WHERE "organizationId"=$1 AND "membershipId"=$2',
        [a, sharedA],
      ),
    ).rejects.toMatchObject({ code: "23514" });
    await expect(
      admin.query('UPDATE public."BranchMembership" SET "branchId"=$1 WHERE "organizationId"=$2', [
        branchA2,
        a,
      ]),
    ).rejects.toMatchObject({ code: "23514" });
  });
  it("organizationId ve provisioning makbuzları değiştirilemez", async () => {
    await expect(
      admin.query('UPDATE public."Branch" SET "organizationId"=$1 WHERE id=$2', [b, branchA]),
    ).rejects.toMatchObject({ code: "23514" });
    await expect(
      admin.query(
        'UPDATE public."Organization" SET "provisioningKeyHash"=repeat(\'b\',64) WHERE id=$1',
        [a],
      ),
    ).rejects.toMatchObject({ code: "23514" });
  });
  it("audit actor üye/user eşleşmesi bileşik FK ile korunur; append-only runtime", async () => {
    await expect(
      tenantQuery(a, (c) =>
        c.query(
          'INSERT INTO public."AuditLog"(id,"organizationId","actorUserId","actorMembershipId","actorType","entityType","entityId",action,"requestId") VALUES($1,$2,$3,$4,\'USER\',\'Organization\',$2,\'test\',$5)',
          [randomUUID(), a, ownerA, sharedA, randomUUID()],
        ),
      ),
    ).rejects.toMatchObject({ code: "23503" });
    await expect(
      runtime.query("UPDATE public.\"AuditLog\" SET action='changed'"),
    ).rejects.toMatchObject({ code: "42501" });
    await expect(runtime.query('DELETE FROM public."AuditLog"')).rejects.toMatchObject({
      code: "42501",
    });
  });
});

describe("Üyelik, resolver ve sahiplik", () => {
  it("kurum değiştirirken ADMIN rolü TEACHER kurumuna taşınmaz", async () => {
    const p = testPrincipal(shared);
    const ca = await resolveWorkspace(p, slugA);
    const cb = await resolveWorkspace(p, slugB);
    expect(tenantState(ca).roles).toEqual(["ADMIN"]);
    expect(tenantState(cb).roles).toEqual(["TEACHER"]);
    expect(await getMembershipRoles(cb)).toEqual([{ role: "TEACHER" }]);
    expect((await getActiveMembership(ca)).id).toBe(sharedA);
    expect((await listOrganizationsForPrincipal(p)).map((o) => o.slug)).toEqual([slugA, slugB]);
  });
  it("yalnız A kullanıcısı B slug/id veya unknown slug ile veri göremez", async () => {
    const p = testPrincipal(onlyA);
    const ctx = await resolveWorkspace(p, slugA);
    expect(await listOrganizationsForPrincipal(p)).toHaveLength(1);
    await expect(resolveWorkspace(p, slugB)).rejects.toMatchObject({ code: "UNAVAILABLE" });
    await expect(resolveWorkspace(p, "unknown-organization")).rejects.toMatchObject({
      code: "UNAVAILABLE",
    });
    await expect(findOrganizationById(ctx, b)).rejects.toMatchObject({ code: "UNAVAILABLE" });
    await expect(findOrganizationBySlug(ctx, slugB)).rejects.toMatchObject({ code: "UNAVAILABLE" });
  });
  for (const user of [() => revoked, () => suspended])
    it("revoked/suspended üyelik reddedilir", async () => {
      await expect(resolveWorkspace(testPrincipal(user()), slugA)).rejects.toMatchObject({
        code: "UNAVAILABLE",
      });
    });
  it("şube kısıtı yalnız atanan aktif şubeyi döndürür; şubesiz ve diğer şube reddi", async () => {
    const ctx = await resolveWorkspace(testPrincipal(limited), slugA);
    expect((await getBranchAccess(ctx)).map((b) => b.id)).toEqual([branchA]);
    expect(() => assertBranchAccess(ctx, branchA)).not.toThrow();
    expect(() => assertBranchAccess(ctx, branchA2)).toThrow();
    expect(() => assertBranchAccess(ctx, null)).toThrow();
  });
  it("taklit/JSON context güvenlik kanıtı değildir", async () => {
    await expect(getActiveMembership({} as TenantContext)).rejects.toMatchObject({
      code: "UNAVAILABLE",
    });
    const ctx = await resolveWorkspace(testPrincipal(shared), slugA);
    await expect(getActiveMembership(JSON.parse(JSON.stringify(ctx)))).rejects.toMatchObject({
      code: "UNAVAILABLE",
    });
  });
  it("stale context üyelik iptali ve grant değişimi sonrasında reddedilir", async () => {
    const id = await newUser();
    const m = await member(a, id);
    const ctx = await resolveWorkspace(testPrincipal(id), slugA);
    await admin.query(
      'INSERT INTO public."RoleAssignment"("organizationId","membershipId",role) VALUES($1,$2,\'TEACHER\')',
      [a, m],
    );
    await expect(getActiveMembership(ctx)).rejects.toMatchObject({ code: "UNAVAILABLE" });
    const next = await resolveWorkspace(testPrincipal(id), slugA);
    await admin.query("UPDATE public.\"OrganizationMembership\" SET status='REVOKED' WHERE id=$1", [
      m,
    ]);
    await expect(getActiveMembership(next)).rejects.toMatchObject({ code: "UNAVAILABLE" });
  });
  it("suspended kurum eski context ve resolver erişimini kapatır", async () => {
    const actor = await newUser();
    const result = await provision(actor);
    const p = testPrincipal(actor);
    const ctx = await resolveWorkspace(p, result.slug);
    await admin.query("UPDATE public.\"Organization\" SET status='SUSPENDED' WHERE id=$1", [
      result.organizationId,
    ]);
    await expect(getActiveMembership(ctx)).rejects.toMatchObject({ code: "UNAVAILABLE" });
    await expect(resolveWorkspace(p, result.slug)).rejects.toMatchObject({ code: "UNAVAILABLE" });
    expect(await listOrganizationsForPrincipal(p)).toHaveLength(0);
  });
  it("ACTIVE kurum sahipsiz ve foreign owner olamaz", async () => {
    await expect(
      admin.query('UPDATE public."Organization" SET "ownerMembershipId"=NULL WHERE id=$1', [a]),
    ).rejects.toMatchObject({ code: "23514" });
    await expect(
      admin.query('UPDATE public."Organization" SET "ownerMembershipId"=$1 WHERE id=$2', [
        sharedB,
        a,
      ]),
    ).rejects.toMatchObject({ code: "23503" });
  });
  it("mevcut owner revoke veya BRANCHES yapılamaz", async () => {
    for (const assignment of ["status='REVOKED'", "\"accessScope\"='BRANCHES'"])
      await expect(
        admin.query(
          `UPDATE public."OrganizationMembership" SET ${assignment} WHERE id=(SELECT "ownerMembershipId" FROM public."Organization" WHERE id=$1)`,
          [a],
        ),
      ).rejects.toMatchObject({ code: "23514" });
  });
  it("eşzamanlı owner devirleri sonunda tek geçerli owner kalır", async () => {
    const u = await newUser();
    const r = await provision(u);
    const m1 = await member(r.organizationId, await newUser());
    const m2 = await member(r.organizationId, await newUser());
    const results = await Promise.allSettled(
      [m1, m2].map(async (id) => {
        const c = await admin.connect();
        try {
          await c.query("BEGIN ISOLATION LEVEL SERIALIZABLE");
          await c.query('SELECT id FROM public."Organization" WHERE id=$1 FOR UPDATE', [
            r.organizationId,
          ]);
          await c.query('UPDATE public."Organization" SET "ownerMembershipId"=$1 WHERE id=$2', [
            id,
            r.organizationId,
          ]);
          await c.query("COMMIT");
        } catch (e) {
          await c.query("ROLLBACK");
          throw e;
        } finally {
          c.release();
        }
      }),
    );
    expect(results.some((r) => r.status === "fulfilled")).toBe(true);
    const row = await admin.query(
      'SELECT "ownerMembershipId" FROM public."Organization" WHERE id=$1',
      [r.organizationId],
    );
    expect([m1, m2]).toContain(row.rows[0].ownerMembershipId);
  });
});

describe("Ek adversarial doğrulamalar", () => {
  it("gerçek principal ile A transaction B'deki kendi üyeliğini dahi okuyamaz", async () => {
    const ctx = await resolveWorkspace(testPrincipal(shared), slugA);
    await withTenantTransaction(ctx, async (tx) => {
      expect(await tx.organizationMembership.count({ where: { organizationId: b } })).toBe(0);
      expect(await tx.organization.count({ where: { id: b } })).toBe(0);
    });
  });
  it("gerçek SERIALIZABLE yazma çakışması tam rollback olur", async () => {
    const first = await admin.connect(),
      second = await admin.connect();
    try {
      for (const c of [first, second]) {
        await c.query("BEGIN ISOLATION LEVEL SERIALIZABLE");
        await c.query('SELECT name FROM public."Branch" WHERE id=$1', [branchA2]);
      }
      await first.query("UPDATE public.\"Branch\" SET name='Birinci' WHERE id=$1", [branchA2]);
      await first.query("COMMIT");
      await expect(
        second.query("UPDATE public.\"Branch\" SET name='İkinci' WHERE id=$1", [branchA2]),
      ).rejects.toMatchObject({ code: "40001" });
      await second.query("ROLLBACK");
      expect(
        (await admin.query('SELECT name FROM public."Branch" WHERE id=$1', [branchA2])).rows[0]
          .name,
      ).toBe("Birinci");
    } finally {
      await first.query("ROLLBACK");
      await second.query("ROLLBACK");
      first.release();
      second.release();
    }
  });
  it("deferred owner/commit hatası kurum ve üyeliği geri alır", async () => {
    const actor = await newUser();
    await admin.query(
      "CREATE FUNCTION security.synthetic_owner_failure() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'synthetic owner failure' USING ERRCODE='23514'; END $$",
    );
    await admin.query(
      `CREATE CONSTRAINT TRIGGER synthetic_owner_failure AFTER INSERT ON public."Organization" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW WHEN (NEW."createdByUserId"='${actor}'::uuid) EXECUTE FUNCTION security.synthetic_owner_failure()`,
    );
    try {
      await expect(provision(actor)).rejects.toMatchObject({ code: "23514" });
      expect(
        (
          await admin.query('SELECT id FROM public."Organization" WHERE "createdByUserId"=$1', [
            actor,
          ])
        ).rows,
      ).toHaveLength(0);
      expect(
        (
          await admin.query('SELECT id FROM public."OrganizationMembership" WHERE "userId"=$1', [
            actor,
          ])
        ).rows,
      ).toHaveLength(0);
    } finally {
      await admin.query('DROP TRIGGER synthetic_owner_failure ON public."Organization"');
      await admin.query("DROP FUNCTION security.synthetic_owner_failure()");
    }
  });
  it("WorkspaceContext projection yalnız yetkili DTO alanlarını taşır", async () => {
    const { getWorkspacePresentation } = await import("@/server/modules/organizations/service");
    const ca = await resolveWorkspace(testPrincipal(shared), slugA),
      cb = await resolveWorkspace(testPrincipal(shared), slugB);
    expect(await getWorkspacePresentation(ca)).toMatchObject({ role: "admin", isDemo: false });
    expect(await getWorkspacePresentation(cb)).toMatchObject({ role: "teacher", isDemo: false });
    expect(JSON.stringify(await getWorkspacePresentation(ca))).not.toContain("provisioningKeyHash");
  });
});

describe("Dar provisioning primitive'i", () => {
  it("atomik DRAFT → owner → ACTIVE ve tek audit; OWNER rolü yok", async () => {
    const actor = await newUser();
    const r = await provision(actor);
    const o = await admin.query(
      'SELECT status,"ownerMembershipId" FROM public."Organization" WHERE id=$1',
      [r.organizationId],
    );
    expect(o.rows[0]).toEqual({ status: "ACTIVE", ownerMembershipId: r.ownerMembershipId });
    expect(
      (
        await admin.query('SELECT * FROM public."RoleAssignment" WHERE "organizationId"=$1', [
          r.organizationId,
        ])
      ).rows,
    ).toHaveLength(0);
    expect(
      (
        await admin.query('SELECT * FROM public."AuditLog" WHERE "organizationId"=$1', [
          r.organizationId,
        ])
      ).rows,
    ).toHaveLength(1);
  });
  it("aynı key/payload ve kaybolan commit yanıtı güvenle replay olur", async () => {
    const actor = await newUser();
    const slug = `replay-${randomUUID()}`;
    const key = randomUUID();
    const first = await provision(actor, slug, key);
    const replay = await provision(actor, slug, key);
    expect(replay).toEqual({ ...first, replayed: true });
  });
  it("aynı key farklı payload conflict", async () => {
    const actor = await newUser(),
      key = randomUUID(),
      slug = `conflict-${randomUUID()}`;
    await provision(actor, slug, key);
    await expect(provision(actor, slug, key, { name: "Farklı" })).rejects.toMatchObject({
      code: "23505",
    });
  });
  it("paralel aynı key yalnız bir kurum ve audit yaratır", async () => {
    const actor = await newUser(),
      key = randomUUID(),
      slug = `concurrent-${randomUUID()}`;
    const results = await Promise.all([
      provision(actor, slug, key),
      provision(actor, slug, key),
      provision(actor, slug, key),
    ]);
    expect(new Set(results.map((r) => r.organizationId)).size).toBe(1);
    expect(
      (await admin.query('SELECT * FROM public."Organization" WHERE "createdByUserId"=$1', [actor]))
        .rows,
    ).toHaveLength(1);
    expect(
      (
        await admin.query('SELECT * FROM public."AuditLog" WHERE "organizationId"=$1', [
          results[0]!.organizationId,
        ])
      ).rows,
    ).toHaveLength(1);
  });
  it("farklı actor aynı slug: tek başarı ve tek conflict", async () => {
    const slug = `duplicate-${randomUUID()}`;
    const actors = await Promise.all([newUser(), newUser()]);
    const results = await Promise.allSettled(actors.map((actor) => provision(actor, slug)));
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((r) => r.status === "rejected")).toHaveLength(1);
    expect(
      (await admin.query('SELECT id FROM public."Organization" WHERE slug=$1', [slug])).rows,
    ).toHaveLength(1);
  });
  for (const scenario of [
    "invalid-user",
    "invalid-input",
    "stale-auth",
    "expired-stepup",
    "expired-session",
  ])
    it(`başarısız ${scenario} kalıcı DRAFT/üyelik bırakmaz`, async () => {
      const actor = scenario === "invalid-user" ? randomUUID() : await newUser();
      const slug = `failure-${randomUUID()}`;
      const options =
        scenario === "invalid-input"
          ? { name: "" }
          : scenario === "stale-auth"
            ? { authVersion: 2 }
            : scenario === "expired-stepup"
              ? { step: new Date(Date.now() - 1000000) }
              : scenario === "expired-session"
                ? { expires: new Date(Date.now() - 1) }
                : {};
      await expect(provision(actor, slug, randomUUID(), options)).rejects.toBeDefined();
      expect(
        (await admin.query('SELECT id FROM public."Organization" WHERE slug=$1', [slug])).rows,
      ).toHaveLength(0);
    });
  it("işlem sonunda simüle hata tüm kurumu/üyeliği/audit'i rollback eder", async () => {
    const actor = await newUser();
    await expect(
      provision(actor, undefined, undefined, {
        after: async () => {
          throw new Error("sentetik hata");
        },
      }),
    ).rejects.toThrow("sentetik hata");
    expect(
      (
        await admin.query('SELECT id FROM public."Organization" WHERE "createdByUserId"=$1', [
          actor,
        ])
      ).rows,
    ).toHaveLength(0);
    expect(
      (
        await admin.query('SELECT id FROM public."OrganizationMembership" WHERE "userId"=$1', [
          actor,
        ])
      ).rows,
    ).toHaveLength(0);
  });
  it("audit insert hatası bütün provisioning'i rollback eder", async () => {
    const actor = await newUser();
    await admin.query(
      "CREATE FUNCTION security.synthetic_audit_failure() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'synthetic audit failure'; END $$",
    );
    await admin.query(
      `CREATE TRIGGER synthetic_audit_failure BEFORE INSERT ON public."AuditLog" FOR EACH ROW WHEN (NEW."actorUserId"='${actor}'::uuid) EXECUTE FUNCTION security.synthetic_audit_failure()`,
    );
    try {
      await expect(provision(actor)).rejects.toThrow("synthetic audit failure");
      expect(
        (
          await admin.query('SELECT id FROM public."Organization" WHERE "createdByUserId"=$1', [
            actor,
          ])
        ).rows,
      ).toHaveLength(0);
    } finally {
      await admin.query('DROP TRIGGER synthetic_audit_failure ON public."AuditLog"');
      await admin.query("DROP FUNCTION security.synthetic_audit_failure()");
    }
  });
  it("eksik function-owner ayrıcalığı fail-closed ve tam rollback", async () => {
    const actor = await newUser();
    await admin.query('REVOKE INSERT ON public."AuditLog" FROM panel_provision_owner');
    try {
      await expect(provision(actor)).rejects.toMatchObject({ code: "42501" });
      expect(
        (
          await admin.query('SELECT id FROM public."Organization" WHERE "createdByUserId"=$1', [
            actor,
          ])
        ).rows,
      ).toHaveLength(0);
    } finally {
      await admin.query('GRANT INSERT ON public."AuditLog" TO panel_provision_owner');
    }
  });
  it("revoked/suspended replay eski tenant'ı yeniden etkinleştirmez", async () => {
    for (const mode of ["revoked", "suspended"]) {
      const actor = await newUser(),
        key = randomUUID(),
        slug = `disabled-${randomUUID()}`;
      const r = await provision(actor, slug, key);
      if (mode === "revoked") {
        const replacement = await member(r.organizationId, await newUser());
        await admin.query('UPDATE public."Organization" SET "ownerMembershipId"=$1 WHERE id=$2', [
          replacement,
          r.organizationId,
        ]);
        // Devir replay sonucunu yetkiye dönüştürmez; ilk üyelik kimliği sabit kalır.
        expect((await provision(actor, slug, key)).ownerMembershipId).toBe(r.ownerMembershipId);
        await admin.query(
          "UPDATE public.\"OrganizationMembership\" SET status='REVOKED' WHERE id=$1",
          [r.ownerMembershipId],
        );
      } else {
        await admin.query("UPDATE public.\"Organization\" SET status='SUSPENDED' WHERE id=$1", [
          r.organizationId,
        ]);
      }
      await expect(provision(actor, slug, key)).rejects.toMatchObject({ code: "42501" });
      expect(
        (
          await admin.query('SELECT status FROM public."Organization" WHERE id=$1', [
            r.organizationId,
          ])
        ).rows[0].status,
      ).toBe(mode === "revoked" ? "ACTIVE" : "SUSPENDED");
    }
  });
  it("caller sahte GUC ile mevcut tenant'ı hedefleyemez; pooled state temizlenir", async () => {
    const c = await caller.connect();
    try {
      await c.query("BEGIN");
      await c.query(
        "SELECT set_config('provision.new_id',$1,true),set_config('provision.phase','QUOTA',true)",
        [a],
      );
      await expect(
        c.query("UPDATE public.\"Organization\" SET status='ACTIVE' WHERE id=$1", [a]),
      ).rejects.toMatchObject({ code: "42501" });
      await c.query("ROLLBACK");
      expect(
        (await c.query("SELECT nullif(current_setting('provision.new_id',true),'') value")).rows[0]
          .value,
      ).toBeNull();
    } finally {
      c.release();
    }
  });
  it("kota aynı actor lock altında uygulanır; replay kotayı tüketmez", async () => {
    const actor = await newUser();
    const key = randomUUID(),
      slug = `quota-${randomUUID()}`;
    await provision(actor, slug, key);
    for (let i = 0; i < 4; i++) await provision(actor);
    await expect(provision(actor)).rejects.toMatchObject({ code: "42501" });
    expect((await provision(actor, slug, key)).replayed).toBe(true);
  });
});

describe("Üretim kapıları ve güvenli hatalar", () => {
  it("gerçek adapter yokken principal ve provisioning üretilemez", async () => {
    const actual = await vi.importActual<typeof import("@/server/tenant/principal")>(
      "@/server/tenant/principal",
    );
    await expect(actual.requirePrincipal()).rejects.toMatchObject({ code: "UNAUTHENTICATED" });
    expect(() => actual.principalEvidence({} as never)).toThrow();
    await expect(
      createOrganizationWithOwner(
        testPrincipal(shared),
        { name: "Test", slug: "blocked", type: "CENTER", idempotencyKey: randomUUID() },
        randomUUID(),
      ),
    ).rejects.toMatchObject({ code: "UNAVAILABLE" });
  });
  it("production identity harness ve preview env ile açılamaz", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ENABLE_PREVIEW_ROUTES", "true");
    try {
      expect(() => testPrincipal(shared)).toThrow();
      const actual = await vi.importActual<typeof import("@/server/tenant/principal")>(
        "@/server/tenant/principal",
      );
      await expect(actual.requirePrincipal()).rejects.toMatchObject({ code: "UNAUTHENTICATED" });
    } finally {
      vi.unstubAllEnvs();
    }
  });
  it("workspace HTTP sınırı kimliksiz 401/no-store döndürür", async () => {
    const { GET } = await import("@/app/app/[orgSlug]/route");
    const response = await GET();
    expect(response.status).toBe(401);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.json()).toEqual({ error: "Kimlik doğrulama gerekli" });
  });
  for (const raw of [
    undefined,
    "postgresql://postgres:fake@remote.invalid/panel_any_test",
    "postgresql://postgres:fake@127.0.0.1/production",
    "postgresql://postgres:fake@127.0.0.1/panel_production_test",
    "postgresql://panel_runtime:fake@127.0.0.1/panel_any_test",
  ])
    it("güvensiz test/reset hedefi reddi", () => {
      expect(() => testDestination(raw)).toThrow();
    });
  it("runtime config migrator/default bağlantısına düşmez", () => {
    const previous = process.env.DATABASE_URL;
    try {
      delete process.env.DATABASE_URL;
      expect(() => connectionString("DATABASE_URL", "panel_runtime")).toThrow();
      process.env.DATABASE_URL = "postgresql://panel_migrator:fake@localhost/panel_dev";
      expect(() => connectionString("DATABASE_URL", "panel_runtime")).toThrow();
    } finally {
      process.env.DATABASE_URL = previous;
    }
  });
  for (const [code, expected] of [
    ["23505", "CONFLICT"],
    ["23503", "UNAVAILABLE"],
    ["23514", "UNAVAILABLE"],
    ["40001", "CONFLICT"],
    ["40P01", "CONFLICT"],
    ["42501", "UNAVAILABLE"],
    ["08006", "DEPENDENCY"],
    ["22023", "INVALID_INPUT"],
  ])
    it(`DB ${code} güvenli ${expected} hatasına çevrilir`, () => {
      const result = safeDatabaseError({ code, message: "postgresql://secret SQL protected-id" });
      expect(result.code).toBe(expected);
      expect(result.message).not.toContain("secret");
    });
});
