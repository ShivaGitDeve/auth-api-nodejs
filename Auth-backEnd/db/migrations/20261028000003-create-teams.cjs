"use strict";

// Module 3: teams + team_members.
// Naye tables banate hain; existing workspace_members par sirf ek extra UNIQUE (id, workspaceId)
// constraint add hota hai (id pehle se primary key hai, isliye data par koi asar nahi).

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // composite FK (workspaceMemberId, workspaceId) ke liye zaroori
      await queryInterface.addConstraint("workspace_members", {
        fields: ["id", "workspaceId"],
        type: "unique",
        name: "workspace_members_id_workspace_key",
        transaction,
      });

      await queryInterface.createTable(
        "teams",
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
          // app trim + single spaces karke save karta hai; uniqueness lower(name) par
          name: { type: Sequelize.STRING(80), allowNull: false },
          description: { type: Sequelize.TEXT, allowNull: true },
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
      await queryInterface.addConstraint("teams", {
        fields: ["id", "workspaceId"],
        type: "unique",
        name: "teams_id_workspace_key",
        transaction,
      });
      // ek workspace mein ek naam (case-insensitive) sirf ek baar
      await queryInterface.sequelize.query(
        'CREATE UNIQUE INDEX "teams_workspace_name_ci" ON "teams" ("workspaceId", lower("name"))',
        { transaction },
      );

      await queryInterface.createTable(
        "team_members",
        {
          id: {
            type: Sequelize.UUID,
            primaryKey: true,
            allowNull: false,
            defaultValue: Sequelize.literal("gen_random_uuid()"),
          },
          teamId: { type: Sequelize.UUID, allowNull: false },
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

      // team aur workspace member DONO isi workspace ke hone chahiye - DB level guarantee
      await queryInterface.addConstraint("team_members", {
        fields: ["teamId", "workspaceId"],
        type: "foreign key",
        name: "team_members_team_fkey",
        references: { table: "teams", fields: ["id", "workspaceId"] },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
        transaction,
      });
      // workspace se member hata (ya user delete) -> team memberships bhi hat jaati hain
      await queryInterface.addConstraint("team_members", {
        fields: ["workspaceMemberId", "workspaceId"],
        type: "foreign key",
        name: "team_members_workspace_member_fkey",
        references: { table: "workspace_members", fields: ["id", "workspaceId"] },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
        transaction,
      });
      await queryInterface.addConstraint("team_members", {
        fields: ["teamId", "workspaceMemberId"],
        type: "unique",
        name: "team_members_team_member_key",
        transaction,
      });
      await queryInterface.addIndex("team_members", ["workspaceMemberId"], {
        name: "team_members_workspace_member_id",
        transaction,
      });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable("team_members", { transaction });
      await queryInterface.dropTable("teams", { transaction });
      await queryInterface.removeConstraint("workspace_members", "workspace_members_id_workspace_key", {
        transaction,
      });
    });
  },
};
