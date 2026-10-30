import { Workspace, WorkspaceMember } from "../models/index.js";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// proTect ke baad chalta hai. User is workspace ka member hai tabhi aage jaane deta hai.
// Non-member ko 404 milta hai (403 nahi) taaki doosre workspaces ka existence bhi pata na chale.
// Global users.role (admin) yahan koi bypass nahi deta.
export const loadWorkspaceMembership = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    if (!UUID_RE.test(workspaceId || "")) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    const membership = await WorkspaceMember.findOne({
      where: { workspaceId, userId: req.user.id },
      include: [{ model: Workspace, as: "workspace" }],
    });
    if (!membership || !membership.workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    req.membership = membership;
    req.workspace = membership.workspace;
    next();
  } catch (error) {
    next(error);
  }
};

export const requireWorkspaceRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.membership) {
      return res.status(404).json({ message: "Workspace not found" });
    }
    if (!allowedRoles.includes(req.membership.role)) {
      return res
        .status(403)
        .json({ message: "Your workspace role does not allow this action" });
    }
    next();
  };
};
