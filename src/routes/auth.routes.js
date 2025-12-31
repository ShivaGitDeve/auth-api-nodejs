import express from "express";
import { registerUser, loginUser } from "../controllers/auth.controller.js";
import {proTect} from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/profile", proTect, (req, res) => {
  res.status(200).json({ message: "Profile Data", user: req.user });
});

export default router;
