import { defineConfig } from "prisma/config";
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  // generate/veri tipi kontrolü DB gerektirmez; migrate eksik URL ile güvenle başarısız olur.
  datasource: { url: process.env.DIRECT_URL ?? "" },
});
