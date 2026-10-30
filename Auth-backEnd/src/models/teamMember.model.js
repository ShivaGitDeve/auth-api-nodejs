import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

// Team <-> WorkspaceMember. workspaceId dono taraf ke composite FK ke liye
// (DB guarantee karta hai ki team aur member ek hi workspace ke hain).
const TeamMember = sequelize.define(
  "TeamMember",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    teamId: {
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
    tableName: "team_members",
    timestamps: true,
  },
);

export default TeamMember;
