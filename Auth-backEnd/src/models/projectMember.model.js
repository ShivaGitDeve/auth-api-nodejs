import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

// Project <-> WorkspaceMember. workspaceId composite FKs ke liye
// (DB guarantee karta hai ki project aur member ek hi workspace ke hain).
const ProjectMember = sequelize.define(
  "ProjectMember",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    projectId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    workspaceMemberId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    workspaceId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    addedById: {
      type: DataTypes.UUID,
    },
  },
  {
    tableName: "project_members",
    timestamps: true,
  },
);

export default ProjectMember;
