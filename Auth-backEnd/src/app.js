import express from "express";
import cors from "cors";
import morgan from "morgan";
import route from "./routes/auth.routes.js";
import adminRoute from "./routes/admin.routes.js";
import errorHandler from "./middlewares/error.middleware.js";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./config/swagger.js";
import "./jobs/refreshTokenClean.job.js";

const app = express();

app.use(morgan("dev"));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(cors());
app.use(express.json());

app.use("/api/admin", adminRoute);
app.use("/api/auth", route);

app.use(errorHandler);
app.get("/", (req, res) => {
  res.status(200).json({ success: true, message: "Auth API is running" });
});

export default app;
