// sequelize-cli ke liye DB config - wahi .env variables jo src/config/db.js use karta hai
require("dotenv").config();

const base = {
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
  dialect: process.env.DB_DIALECT || "postgres",
  logging: false,
  migrationStorageTableName: "SequelizeMeta",
  // optional: alag Postgres schema (integration tests isse use karte hain)
  ...(process.env.DB_SCHEMA && { migrationStorageTableSchema: process.env.DB_SCHEMA }),
  dialectOptions: process.env.DB_SCHEMA
    ? { options: `-c search_path=${process.env.DB_SCHEMA}` }
    : {},
};

module.exports = {
  development: base,
  test: base,
  production: base,
};
