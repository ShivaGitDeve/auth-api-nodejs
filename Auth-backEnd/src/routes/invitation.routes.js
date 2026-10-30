import express from "express";
import { proTect } from "../middlewares/auth.middleware.js";
import { validate } from "../validation/auth-validation.js";
import { invitationTokenSchema } from "../validation/invitation-validation.js";
import { previewInvitation, acceptInvitation } from "../controllers/invitation.controller.js";

const router = express.Router();

// token body mein (URL mein nahi) - taaki access logs mein na aaye
router.post("/preview", validate(invitationTokenSchema), previewInvitation);
router.post("/accept", proTect, validate(invitationTokenSchema), acceptInvitation);

export default router;
