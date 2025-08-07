// src/app.ts
import express from "express";
import { authenticate } from "./middleware/authenticate.js";
import { handleUploadRoute } from "./routes/upload.js";

const app = express();
app.use(express.json());

app.post("/api/upload", authenticate, handleUploadRoute);

app.listen(3000, () => {
  console.log("MCP server listening on port 3000");
});
