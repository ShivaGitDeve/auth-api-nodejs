"use strict";

// Module 4: projects + project_members.
// Sirf naye tables banate hain - existing tables / data touch nahi hote.
// Composite FKs ensure karte hain ki team, owner aur members hamesha ISI workspace ke hon.
// "ON DELETE SET NULL (col)" PostgreSQL 15+ feature hai (sirf wahi column null hota hai).

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        "projects",
        {
          id: {
            type: Sequelize.UUID,
            primaryKey: true,
            allowNull: false,
            defaultValue: Sequelize.literal("gen_random_uuid()"),
          },
          workspaceId: {
            type: Sequelize.UUID,
            allowNull: false,
            references: { model: "workspaces", key: "id" },
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
          },
          teamId: { type: Sequelize.UUID, allowNull: true },
          ownerMemberId: { type: Sequelize.UUID, allowNull: true },
          name: { type: Sequelize.STRING(120), allowNull: false },
          // uppercase, jaise "MOB", "WEB2"
          key: { type: Sequelize.STRING(10), allowNull: false },
          description: { type: Sequelize.TEXT, allowNull: true },
          status: { type: Sequelize.STRING(20), allowNull: false, defaultValue: "planning" },
          priority: { type: Sequelize.STRING(20), allowNull: false, defaultValue: "medium" },
          startDate: { type: Sequelize.DATEONLY, allowNull: true },
          dueDate: { type: Sequelize.DATEONLY, allowNull: true },
          archivedAt: { type: Sequelize.DATE, allowNull: true },
          createdById: {
            type: Sequelize.UUID,
            allowNull: true,
            references: { model: "users", key: "id" },
            onUpdate: "CASCADE",
            onDelete: "SET NULL",
          },
          createdAt: { type: Sequelize.DATE, allowNull: false },
          updatedAt: { type: Sequelize.DATE, allowNull: false },
        },
        { transaction },
      );

      const q = (sql) => queryInterface.sequelize.query(sql, { transaction });

      await q(`ALTER TABLE "projects"
        ADD CONSTRAINT "projects_status_check"
          CHECK ("status" IN ('planning', 'active', 'on_hold', 'completed', 'archived')),
        ADD CONSTRAINT "projects_priority_check"
          CHECK ("priority" IN ('low', 'medium', 'high', 'urgent')),
        ADD CONSTRAINT "projects_key_format_check"
          CHECK ("key" ~ '^[A-Z][A-Z0-9]{1,9}$'),
        ADD CONSTRAINT "projects_date_range_check"
          CHECK ("startDate" IS NULL OR "dueDate" IS NULL OR "dueDate" >= "startDate"),
        ADD CONSTRAINT "projects_workspace_key_key" UNIQUE ("workspaceId", "key"),
        ADD CONSTRAINT "projects_id_workspace_key" UNIQUE ("id", "workspaceId"),
        ADD CONSTRAINT "projects_team_fkey"
          FOREIGN KEY ("teamId", "workspaceId") REFERENCES "teams" ("id", "workspaceId")
          ON UPDATE CASCADE ON DELETE SET NULL ("teamId"),
        ADD CONSTRAINT "projects_owner_member_fkey"
          FOREIGN KEY ("ownerMemberId", "workspaceId") REFERENCES "workspace_members" ("id", "workspaceId")
          ON UPDATE CASCADE ON DELETE SET NULL ("ownerMemberId")`);

      await queryInterface.addIndex("projects", ["workspaceId", "status"], {
        name: "projects_workspace_status",
        transaction,
      });
      await queryInterface.addIndex("projects", ["teamId"], { name: "projects_team_id", transaction });
      await queryInterface.addIndex("projects", ["ownerMemberId"], {
        name: "projects_owner_member_id",
        transaction,
      });

      await queryInterface.createTable(
        "project_members",
        {
          id: {
            type: Sequelize.UUID,
            primaryKey: true,
            allowNull: false,
            defaultValue: Sequelize.literal("gen_random_uuid()"),
          },
          projectId: { type: Sequelize.UUID, allowNull: false },
          workspaceMemberId: { type: Sequelize.UUID, allowNull: false },
          workspaceId: { type: Sequelize.UUID, allowNull: false },
          addedById: {
            type: Sequelize.UUID,
            allowNull: true,
            references: { model: "users", key: "id" },
            onUpdate: "CASCADE",
            onDelete: "SET NULL",
          },
          createdAt: { type: Sequelize.DATE, allowNull: false },
          updatedAt: { type: Sequelize.DATE, allowNull: false },
        },
        { transaction },
      );

      await q(`ALTER TABLE "project_members"
        ADD CONSTRAINT "project_members_project_fkey"
          FOREIGN KEY ("projectId", "workspaceId") REFERENCES "projects" ("id", "workspaceId")
          ON UPDATE CASCADE ON DELETE CASCADE,
        ADD CONSTRAINT "project_members_workspace_member_fkey"
          FOREIGN KEY ("workspaceMemberId", "workspaceId") REFERENCES "workspace_members" ("id", "workspaceId")
          ON UPDATE CASCADE ON DELETE CASCADE,
        ADD CONSTRAINT "project_members_project_member_key" UNIQUE ("projectId", "workspaceMemberId")`);

      await queryInterface.addIndex("project_members", ["workspaceMemberId"], {
        name: "project_members_workspace_member_id",
        transaction,
      });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable("project_members", { transaction });
      await queryInterface.dropTable("projects", { transaction });
    });
  },
};
