import express from "express";
import { getUsers } from "../controllers/admin.controller.js";
import { proTect, authorizeRole } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/users", proTect, authorizeRole("admin"), getUsers);

export default router;
