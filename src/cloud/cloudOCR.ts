import vision from "@google-cloud/vision";
import { protos } from "@google-cloud/vision";
import path from "path";

const client = new vision.ImageAnnotatorClient({
  keyFilename: path.resolve("gcp-key.json"),
});

export async function extractTextFromPdfInCloud(
  gcsInputUri: string,
  gcsOutputUri: string
): Promise<void> {
  const request: protos.google.cloud.vision.v1.IAsyncBatchAnnotateFilesRequest = {
    requests: [
      {
        inputConfig: {
          gcsSource: {
            uri: gcsInputUri,
          },
          mimeType: "application/pdf",
        },
        features: [
          {
            type: protos.google.cloud.vision.v1.Feature.Type.DOCUMENT_TEXT_DETECTION,
          },
        ],
        outputConfig: {
          gcsDestination: {
            uri: gcsOutputUri,
          },
          batchSize: 1,
        },
      },
    ],
  };

  console.log("📤 Sending PDF to Google Cloud Vision API...");

  const [operation] = await client.asyncBatchAnnotateFiles(request);
  console.log("⏳ Waiting for OCR operation to complete...");
  await operation.promise();

  console.log("✅ OCR completed. Output written to:", gcsOutputUri);
}
