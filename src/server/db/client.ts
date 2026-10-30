import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { connectionString } from "./config";
let runtime: PrismaClient | undefined;
/** Yalnız db/transaction modülü içindir. Feature/UI import'u lint tarafından yasaktır. */
export function runtimeClient() {
  return (runtime ??= new PrismaClient({
    adapter: new PrismaPg({
      connectionString: connectionString("DATABASE_URL", "panel_runtime"),
      max: 5,
      connectionTimeoutMillis: 3000,
      idleTimeoutMillis: 10000,
    }),
    log: [],
  }));
}
