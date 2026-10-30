"use strict";

// Module 1: workspaces + workspace_members.
// Sirf naye tables banta hai - existing users / RefreshTokens ko touch nahi karta.

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        "workspaces",
        {
          id: {
            type: Sequelize.UUID,
            primaryKey: true,
            allowNull: false,
            defaultValue: Sequelize.literal("gen_random_uuid()"),
          },
          name: { type: Sequelize.STRING(80), allowNull: false },
          slug: { type: Sequelize.STRING(60), allowNull: false },
          description: { type: Sequelize.TEXT, allowNull: true },
          createdById: {
            type: Sequelize.UUID,
            allowNull: true,
            references: { model: "users", key: "id" },
            onUpdate: "CASCADE",
            // creator ka account delete ho to workspace bachta hai, sirf reference hat jata hai
            onDelete: "SET NULL",
          },
          createdAt: { type: Sequelize.DATE, allowNull: false },
          updatedAt: { type: Sequelize.DATE, allowNull: false },
        },
        { transaction },
      );
      await queryInterface.addConstraint("workspaces", {
        fields: ["slug"],
        type: "unique",
        name: "workspaces_slug_key",
        transaction,
      });
      await queryInterface.addIndex("workspaces", ["createdById"], {
        name: "workspaces_created_by_id",
        transaction,
      });

      await queryInterface.createTable(
        "workspace_members",
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
          userId: {
            type: Sequelize.UUID,
            allowNull: false,
            references: { model: "users", key: "id" },
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
          },
          role: {
            type: Sequelize.STRING(20),
            allowNull: false,
            defaultValue: "member",
          },
          createdAt: { type: Sequelize.DATE, allowNull: false },
          updatedAt: { type: Sequelize.DATE, allowNull: false },
        },
        { transaction },
      );
      await queryInterface.addConstraint("workspace_members", {
        fields: ["role"],
        type: "check",
        name: "workspace_members_role_check",
        where: { role: ["owner", "admin", "member"] },
        transaction,
      });
      // ek user ek workspace mein sirf ek baar
      await queryInterface.addConstraint("workspace_members", {
        fields: ["workspaceId", "userId"],
        type: "unique",
        name: "workspace_members_workspace_user_key",
        transaction,
      });
      await queryInterface.addIndex("workspace_members", ["userId"], {
        name: "workspace_members_user_id",
        transaction,
      });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable("workspace_members", { transaction });
      await queryInterface.dropTable("workspaces", { transaction });
    });
  },
};
