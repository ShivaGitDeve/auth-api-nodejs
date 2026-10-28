import { fileURLToPath } from "url";
import swaggerJsdoc from "swagger-jsdoc";
import config from "./env.js";

// route files ka path is file ke relative, cwd chahe kuch bhi ho
// (glob ko Windows par bhi forward slashes chahiye)
const routesGlob = fileURLToPath(new URL("../routes/*.js", import.meta.url)).replace(/\\/g, "/");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Fullstack Auth API",
      version: "1.0.0",
      description: "Authentication API with JWT + Refresh Rotation",
    },
    servers: [
      {
        url: config.apiUrl,
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  apis: [routesGlob],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
