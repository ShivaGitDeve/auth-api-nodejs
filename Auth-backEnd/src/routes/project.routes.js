import express from "express";
import { requireWorkspaceRole } from "../middlewares/workspace.middleware.js";
import { loadProject, requireProjectManager } from "../middlewares/project.middleware.js";
import { validate } from "../validation/auth-validation.js";
import {
  createProjectSchema,
  updateProjectSchema,
  unarchiveProjectSchema,
  deleteProjectSchema,
  addProjectMemberSchema,
} from "../validation/project-validation.js";
import {
  listProjects,
  createProject,
  getProject,
  updateProject,
  archiveProject,
  unarchiveProject,
  deleteProject,
  getProjectMembers,
  addProjectMember,
  removeProjectMember,
} from "../controllers/project.controller.js";
import { WORKSPACE_PERMISSIONS } from "../utils/workspaceRoles.js";

// /api/workspaces/:workspaceId/projects - proTect + loadWorkspaceMembership workspace router mein lag chuke hain
//
// Permissions:
//   view (list, details, members)          -> koi bhi workspace member
//   create, delete, ownership transfer     -> workspace owner/admin
//   update, archive/unarchive, members     -> workspace owner/admin ya project owner
const router = express.Router({ mergeParams: true });

const canView = requireWorkspaceRole(...WORKSPACE_PERMISSIONS.view);
const canAdminister = requireWorkspaceRole(...WORKSPACE_PERMISSIONS.manageProjects);

router.get("/", canView, listProjects);
router.post("/", canAdminister, validate(createProjectSchema), createProject);

router.get("/:projectId", canView, loadProject, getProject);
router.patch("/:projectId", loadProject, requireProjectManager, validate(updateProjectSchema), updateProject);
router.post("/:projectId/archive", loadProject, requireProjectManager, archiveProject);
router.post(
  "/:projectId/unarchive",
  loadProject,
  requireProjectManager,
  validate(unarchiveProjectSchema),
  unarchiveProject,
);
router.delete("/:projectId", canAdminister, loadProject, validate(deleteProjectSchema), deleteProject);

router.get("/:projectId/members", canView, loadProject, getProjectMembers);
router.post(
  "/:projectId/members",
  loadProject,
  requireProjectManager,
  validate(addProjectMemberSchema),
  addProjectMember,
);
router.delete("/:projectId/members/:userId", loadProject, requireProjectManager, removeProjectMember);

export default router;
