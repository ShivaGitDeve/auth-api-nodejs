import "dotenv/config";
import app from "./App.js";
import { connectToDB } from "./config/db.js";

const PORT = process.env.PORT || 5000;

await connectToDB();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
