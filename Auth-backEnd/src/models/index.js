// Saare models aur unke associations ek jagah.
// Naye modules ke models yahin register karo.
import { sequelize } from "../config/db.js";
import User from "./user.model.js";
import RefreshToken from "./refreshToken.model.js";
import Workspace from "./workspace.model.js";
import WorkspaceMember from "./workspaceMember.model.js";
import WorkspaceInvitation from "./workspaceInvitation.model.js";
import Team from "./team.model.js";
import TeamMember from "./teamMember.model.js";
import Project from "./project.model.js";
import ProjectMember from "./projectMember.model.js";

User.hasMany(RefreshToken, {
  foreignKey: "userId",
  as: "refreshTokens",
  onDelete: "CASCADE",
});
RefreshToken.belongsTo(User, { foreignKey: "userId", as: "user" });

// ---- Workspaces (Module 1) ----
Workspace.belongsTo(User, { foreignKey: "createdById", as: "creator" });

Workspace.hasMany(WorkspaceMember, {
  foreignKey: "workspaceId",
  as: "members",
  onDelete: "CASCADE",
});
WorkspaceMember.belongsTo(Workspace, { foreignKey: "workspaceId", as: "workspace" });

User.hasMany(WorkspaceMember, {
  foreignKey: "userId",
  as: "workspaceMemberships",
  onDelete: "CASCADE",
});
WorkspaceMember.belongsTo(User, { foreignKey: "userId", as: "user" });

User.belongsToMany(Workspace, {
  through: WorkspaceMember,
  foreignKey: "userId",
  otherKey: "workspaceId",
  as: "workspaces",
});
Workspace.belongsToMany(User, {
  through: WorkspaceMember,
  foreignKey: "workspaceId",
  otherKey: "userId",
  as: "users",
});

// ---- Invitations (Module 2) ----
Workspace.hasMany(WorkspaceInvitation, {
  foreignKey: "workspaceId",
  as: "invitations",
  onDelete: "CASCADE",
});
WorkspaceInvitation.belongsTo(Workspace, { foreignKey: "workspaceId", as: "workspace" });
WorkspaceInvitation.belongsTo(User, { foreignKey: "invitedById", as: "invitedBy" });
WorkspaceInvitation.belongsTo(User, { foreignKey: "acceptedById", as: "acceptedBy" });

// ---- Teams (Module 3) ----
// FKs (composite, cascade) migration mein hain; yahan sirf query associations
Workspace.hasMany(Team, { foreignKey: "workspaceId", as: "teams", onDelete: "CASCADE" });
Team.belongsTo(Workspace, { foreignKey: "workspaceId", as: "workspace" });
Team.belongsTo(User, { foreignKey: "createdById", as: "creator" });

Team.hasMany(TeamMember, { foreignKey: "teamId", as: "memberships", onDelete: "CASCADE" });
TeamMember.belongsTo(Team, { foreignKey: "teamId", as: "team" });
WorkspaceMember.hasMany(TeamMember, {
  foreignKey: "workspaceMemberId",
  as: "teamMemberships",
  onDelete: "CASCADE",
});
TeamMember.belongsTo(WorkspaceMember, { foreignKey: "workspaceMemberId", as: "workspaceMember" });

// ---- Projects (Module 4) ----
// FKs (composite, cascade / set null) migration mein hain; yahan sirf query associations
Workspace.hasMany(Project, { foreignKey: "workspaceId", as: "projects", onDelete: "CASCADE" });
Project.belongsTo(Workspace, { foreignKey: "workspaceId", as: "workspace" });
Project.belongsTo(Team, { foreignKey: "teamId", as: "team" });
Team.hasMany(Project, { foreignKey: "teamId", as: "projects" });
Project.belongsTo(WorkspaceMember, { foreignKey: "ownerMemberId", as: "ownerMember" });
Project.belongsTo(User, { foreignKey: "createdById", as: "creator" });

Project.hasMany(ProjectMember, { foreignKey: "projectId", as: "memberships", onDelete: "CASCADE" });
ProjectMember.belongsTo(Project, { foreignKey: "projectId", as: "project" });
WorkspaceMember.hasMany(ProjectMember, {
  foreignKey: "workspaceMemberId",
  as: "projectMemberships",
  onDelete: "CASCADE",
});
ProjectMember.belongsTo(WorkspaceMember, { foreignKey: "workspaceMemberId", as: "workspaceMember" });

export {
  sequelize,
  User,
  RefreshToken,
  Workspace,
  WorkspaceMember,
  WorkspaceInvitation,
  Team,
  TeamMember,
  Project,
  ProjectMember,
};
