// src/routes/process.ts
import express from "express";
import multer from "multer";
import path from "path";
// import fs from "fs";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const filePath = path.resolve(req.file.path);

  return res.status(200).json({
    message: "✅ File uploaded successfully",
    originalName: req.file.originalname,
    path: filePath,
  });
});

export default router;
