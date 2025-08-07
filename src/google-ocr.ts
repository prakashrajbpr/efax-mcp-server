// src/google-ocr.ts
import vision from "@google-cloud/vision";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { convertPdfToImage } from "./fhir/convertPdfToImage.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = new vision.ImageAnnotatorClient({
  keyFilename: path.join(__dirname, "../gcp-key.json"),
});

export async function extractTextFromPdf(filePath: string): Promise<string> {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === ".png" || ext === ".jpg" || ext === ".jpeg") {
    const [result] = await client.textDetection(filePath);
    return result.fullTextAnnotation?.text || "";
  }

  if (ext === ".pdf") {
    const imagePath = await convertPdfToImage(filePath);
    const [result] = await client.textDetection(imagePath);
    return result.fullTextAnnotation?.text || "";
  }

  throw new Error("Unsupported file format: " + ext);
}
