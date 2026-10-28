// Tests ke liye fixed env - real .env ya database ki zaroorat nahi.
// Ye file --import se baaki modules se pehle load hoti hai.
Object.assign(process.env, {
  NODE_ENV: "test",
  JWT_SECRET: "test-access-secret",
  JWT_EXPIRE_IN: "15m",
  REFRESH_JWT_SECRET: "test-refresh-secret",
  REFRESH_TOKEN_EXPIRES: "7d",
  DB_DIALECT: "postgres",
  DB_NAME: "unused",
  DB_USER: "unused",
  DB_PASSWORD: "unused",
  DB_HOST: "127.0.0.1",
  FRONTEND_URL: "https://app.example.com/",
  CORS_ORIGINS: "https://app.example.com, http://localhost:5173/",
  EMAIL_USER: "",
  EMAIL_PASS: "",
});
