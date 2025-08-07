// routes/upload.ts
import { uploadToGCS, deleteUploadedFilesFromGCS } from "../cloud/uploadToGCS.js";
import { extractTextFromPdfInCloud } from "../cloud/cloudOCR.js";

export async function handleUploadRoute(req, res) {
  const { storeData } = res.locals.customerConfig;
  const filePath = req.body.filePath; // assumes you're sending local path

  const bucketName = "efax-docs-bucket";
  const outputPrefix = "ocr-output/";

  let gcsInputUri;

  try {
    if (storeData) {
      gcsInputUri = await uploadToGCS(bucketName, filePath);
    } else {
      console.log("Skipping upload: storeData is false");
      gcsInputUri = `gs://${bucketName}/temp/${Date.now()}-temp.pdf`; // temporary dummy path for OCR
    }

    const gcsOutputUri = `gs://${bucketName}/${outputPrefix}`;
    const ocrResult = await extractTextFromPdfInCloud(gcsInputUri, gcsOutputUri);

    if (!storeData) {
      await deleteUploadedFilesFromGCS(bucketName, gcsInputUri, outputPrefix);
    }

    res.json({ message: "OCR completed", fhir: ocrResult });

  } catch (error) {
    console.error("Error processing upload:", error);
    res.status(500).json({ error: "OCR failed", detail: error.message });
  }
}
