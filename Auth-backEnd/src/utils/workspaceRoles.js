// Workspace-level roles. Global users.role (user/admin) se bilkul alag hain.
export const WORKSPACE_ROLES = ["owner", "admin", "member"];

// Ek kaam ke liye kaun se workspace roles allowed hain
export const WORKSPACE_PERMISSIONS = {
  view: ["owner", "admin", "member"],
  update: ["owner", "admin"],
  delete: ["owner"],
  invite: ["owner", "admin"],
  manageTeams: ["owner", "admin"],
  // create / delete / ownership transfer (project owner bhi apna project edit kar sakta hai)
  manageProjects: ["owner", "admin"],
};

// ---- Invitations (Module 2) ----

// invitation se kabhi "owner" nahi milta
export const INVITABLE_ROLES = ["admin", "member"];

export const INVITATION_STATUSES = ["pending", "accepted", "revoked", "expired"];

// owner: admin + member invitations; admin: sirf member invitations
const MANAGEABLE_INVITE_ROLES = {
  owner: ["admin", "member"],
  admin: ["member"],
  member: [],
};

export const canManageInviteRole = (actorRole, inviteRole) =>
  (MANAGEABLE_INVITE_ROLES[actorRole] || []).includes(inviteRole);
