import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";
import {
  PROJECT_STATUSES,
  PROJECT_PRIORITIES,
  PROJECT_KEY_RE,
  normalizeProjectKey,
} from "../utils/projectMeta.js";

const Project = sequelize.define(
  "Project",
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
    teamId: {
      type: DataTypes.UUID,
    },
    ownerMemberId: {
      type: DataTypes.UUID,
    },
    name: {
      type: DataTypes.STRING(120),
      allowNull: false,
      validate: { notEmpty: true },
    },
    key: {
      type: DataTypes.STRING(10),
      allowNull: false,
      validate: { is: PROJECT_KEY_RE },
      set(value) {
        this.setDataValue("key", normalizeProjectKey(value));
      },
    },
    description: {
      type: DataTypes.TEXT,
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "planning",
      validate: { isIn: [PROJECT_STATUSES] },
    },
    priority: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "medium",
      validate: { isIn: [PROJECT_PRIORITIES] },
    },
    startDate: {
      type: DataTypes.DATEONLY,
    },
    dueDate: {
      type: DataTypes.DATEONLY,
    },
    archivedAt: {
      type: DataTypes.DATE,
    },
    createdById: {
      type: DataTypes.UUID,
    },
  },
  {
    tableName: "projects",
    timestamps: true,
  },
);

export default Project;
