import express from "express";
import {
  getUsers,
  updateUserRole,
  deleteUser,
} from "../controllers/admin.controller.js";
import { proTect, authorizeRole } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(proTect, authorizeRole("admin"));

router.get("/users", getUsers);
router.patch("/users/:id/role", updateUserRole);
router.delete("/users/:id", deleteUser);

// purana singular path - backward compatibility ke liye
router.delete("/user/:id", deleteUser);

export default router;
