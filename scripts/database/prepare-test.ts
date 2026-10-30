import { Client } from "pg";
import { testDestination } from "./safety";
import { prepareDatabase } from "./bootstrap";
const url = testDestination(process.env.TEST_DATABASE_URL);
await prepareDatabase(url);
const fixtureAdmin = new Client({ connectionString: url.toString() });
await fixtureAdmin.connect();
try {
  await fixtureAdmin.query(
    "CREATE OR REPLACE FUNCTION security.provisioning_quota() RETURNS integer LANGUAGE sql IMMUTABLE SET search_path=pg_catalog AS $$ SELECT 5 $$",
  );
} finally {
  await fixtureAdmin.end();
}
console.log("İzole test DB hazır; migration zinciri ve ikinci deploy başarılı.");
