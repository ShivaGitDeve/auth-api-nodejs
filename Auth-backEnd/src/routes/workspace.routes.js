import express from "express";
import { proTect } from "../middlewares/auth.middleware.js";
import {
  loadWorkspaceMembership,
  requireWorkspaceRole,
} from "../middlewares/workspace.middleware.js";
import { validate } from "../validation/auth-validation.js";
import {
  createWorkspaceSchema,
  updateWorkspaceSchema,
  deleteWorkspaceSchema,
} from "../validation/workspace-validation.js";
import {
  createWorkspace,
  listMyWorkspaces,
  getWorkspace,
  updateWorkspace,
  deleteWorkspace,
} from "../controllers/workspace.controller.js";
import { WORKSPACE_PERMISSIONS } from "../utils/workspaceRoles.js";
import { createInvitationSchema } from "../validation/invitation-validation.js";
import {
  createInvitation,
  listInvitations,
  revokeInvitation,
  resendInvitation,
} from "../controllers/invitation.controller.js";
import { inviteLimiter } from "../middlewares/rateLimit.middleware.js";
import teamRouter from "./team.routes.js";
import projectRouter from "./project.routes.js";

const router = express.Router();

router.use(proTect);

router.get("/", listMyWorkspaces);
router.post("/", validate(createWorkspaceSchema), createWorkspace);

// membership check validation se pehle - non-member ko hamesha 404
router.get(
  "/:workspaceId",
  loadWorkspaceMembership,
  requireWorkspaceRole(...WORKSPACE_PERMISSIONS.view),
  getWorkspace,
);
router.patch(
  "/:workspaceId",
  loadWorkspaceMembership,
  requireWorkspaceRole(...WORKSPACE_PERMISSIONS.update),
  validate(updateWorkspaceSchema),
  updateWorkspace,
);
router.delete(
  "/:workspaceId",
  loadWorkspaceMembership,
  requireWorkspaceRole(...WORKSPACE_PERMISSIONS.delete),
  validate(deleteWorkspaceSchema),
  deleteWorkspace,
);

// ---- Invitations (Module 2) - owner/admin only ----
const canInvite = [loadWorkspaceMembership, requireWorkspaceRole(...WORKSPACE_PERMISSIONS.invite)];

router.get("/:workspaceId/invitations", ...canInvite, listInvitations);
router.post(
  "/:workspaceId/invitations",
  ...canInvite,
  inviteLimiter,
  validate(createInvitationSchema),
  createInvitation,
);
router.post("/:workspaceId/invitations/:invitationId/revoke", ...canInvite, revokeInvitation);
router.post(
  "/:workspaceId/invitations/:invitationId/resend",
  ...canInvite,
  inviteLimiter,
  resendInvitation,
);

// ---- Teams (Module 3) ----
router.use("/:workspaceId/teams", loadWorkspaceMembership, teamRouter);

// ---- Projects (Module 4) ----
router.use("/:workspaceId/projects", loadWorkspaceMembership, projectRouter);

export default router;
