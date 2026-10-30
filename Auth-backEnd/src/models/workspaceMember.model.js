import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";
import { WORKSPACE_ROLES } from "../utils/workspaceRoles.js";

const WorkspaceMember = sequelize.define(
  "WorkspaceMember",
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
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    role: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "member",
      validate: { isIn: [WORKSPACE_ROLES] },
    },
  },
  {
    tableName: "workspace_members",
    timestamps: true,
    indexes: [{ unique: true, fields: ["workspaceId", "userId"] }],
  },
);

export default WorkspaceMember;
