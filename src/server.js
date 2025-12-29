import "dotenv/config";
import app from "./app.js";
import { connectToDB, sequelize } from "./config/db.js";

const PORT = process.env.PORT || 5000;

await connectToDB();
sequelize.sync()

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
