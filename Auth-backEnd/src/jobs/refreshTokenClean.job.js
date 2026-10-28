import corn from "node-cron";
import { Op } from "sequelize";
import RefreshTokenModel from "../models/refreshToken.model.js";
import logger from "../utils/logger.js";

export const cleanupExpiredRefreshTokens = async () => {
  try {
    const deleted = await RefreshTokenModel.destroy({
      where: {
        expire: {
          [Op.lt]: new Date(),
        },
      },
    });
    logger.info(`Refresh token cleanup: ${deleted} expired token(s) removed`);
    return deleted;
  } catch (error) {
    logger.error(`Refresh token cleanup failed: ${error.message}`);
    return 0;
  }
};

export const startRefreshTokenCleanupJob = () =>
  corn.schedule("0 0 * * *", cleanupExpiredRefreshTokens);

// 0 0 * * *
// │ │ │ │ │
// │ │ │ │ └─ day of week
// │ │ │ └─── month
// │ │ └───── day
// │ └─────── hour
// └───────── minute
