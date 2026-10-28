"use strict";

// RefreshTokens.userId -> users.id foreign key (ON DELETE CASCADE) + lookup indexes.
// Koi column ya table drop/alter nahi hota.

const FK_NAME = "RefreshTokens_userId_fkey";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // Deleted users ke bache hue (orphan) refresh tokens FK ko fail kar dete.
      // Ye tokens kisi existing user ke nahi hain, isliye unhe hatana safe hai.
      const [, meta] = await queryInterface.sequelize.query(
        `DELETE FROM "RefreshTokens" rt
         WHERE NOT EXISTS (SELECT 1 FROM "users" u WHERE u."id" = rt."userId")`,
        { transaction },
      );
      const removed = meta?.rowCount ?? 0;
      if (removed) console.log(`Removed ${removed} orphan refresh token(s)`);

      await queryInterface.addConstraint("RefreshTokens", {
        fields: ["userId"],
        type: "foreign key",
        name: FK_NAME,
        references: { table: "users", field: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
        transaction,
      });

      await queryInterface.addIndex("RefreshTokens", ["userId"], {
        name: "refresh_tokens_user_id",
        transaction,
      });
      await queryInterface.addIndex("RefreshTokens", ["token"], {
        name: "refresh_tokens_token",
        transaction,
      });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeIndex("RefreshTokens", "refresh_tokens_token", { transaction });
      await queryInterface.removeIndex("RefreshTokens", "refresh_tokens_user_id", { transaction });
      await queryInterface.removeConstraint("RefreshTokens", FK_NAME, { transaction });
    });
  },
};
