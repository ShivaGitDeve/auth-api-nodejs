import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";
import { INVITABLE_ROLES, INVITATION_STATUSES } from "../utils/workspaceRoles.js";

const WorkspaceInvitation = sequelize.define(
  "WorkspaceInvitation",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    workspaceId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: { isEmail: true },
      set(value) {
        this.setDataValue("email", String(value).trim().toLowerCase());
      },
    },
    role: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "member",
      validate: { isIn: [INVITABLE_ROLES] },
    },
    invitedById: {
      type: DataTypes.UUID,
    },
    tokenHash: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "pending",
      validate: { isIn: [INVITATION_STATUSES] },
    },
    acceptedAt: {
      type: DataTypes.DATE,
    },
    acceptedById: {
      type: DataTypes.UUID,
    },
    revokedAt: {
      type: DataTypes.DATE,
    },
  },
  {
    tableName: "workspace_invitations",
    timestamps: true,
  },
);

export default WorkspaceInvitation;
