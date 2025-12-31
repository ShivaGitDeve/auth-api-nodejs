import express from "express";
import cors from "cors";
import route from "./routes/auth.routes.js";
import adminRoute from "./routes/admin.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/admin", adminRoute);
app.use("/api/auth", route);
app.get("/", (req, res) => {
  res.status(200).json({ success: true, message: "Auth API is running" });
});

export default app;
