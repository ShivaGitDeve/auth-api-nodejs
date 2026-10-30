import Joi from "joi";
import { INVITABLE_ROLES } from "../utils/workspaceRoles.js";

export const createInvitationSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().max(255).required(),
  role: Joi.string()
    .valid(...INVITABLE_ROLES)
    .default("member")
    .messages({ "any.only": "Role must be admin or member" }),
});

export const invitationTokenSchema = Joi.object({
  token: Joi.string().trim().min(20).max(200).required(),
});
