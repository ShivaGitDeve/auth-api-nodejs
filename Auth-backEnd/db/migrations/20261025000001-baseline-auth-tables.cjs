"use strict";

// Baseline: pehle ye tables sequelize.sync() se bante the.
// Existing DB par tables already hain, isliye sirf missing tables create hote hain -
// existing tables aur data ko touch nahi kiya jata.

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = (await queryInterface.showAllTables()).map((t) =>
      typeof t === "string" ? t : t.tableName,
    );

    if (!tables.includes("users")) {
      await queryInterface.createTable("users", {
        id: {
          type: Sequelize.UUID,
          primaryKey: true,
          allowNull: false,
        },
        name: { type: Sequelize.STRING, allowNull: false },
        email: { type: Sequelize.STRING, allowNull: false, unique: true },
        password: { type: Sequelize.STRING, allowNull: false },
        resetPasswordToken: { type: Sequelize.STRING },
        resetPasswordExpires: { type: Sequelize.DATE },
        role: { type: Sequelize.STRING, defaultValue: "user" },
        isActive: { type: Sequelize.BOOLEAN, defaultValue: true },
        createdAt: { type: Sequelize.DATE, allowNull: false },
        updatedAt: { type: Sequelize.DATE, allowNull: false },
      });
    }

    if (!tables.includes("RefreshTokens")) {
      await queryInterface.createTable("RefreshTokens", {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
        token: { type: Sequelize.STRING, allowNull: false },
        userId: { type: Sequelize.UUID, allowNull: false },
        expire: { type: Sequelize.DATE, allowNull: false },
        createdAt: { type: Sequelize.DATE, allowNull: false },
        updatedAt: { type: Sequelize.DATE, allowNull: false },
      });
    }
  },

  async down() {
    // Baseline undo karne ka matlab users table drop karna hota - jaan boojh kar block kiya hai
    throw new Error("Baseline migration is irreversible (it would drop users data).");
  },
};
