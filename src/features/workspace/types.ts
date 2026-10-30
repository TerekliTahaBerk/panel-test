import type { WorkspaceRole } from "@/types/roles";

/**
 * Shell için sunum DTO'su. Faz 02 sunucu projection'ı hazırlanmıştır;
 * gerçek kimlik doğrulama Faz 03'te bağlanır. Bu nesne yetki kanıtı değildir.
 */
export interface WorkspaceContext {
  role: WorkspaceRole;
  organization: { id: string; name: string; subtitle: string };
  user: { name: string; initials: string; roleLabel: string };
  /** True when everything rendered is fictional demonstration data. */
  isDemo: boolean;
}
