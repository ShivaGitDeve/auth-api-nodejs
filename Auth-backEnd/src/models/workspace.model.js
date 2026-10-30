import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

const Workspace = sequelize.define(
  "Workspace",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(80),
      allowNull: false,
      validate: { notEmpty: true },
    },
    slug: {
      type: DataTypes.STRING(60),
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
    },
    createdById: {
      type: DataTypes.UUID,
    },
  },
  {
    tableName: "workspaces",
    timestamps: true,
  },
);

export default Workspace;
