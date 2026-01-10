import express from "express";
import { getUsers} from "../controllers/admin.controller.js";
import { proTect, authorizeRole } from "../middlewares/auth.middleware.js";
import { deleteUser } from "../controllers/auth.controller.js";

const router = express.Router();

router.get("/users", proTect, authorizeRole("admin"), getUsers);
router.delete("/user/:id", proTect, authorizeRole("admin"), deleteUser);

export default router;
