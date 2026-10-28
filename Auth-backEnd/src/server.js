import "dotenv/config";
import app from "./app.js";
import { connectToDB } from "./config/db.js";
import { startRefreshTokenCleanupJob } from "./jobs/refreshTokenClean.job.js";

const PORT = process.env.PORT || 5000;

// Schema ab migrations se banta hai (npm run db:migrate), sequelize.sync() se nahi.
// "npm run dev" / "npm start" pending migrations pehle apne aap chala dete hain.
await connectToDB();
startRefreshTokenCleanupJob();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
