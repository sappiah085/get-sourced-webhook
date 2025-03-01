import httpServer from "./app.js";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Derive __dirname in ES module context
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from dotenv file
dotenv.config({ path: path.join(__dirname, "./config.env") });
//hosting a server
const PORT = process.env.PORT ?? 4000;
httpServer.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
