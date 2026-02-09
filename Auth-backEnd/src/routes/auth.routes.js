import express from "express";
import {
  registerUser,
  loginUser,
  refeshAT,
  forgotPswd,
  resetPassword,
} from "../controllers/auth.controller.js";
import { logoutUser } from "../controllers/auth.controller.js";
import { proTect } from "../middlewares/auth.middleware.js";
import {
  loginLimiter,
  forgotLimiter,
} from "../middlewares/rateLimit.middleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginLimiter, loginUser);
router.get("/profile", proTect, (req, res) => {
  res.status(200).json({ message: "Profile Data", user: req.user });
});
router.post("/refresh-token", refeshAT);
router.post("/forgot-password", forgotLimiter, forgotPswd);
router.post("/reset-password", resetPassword);
router.post("/logout", logoutUser);

export default router;
