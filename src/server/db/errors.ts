import "server-only";
export type FailureCode =
  "UNAUTHENTICATED" | "UNAVAILABLE" | "CONFLICT" | "INVALID_INPUT" | "CONFIGURATION" | "DEPENDENCY";
export class DatabaseFailure extends Error {
  constructor(readonly code: FailureCode) {
    super(
      {
        UNAUTHENTICATED: "Kimlik doğrulama gerekli",
        UNAVAILABLE: "Kaynak kullanılamıyor",
        CONFLICT: "İşlem çakıştı",
        INVALID_INPUT: "Geçersiz istek",
        CONFIGURATION: "Sunucu yapılandırması eksik",
        DEPENDENCY: "Hizmet geçici olarak kullanılamıyor",
      }[code],
    );
  }
}
export function safeDatabaseError(error: unknown): DatabaseFailure {
  if (error instanceof DatabaseFailure) return error;
  const e = error as {
    code?: string;
    meta?: { code?: string; driverAdapterError?: { cause?: { originalCode?: string } } };
  };
  const code = e?.meta?.driverAdapterError?.cause?.originalCode ?? e?.meta?.code ?? e?.code;
  if (["23505", "40001", "40P01", "P2002", "P2034"].includes(code ?? ""))
    return new DatabaseFailure("CONFLICT");
  if (["23503", "23514", "42501", "P2003", "P2004"].includes(code ?? ""))
    return new DatabaseFailure("UNAVAILABLE");
  if (["22023", "22P02"].includes(code ?? "")) return new DatabaseFailure("INVALID_INPUT");
  return new DatabaseFailure("DEPENDENCY");
}
