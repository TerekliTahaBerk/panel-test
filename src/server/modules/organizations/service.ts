import "server-only";
import type { WorkspaceContext } from "@/features/workspace/types";
import { withTenantTransaction } from "../../db/transaction";
import { DatabaseFailure } from "../../db/errors";
import { tenantState, type TenantContext } from "../../tenant/context";
import { organizationSelect } from "../../tenant/resolver";
/** Sunum rolü yetki vermez; her veri işlemi orijinal context'i yeniden doğrular. */
export async function getWorkspacePresentation(context: TenantContext): Promise<WorkspaceContext> {
  const s = tenantState(context);
  return withTenantTransaction(context, async (tx) => {
    const organization = await tx.organization.findFirstOrThrow({
      where: { id: s.organizationId },
      select: organizationSelect,
    });
    const user = await tx.user.findFirstOrThrow({
      where: { id: s.actorUserId },
      select: { displayName: true },
    });
    const role =
      organization.ownerMembershipId === s.membershipId || s.roles.includes("ADMIN")
        ? "admin"
        : s.roles.includes("TEACHER")
          ? "teacher"
          : s.roles.includes("STUDENT")
            ? "student"
            : s.roles.includes("PARENT")
              ? "parent"
              : null;
    if (!role) throw new DatabaseFailure("UNAVAILABLE");
    const name = user.displayName ?? "Kullanıcı";
    return {
      role,
      organization: {
        id: organization.id,
        name: organization.name,
        subtitle: { INDIVIDUAL: "Bireysel kurum", CENTER: "Eğitim merkezi", SCHOOL: "Okul" }[
          organization.type
        ],
      },
      user: {
        name,
        initials: name
          .split(/\s+/)
          .slice(0, 2)
          .map((p) => p[0])
          .join("")
          .toLocaleUpperCase("tr-TR"),
        roleLabel: { admin: "Yönetici", teacher: "Öğretmen", student: "Öğrenci", parent: "Veli" }[
          role
        ],
      },
      isDemo: false,
    };
  });
}
