"use strict";

// Module 2: workspace_invitations.
// Sirf naya table banta hai - existing tables / data touch nahi hote.

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        "workspace_invitations",
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
          // hamesha lowercase + trimmed
          email: { type: Sequelize.STRING(255), allowNull: false },
          role: { type: Sequelize.STRING(20), allowNull: false, defaultValue: "member" },
          invitedById: {
            type: Sequelize.UUID,
            allowNull: true,
            references: { model: "users", key: "id" },
            onUpdate: "CASCADE",
            onDelete: "SET NULL",
          },
          // sirf SHA-256 hash - raw token kabhi store nahi hota
          tokenHash: { type: Sequelize.STRING(64), allowNull: false },
          expiresAt: { type: Sequelize.DATE, allowNull: false },
          status: { type: Sequelize.STRING(20), allowNull: false, defaultValue: "pending" },
          acceptedAt: { type: Sequelize.DATE, allowNull: true },
          acceptedById: {
            type: Sequelize.UUID,
            allowNull: true,
            references: { model: "users", key: "id" },
            onUpdate: "CASCADE",
            onDelete: "SET NULL",
          },
          revokedAt: { type: Sequelize.DATE, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false },
          updatedAt: { type: Sequelize.DATE, allowNull: false },
        },
        { transaction },
      );

      // invitation se kabhi owner nahi milta
      await queryInterface.addConstraint("workspace_invitations", {
        fields: ["role"],
        type: "check",
        name: "workspace_invitations_role_check",
        where: { role: ["admin", "member"] },
        transaction,
      });
      await queryInterface.addConstraint("workspace_invitations", {
        fields: ["status"],
        type: "check",
        name: "workspace_invitations_status_check",
        where: { status: ["pending", "accepted", "revoked", "expired"] },
        transaction,
      });
      await queryInterface.addConstraint("workspace_invitations", {
        fields: ["tokenHash"],
        type: "unique",
        name: "workspace_invitations_token_hash_key",
        transaction,
      });
      // ek workspace mein ek email ki sirf ek pending invitation
      await queryInterface.addIndex("workspace_invitations", ["workspaceId", "email"], {
        name: "workspace_invitations_one_pending",
        unique: true,
        where: { status: "pending" },
        transaction,
      });
      await queryInterface.addIndex("workspace_invitations", ["workspaceId", "status"], {
        name: "workspace_invitations_workspace_status",
        transaction,
      });
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("workspace_invitations");
  },
};
