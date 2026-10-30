import "server-only";
import { DatabaseFailure } from "./errors";
export function connectionString(
  key: "DATABASE_URL" | "PROVISIONING_DATABASE_URL",
  role: string,
): string {
  const raw = process.env[key];
  try {
    if (!raw) throw new Error();
    const url = new URL(raw);
    if (
      !["postgres:", "postgresql:"].includes(url.protocol) ||
      decodeURIComponent(url.username) !== role ||
      !url.password ||
      !url.hostname ||
      url.pathname.length < 2
    )
      throw new Error();
    return raw;
  } catch {
    throw new DatabaseFailure("CONFIGURATION");
  }
}
