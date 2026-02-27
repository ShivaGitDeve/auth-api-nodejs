import express from "express";
import {
  registerSchema,
  loginSchema,
  forgotPswdSchema,
  resetPasswordSchema,
  validate,
} from "../validation/auth-validation.js";
import { changePassword, deleteUser } from "../controllers/auth.controller.js";
import {
  getMe,
  getAllUsers,
  updateUserRole,
} from "../controllers/auth.controller.js";
import {
  registerUser,
  loginUser,
  refeshAT,
  forgotPswd,
  resetPassword,
} from "../controllers/auth.controller.js";
import { logoutUser } from "../controllers/auth.controller.js";
import { authorizeRole, proTect } from "../middlewares/auth.middleware.js";
import {
  loginLimiter,
  forgotLimiter,
} from "../middlewares/rateLimit.middleware.js";

const router = express.Router();

router.get("/me", proTect, getMe);

// ------admin only api------
router.get("/users", proTect, authorizeRole("admin"), getAllUsers);
router.delete("/users/:id", proTect, authorizeRole("admin"), deleteUser);
router.patch(
  "/users/:id/role",
  proTect,
  authorizeRole("admin"),
  updateUserRole,
);
// ------------------------------
router.post("/register", validate(registerSchema), registerUser);
router.post("/login", validate(loginSchema), loginLimiter, loginUser);
router.get("/profile", proTect, (req, res) => {
  res.status(200).json({ message: "Profile Data", user: req.user });
});
router.post("/refresh-token", refeshAT);
router.post(
  "/forgot-password",
  validate(forgotPswdSchema),
  forgotLimiter,
  forgotPswd,
);
router.post("/reset-password", validate(resetPasswordSchema), resetPassword);
router.post("/logout", logoutUser);
router.post("/change-password", proTect, changePassword);

export default router;
