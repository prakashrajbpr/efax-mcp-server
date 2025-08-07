import path from "path";
import { extractTextFromPdf } from "../google-ocr.js"; // ✅ Must use `.js` extension for ESM
import { fileURLToPath } from "url";

// Simulate CommonJS __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testOCR() {
  const filePath = path.join(__dirname, "../../tests/test-files/Filled_Sample 42.pdf"); // ✅ Replace with .png or .jpg if needed

  try {
    console.log("📂 Reading file:", filePath);
    const text = await extractTextFromPdf(filePath);
    
    if (text && text.trim()) {
      console.log("✅ Extracted Text:\n\n" + text);
    } else {
      console.warn("⚠️ No text extracted. The file may be empty, blurry, or unsupported.");
    }
  } catch (err) {
    console.error("❌ OCR extraction failed:", err);
  }
}

testOCR();
