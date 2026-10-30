import { Client } from "pg";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { isolatedDestination, roleUrl } from "./safety";

/** Mevcut DB'yi değiştirmeden yalnız yeni izole yerel DB kurar. */
export async function prepareDatabase(candidate: URL) {
  const url = isolatedDestination(candidate.toString());
  const db = url.pathname.slice(1);
  const control = new URL(url);
  control.pathname = "/postgres";
  const admin = new Client({ connectionString: control.toString() });
  await admin.connect();
  try {
    // Mevcut DB'yi resetlemek yerine başarısız ol: her iş benzersiz boş DB seçer.
    await admin.query(`CREATE DATABASE "${db}"`);
  } finally {
    await admin.end();
  }
  const client = new Client({ connectionString: url.toString() });
  await client.connect();
  try {
    await client.query(readFileSync("scripts/database/roles.sql", "utf8"));
    await client.query(`REVOKE ALL ON DATABASE "${db}" FROM PUBLIC`);
    await client.query(
      `GRANT CONNECT ON DATABASE "${db}" TO panel_migrator,panel_runtime,panel_provisioner`,
    );
    await client.query(`GRANT CREATE ON DATABASE "${db}" TO panel_migrator`);
    // Sentetik job kimlik bilgisi; URL/log çıktısına yazılmaz.
    const password = decodeURIComponent(url.password);
    if (!password) throw new Error("Test URL parolası gerekli");
    const quoted = "'" + password.replaceAll("'", "''") + "'";
    for (const role of ["panel_migrator", "panel_runtime", "panel_provisioner"])
      await client.query(`ALTER ROLE ${role} PASSWORD ${quoted}`);
  } finally {
    await client.end();
  }
  const env = { ...process.env, DIRECT_URL: roleUrl(url, "panel_migrator") };
  execFileSync("node_modules/.bin/prisma", ["migrate", "deploy"], { env, stdio: "inherit" });
  // İkinci deploy uygulanmış migration'ları değiştiremez.
  execFileSync("node_modules/.bin/prisma", ["migrate", "deploy"], { env, stdio: "inherit" });
}
