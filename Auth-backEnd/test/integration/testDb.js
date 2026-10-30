import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import pg from "pg";

const SAFE_SCHEMA = /^teamflow_test_\d+$/;
const backendDir = fileURLToPath(new URL("../../", import.meta.url));
const cliPath = fileURLToPath(new URL("../../node_modules/sequelize-cli/lib/sequelize", import.meta.url));

const schemaName = () => {
  const schema = process.env.DB_SCHEMA;
  // sirf test schema par kaam - "public" ya kisi aur schema ko kabhi drop nahi karega
  if (!SAFE_SCHEMA.test(schema || "")) {
    throw new Error(`Refusing to use schema "${schema}" for integration tests`);
  }
  return schema;
};

const adminClient = () =>
  new pg.Client({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
    database: process.env.DB_NAME,
  });

// naya schema banao aur usme saari migrations chalao
export const setupTestSchema = async () => {
  const schema = schemaName();
  const client = adminClient();
  await client.connect();
  try {
    await client.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    await client.query(`CREATE SCHEMA "${schema}"`);
  } finally {
    await client.end();
  }

  const result = spawnSync(process.execPath, [cliPath, "db:migrate"], {
    cwd: backendDir,
    env: process.env,
    encoding: "utf8",
  });
  if (result.status !== 0) {
    throw new Error(`Migrations failed in ${schema}:\n${result.stdout}\n${result.stderr}`);
  }
};

export const dropTestSchema = async () => {
  const schema = schemaName();
  const client = adminClient();
  await client.connect();
  try {
    await client.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
  } finally {
    await client.end();
  }
};
