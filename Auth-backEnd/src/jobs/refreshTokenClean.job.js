import corn from "node-cron";
import RefreshTokenModel from "../models/refreshToken.model.js";

corn.schedule("0 0 * * *", async () => {
  try {
    await RefreshTokenModel.destroy({
      where: {
        expire: {
          [Op.lt]: new Date(),
        },
      },
    });
  } catch (error) {
    console.log("Refresh token cleanup failed", error);
  }
});



// 0 0 * * *
// │ │ │ │ │
// │ │ │ │ └─ day of week
// │ │ │ └─── month
// │ │ └───── day
// │ └─────── hour
// └───────── minute
