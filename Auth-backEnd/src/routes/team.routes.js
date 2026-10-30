import express from "express";
import { requireWorkspaceRole } from "../middlewares/workspace.middleware.js";
import { loadTeam } from "../middlewares/team.middleware.js";
import { validate } from "../validation/auth-validation.js";
import {
  createTeamSchema,
  updateTeamSchema,
  addTeamMemberSchema,
} from "../validation/team-validation.js";
import {
  listTeams,
  createTeam,
  getTeam,
  updateTeam,
  deleteTeam,
  addTeamMember,
  removeTeamMember,
} from "../controllers/team.controller.js";
import { WORKSPACE_PERMISSIONS } from "../utils/workspaceRoles.js";

// /api/workspaces/:workspaceId/teams - proTect + loadWorkspaceMembership workspace router mein lag chuke hain
const router = express.Router({ mergeParams: true });

const canView = requireWorkspaceRole(...WORKSPACE_PERMISSIONS.view);
const canManage = requireWorkspaceRole(...WORKSPACE_PERMISSIONS.manageTeams);

router.get("/", canView, listTeams);
router.post("/", canManage, validate(createTeamSchema), createTeam);

router.get("/:teamId", canView, loadTeam, getTeam);
router.patch("/:teamId", canManage, loadTeam, validate(updateTeamSchema), updateTeam);
router.delete("/:teamId", canManage, loadTeam, deleteTeam);

router.post("/:teamId/members", canManage, loadTeam, validate(addTeamMemberSchema), addTeamMember);
router.delete("/:teamId/members/:userId", canManage, loadTeam, removeTeamMember);

export default router;
