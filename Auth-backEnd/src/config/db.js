import { Sequelize } from "sequelize";

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: process.env.DB_DIALECT,
    logging: false,
    // optional: alag Postgres schema (integration tests isse use karte hain)
    dialectOptions: process.env.DB_SCHEMA
      ? { options: `-c search_path=${process.env.DB_SCHEMA}` }
      : {},
  }
);

const connectToDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connected successfully");
  } catch (error) {
    console.error("Database connection failed:", error.message);
    process.exit(1);
  }
};

export { sequelize, connectToDB };
