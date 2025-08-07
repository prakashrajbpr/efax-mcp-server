import { Storage } from "@google-cloud/storage";

const storage = new Storage();

/**
 * Upload a file to GCS
 */
async function uploadToGCS(bucketName: string, localFilePath: string): Promise<string> {
  const destination = localFilePath.split("\\").pop(); // Or use path.basename
  await storage.bucket(bucketName).upload(localFilePath, {
    destination,
  });
  console.log(`✅ Uploaded ${localFilePath} to gs://${bucketName}/${destination}`);
  return `gs://${bucketName}/${destination}`;
}

/**
 * Delete uploaded PDF and its OCR output from GCS
 */
async function deleteUploadedFilesFromGCS(bucketName: string, inputUri: string, outputPrefix: string) {
  try {
    const inputFilePath = inputUri.replace(`gs://${bucketName}/`, "");
    await storage.bucket(bucketName).file(inputFilePath).delete();
    console.log(`✅ Deleted uploaded file: ${inputFilePath}`);

    const [files] = await storage.bucket(bucketName).getFiles({
      prefix: outputPrefix,
    });

    for (const file of files) {
      await file.delete();
      console.log(`✅ Deleted output file: ${file.name}`);
    }

  } catch (error: any) {
    console.error("❌ Failed to delete files from GCS:", error.message);
  }
}

// ✅ Export both cleanly (ONLY ONCE)
export { uploadToGCS, deleteUploadedFilesFromGCS };
