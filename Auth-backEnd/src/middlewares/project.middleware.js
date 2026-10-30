import { Project, Team, User, WorkspaceMember } from "../models/index.js";
import { canManageProject } from "../utils/projectMeta.js";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const projectIncludes = [
  { model: Team, as: "team", attributes: ["id", "name"] },
  {
    model: WorkspaceMember,
    as: "ownerMember",
    attributes: ["id", "userId", "role"],
    include: [{ model: User, as: "user", attributes: ["id", "name", "email"] }],
  },
];

// loadWorkspaceMembership ke baad. Project sirf ISI workspace mein dhoondha jaata hai -
// doosre workspace ki project id par hamesha 404.
export const loadProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    if (!UUID_RE.test(projectId || "")) {
      return res.status(404).json({ message: "Project not found" });
    }
    const project = await Project.findOne({
      where: { id: projectId, workspaceId: req.workspace.id },
      include: projectIncludes,
    });
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    req.project = project;
    next();
  } catch (error) {
    next(error);
  }
};

// workspace owner/admin ya is project ka owner
export const requireProjectManager = (req, res, next) => {
  if (!canManageProject(req.membership, req.project)) {
    return res.status(403).json({ message: "Only the project owner or workspace owners/admins can do this" });
  }
  next();
};
