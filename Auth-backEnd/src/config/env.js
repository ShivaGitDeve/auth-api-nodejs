// App-level config from environment variables.
// dotenv is loaded in server.js before this module is evaluated.

const stripSlash = (url) => url.replace(/\/+$/, "");

const frontendUrl = stripSlash(process.env.FRONTEND_URL || "http://localhost:5173");

// comma separated list, e.g. "http://localhost:5173,https://app.example.com"
const corsOrigins = (process.env.CORS_ORIGINS || frontendUrl)
  .split(",")
  .map((o) => stripSlash(o.trim()))
  .filter(Boolean);

const config = {
  frontendUrl,
  corsOrigins,
  apiUrl: stripSlash(process.env.API_URL || `http://localhost:${process.env.PORT || 5000}`),
};

export default config;
