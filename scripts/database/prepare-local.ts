import { Client } from "pg";
import { localDestination } from "./safety";
import { prepareDatabase } from "./bootstrap";
const url = localDestination(process.env.LOCAL_DATABASE_URL);
await prepareDatabase(url);
const client = new Client({ connectionString: url.toString() });
await client.connect();
try {
  const result = await client.query("SELECT security.provisioning_quota() quota");
  if (result.rows[0]?.quota !== 0) throw new Error("Yerel provisioning varsayılan kapalı olmalı");
} finally {
  await client.end();
}
console.log("Yerel geliştirme DB hazır; provisioning kotası kapalı kaldı.");
