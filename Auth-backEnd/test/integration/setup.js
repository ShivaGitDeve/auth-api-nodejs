// Integration tests: asli PostgreSQL (DB_* from .env) lekin ek ALAG, temporary schema.
// public schema aur usme ka data kabhi touch nahi hota.
// Ye file --import se har test process mein baaki modules se pehle load hoti hai.
import dotenv from "dotenv";

dotenv.config({ quiet: true });

Object.assign(process.env, {
  NODE_ENV: "test",
  DB_SCHEMA: `teamflow_test_${process.pid}`,
  JWT_SECRET: "integration-access-secret",
  JWT_EXPIRE_IN: "15m",
  REFRESH_JWT_SECRET: "integration-refresh-secret",
  REFRESH_TOKEN_EXPIRES: "7d",
  // tests kabhi asli email na bhejein
  EMAIL_USER: "",
  EMAIL_PASS: "",
});
