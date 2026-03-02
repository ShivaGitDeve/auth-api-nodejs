import { version } from "react";
import swaggerJsdoc from "swagger-jsdoc";

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
        url: "http://localhost:5000",
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
  apis: ["./routes/*.js"], // route files path
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
