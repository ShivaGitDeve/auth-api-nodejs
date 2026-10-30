import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";
import { normalizeTeamName } from "../utils/teamName.js";

const Team = sequelize.define(
  "Team",
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
    name: {
      type: DataTypes.STRING(80),
      allowNull: false,
      validate: { notEmpty: true },
      set(value) {
        this.setDataValue("name", normalizeTeamName(value));
      },
    },
    description: {
      type: DataTypes.TEXT,
    },
    createdById: {
      type: DataTypes.UUID,
    },
  },
  {
    tableName: "teams",
    timestamps: true,
  },
);

export default Team;
