import fs from "fs/promises";
import path from "path";
import { fromPath } from "pdf2pic";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function convertPdfToImage(pdfPath: string): Promise<string> {
  const outputDir = path.join(__dirname, "../../temp");
  const outputFile = path.join(outputDir, "page1.png");

  console.log("🔧 Converting PDF to PNG...");
  console.log("PDF path:", pdfPath);
  console.log("Expected output:", outputFile);

  await fs.mkdir(outputDir, { recursive: true });

  const converter = fromPath(pdfPath, {
    density: 300,
    saveFilename: "page1",
    savePath: outputDir,
    format: "png",
    width: 1654,
    height: 2339,
  });

  const result = await converter(1); // convert first page
  console.log("📄 Conversion result:", result);

  try {
    await fs.access(outputFile);
    console.log("✅ PNG file exists:", outputFile);
  } catch {
    throw new Error("❌ PDF to PNG conversion failed: output file not found.");
  }

  return outputFile;
}
