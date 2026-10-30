import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: [
      "src/server/db/**",
      "src/server/generated/**",
      "src/server/tenant/resolver.ts",
      "src/server/modules/organizations/**",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@/server/db/client",
                "**/db/client",
                "@/server/db/transaction",
                "**/db/transaction",
                "@prisma/client",
                "**/generated/prisma/client",
              ],
              message: "Veritabanına yalnız yetkili DAL üzerinden erişin.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/server/tenant/context.ts", "src/server/tenant/resolver.ts"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "ImportSpecifier[imported.name='issueContext']",
          message: "Context yalnız resolver tarafından oluşturulur.",
        },
      ],
    },
  },
  globalIgnores([
    ".next/**",
    "src/server/generated/**",
    "out/**",
    "coverage/**",
    "playwright-report/**",
    "test-results/**",
    "next-env.d.ts",
  ]),
]);
