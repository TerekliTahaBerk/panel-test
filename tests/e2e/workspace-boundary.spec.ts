import { test, expect } from "@playwright/test";
test("preview açıkken dahi gerçek workspace kimliksiz erişime kapalıdır", async ({ request }) => {
  const response = await request.get("/app/sentetik-kurum", {
    headers: { "x-user-id": "forged", "x-role": "ADMIN", "x-organization-id": "forged" },
  });
  expect(response.status()).toBe(401);
  expect(response.headers()["cache-control"]).toBe("no-store");
  expect(await response.json()).toEqual({ error: "Kimlik doğrulama gerekli" });
});
