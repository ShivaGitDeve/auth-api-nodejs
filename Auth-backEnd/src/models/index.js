// Saare models aur unke associations ek jagah.
// Naye modules ke models yahin register karo.
import { sequelize } from "../config/db.js";
import User from "./user.model.js";
import RefreshToken from "./refreshToken.model.js";

User.hasMany(RefreshToken, {
  foreignKey: "userId",
  as: "refreshTokens",
  onDelete: "CASCADE",
});
RefreshToken.belongsTo(User, { foreignKey: "userId", as: "user" });

export { sequelize, User, RefreshToken };
