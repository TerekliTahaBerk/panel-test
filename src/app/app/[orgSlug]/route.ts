import { requirePrincipal } from "@/server/tenant/principal";
export const dynamic = "force-dynamic";
/** Gerçek kimlik adapter'ı gelene kadar tenant verisi döndürmez. */
export async function GET() {
  try {
    await requirePrincipal();
  } catch {
    return Response.json(
      { error: "Kimlik doğrulama gerekli" },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }
  return Response.json(
    { error: "Çalışma alanı henüz kullanılamıyor" },
    { status: 403, headers: { "Cache-Control": "no-store" } },
  );
}
