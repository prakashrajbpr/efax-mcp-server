import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";
import dotenv from 'dotenv';
const localPdfPath = "C:/Users/praka/efax-mcp-server/tests/test-files/Filled_Sample 42.pdf";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
console.log("✅ Current __dirname:", __dirname);

// Type definitions
interface FHIRWithConfidence {
  confidence?: {
    overallConfidence?: string;
  };
  needsReview?: boolean;
  fhirBundle?: any;
  resources?: any;
  data?: any;
  [key: string]: any; // Allow additional properties
}

interface OCRResponse {
  responses: Array<{
    fullTextAnnotation?: {
      text: string;
    };
    textAnnotations?: Array<{
      description: string;
      boundingPoly?: {
        vertices: Array<{
          x?: number;
          y?: number;
        }>;
      };
    }>;
  }>;
}

// IMMEDIATE DEBUG OUTPUT
console.log("🚀 ENHANCED TYPESCRIPT SCRIPT STARTING - Full Text Analysis Mode");
console.log("📅 Timestamp:", new Date().toISOString());
console.log("🖥️  Node version:", process.version);
console.log("📁 Current directory:", process.cwd());



// Load environment
dotenv.config();
console.log("🔧 Environment loaded");

// Get script paths
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);


// Set Google Cloud credentials BEFORE any imports
const gcpKeyPath = "./gcp-key.json";  // Relative to root folder
const absoluteGcpPath = path.resolve(process.cwd(), gcpKeyPath);
process.env.GOOGLE_APPLICATION_CREDENTIALS = absoluteGcpPath;
console.log("🔑 Google Cloud credentials set to:", absoluteGcpPath);
console.log("📁 Working directory:", process.cwd());
console.log("📍 Relative path used:", gcpKeyPath);

// Verify the credentials file exists and is readable
try {
  await fs.access(absoluteGcpPath, fs.constants.R_OK);
  console.log("✅ GCP key file found and readable");
  
  // Verify it's valid JSON
  const keyContent = await fs.readFile(absoluteGcpPath, 'utf-8');
  const keyData = JSON.parse(keyContent);
  console.log("✅ GCP key file is valid JSON");
  console.log(`🔍 Service account email: ${keyData.client_email || 'Not found'}`);
  console.log(`🔍 Project ID: ${keyData.project_id || 'Not found'}`);
  
} catch (error: any) {
  console.error("❌ GCP key file issue:", error.message);
  console.error("💡 Please check:");
  console.error("   1. File exists at:", absoluteGcpPath);
  console.error("   2. File is readable");
  console.error("   3. File contains valid JSON");
  console.error("📂 Current directory contents:");
  try {
    const files = await fs.readdir(process.cwd());
    console.error("   ", files.filter(f => f.endsWith('.json')).join(', '));
  } catch {}
  process.exit(1);
}

// Function to parse and display form fields
function parseFormFields(text: string): void {
  console.log("\n" + "=".repeat(80));
  console.log("📋 PARSING EXTRACTED FORM FIELDS");
  console.log("=".repeat(80));
  
  // Split text into lines and analyze
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  console.log(`📄 Total lines found: ${lines.length}\n`);
  
  // Look for common form patterns
  const formPatterns = [
    /patient\s*name/i,
    /first\s*name/i,
    /last\s*name/i,
    /date\s*of\s*birth/i,
    /dob/i,
    /phone/i,
    /address/i,
    /insurance/i,
    /diagnosis/i,
    /referring\s*physician/i,
    /date\s*of\s*request/i,
    /medical\s*record/i,
    /mrn/i,
    /ssn/i,
    /social\s*security/i,
    /email/i,
    /gender/i,
    /sex/i,
    /race/i,
    /ethnicity/i
  ];
  
  // Display all text first
  console.log("📝 FULL EXTRACTED TEXT:");
  console.log("-".repeat(60));
  console.log(text);
  console.log("-".repeat(60));
  
  // Analyze line by line
  console.log("\n📊 LINE-BY-LINE ANALYSIS:");
  lines.forEach((line, index) => {
    const lineNumber = String(index + 1).padStart(3, ' ');
    console.log(`${lineNumber}: ${line}`);
    
    // Check if this line matches any form pattern
    const matches = formPatterns.filter(pattern => pattern.test(line));
    if (matches.length > 0) {
      console.log(`     ⭐ Potential form field detected`);
    }
  });
  
  // Try to extract key-value pairs
  console.log("\n🔍 ATTEMPTING TO EXTRACT FORM FIELDS:");
  const extractedFields: Record<string, string> = {};
  
  // Look for patterns like "Field Name: Value" or "Field Name Value"
  lines.forEach(line => {
    // Pattern 1: "Label: Value"
    const colonMatch = line.match(/^(.+?):\s*(.+)$/);
    if (colonMatch) {
      const [, label, value] = colonMatch;
      if (value.trim().length > 0) {
        extractedFields[label.trim()] = value.trim();
      }
    }
    
    // Pattern 2: Look for dates in various formats
    const dateMatch = line.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
    if (dateMatch) {
      extractedFields[`Date_found_in: "${line}"`] = dateMatch[1];
    }
    
    // Pattern 3: Look for phone numbers
    const phoneMatch = line.match(/(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/);
    if (phoneMatch) {
      extractedFields[`Phone_found_in: "${line}"`] = phoneMatch[1];
    }
    
    // Pattern 4: Look for potential names (2+ words starting with capital letters)
    const nameMatch = line.match(/^([A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)$/);
    if (nameMatch && line.length < 50) {
      extractedFields[`Potential_name: "${line}"`] = nameMatch[1];
    }
  });
  
  if (Object.keys(extractedFields).length > 0) {
    console.log("\n✅ EXTRACTED FIELDS:");
    Object.entries(extractedFields).forEach(([key, value]) => {
      console.log(`   🏷️  ${key}: ${value}`);
    });
  } else {
    console.log("\n⚠️  No clear field patterns detected. This might be a more complex form layout.");
  }
  
  // Look for checkbox/selection indicators
  console.log("\n☑️  LOOKING FOR CHECKBOXES/SELECTIONS:");
  const checkboxPatterns = [
    /\[x\]/i,
    /\[✓\]/i,
    /☑/,
    /✓/,
    /checked/i,
    /selected/i,
    /yes\s*$/i,
    /no\s*$/i
  ];
  
  lines.forEach((line, index) => {
    checkboxPatterns.forEach(pattern => {
      if (pattern.test(line)) {
        console.log(`   📋 Line ${index + 1}: ${line}`);
      }
    });
  });
}

// Function to safely explore object structure
function exploreObjectStructure(obj: any, name: string, maxDepth: number = 3, currentDepth: number = 0): void {
  if (currentDepth >= maxDepth || obj === null || typeof obj !== 'object') {
    return;
  }
  
  console.log(`${'  '.repeat(currentDepth)}🔍 ${name} (${typeof obj}):`);
  
  if (Array.isArray(obj)) {
    console.log(`${'  '.repeat(currentDepth)}   📚 Array with ${obj.length} items`);
    if (obj.length > 0) {
      console.log(`${'  '.repeat(currentDepth)}   📝 First item type: ${typeof obj[0]}`);
      if (currentDepth < maxDepth - 1) {
        exploreObjectStructure(obj[0], `${name}[0]`, maxDepth, currentDepth + 1);
      }
    }
  } else {
    const keys = Object.keys(obj);
    console.log(`${'  '.repeat(currentDepth)}   🔑 Keys: [${keys.join(', ')}]`);
    
    // Show some key-value pairs
    keys.slice(0, 5).forEach(key => {
      const value = obj[key];
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        const displayValue = typeof value === 'string' && value.length > 50 
          ? value.substring(0, 50) + '...' 
          : String(value);
        console.log(`${'  '.repeat(currentDepth)}     ${key}: ${displayValue}`);
      } else if (value !== null && typeof value === 'object') {
        if (currentDepth < maxDepth - 1) {
          exploreObjectStructure(value, `${name}.${key}`, maxDepth, currentDepth + 1);
        }
      }
    });
    
    if (keys.length > 5) {
      console.log(`${'  '.repeat(currentDepth)}   ... and ${keys.length - 5} more keys`);
    }
  }
}

// Now run the enhanced pipeline
async function main(): Promise<void> {
  try {
    const CONFIG = {
      bucketName: "efax-docs-bucket",
      localPdfPath: path.join(__dirname, "../../tests/test-files/Filled_Sample 42.pdf"),
      outputPrefix: "ocr-output/",
      storeData: false,
    };

    console.log("⚙️ Configuration:");
    console.log("  - Bucket:", CONFIG.bucketName);
    console.log("  - PDF path:", CONFIG.localPdfPath);
    console.log("  - PDF exists:", await fs.access(CONFIG.localPdfPath).then(() => true).catch(() => false));
    console.log("  - GCP credentials:", process.env.GOOGLE_APPLICATION_CREDENTIALS);

    // Test Google Cloud authentication before proceeding
    console.log("\n🔐 Testing Google Cloud authentication...");
    try {
      const { Storage } = await import("@google-cloud/storage");
      const testStorage = new Storage();
      console.log("🔄 Attempting to authenticate with Google Cloud...");
      
      // Instead of listing all buckets, just check if our target bucket is accessible
      console.log(`🔍 Checking access to bucket: ${CONFIG.bucketName}`);
      const bucket = testStorage.bucket(CONFIG.bucketName);
      const [exists] = await bucket.exists();
      
      if (exists) {
        console.log(`✅ Target bucket '${CONFIG.bucketName}' exists and is accessible`);
      } else {
        console.log(`⚠️  Target bucket '${CONFIG.bucketName}' does not exist`);
        console.log("🔨 Attempting to create bucket...");
        try {
          await testStorage.createBucket(CONFIG.bucketName, {
            location: 'US', // or your preferred location
            storageClass: 'STANDARD'
          });
          console.log(`✅ Created bucket '${CONFIG.bucketName}'`);
        } catch (createError: any) {
          console.error("❌ Failed to create bucket:", createError.message);
          console.error("💡 You may need to create the bucket manually in Google Cloud Console");
        }
      }
      
      console.log("✅ Google Cloud authentication successful");
      
    } catch (authError: any) {
      console.error("❌ Google Cloud authentication failed:", authError.message);
      console.error("📍 Error code:", authError.code);
      
      if (authError.code === 403) {
        console.error("🔐 Permission denied. Your service account needs these roles:");
        console.error("   - Storage Admin (roles/storage.admin)");
        console.error("   - Cloud Vision API User (roles/ml.vision.apiUser)");
        console.error("💡 Add permissions in Google Cloud Console:");
        console.error("   1. Go to IAM & Admin → IAM");
        console.error("   2. Find: latest@refine-rx.iam.gserviceaccount.com");
        console.error("   3. Click Edit and add the required roles");
      } else {
        console.error("💡 Other possible solutions:");
        console.error("   1. Verify billing is enabled for the project");
        console.error("   2. Enable Cloud Storage API");
        console.error("   3. Enable Cloud Vision API");
      }
      throw authError;
    }

    // Import all functions with proper typing
    const { uploadToGCS } = await import("../cloud/uploadToGCS.js") as { uploadToGCS: (bucket: string, path: string) => Promise<string> };
    const { extractTextFromPdfInCloud } = await import("../cloud/cloudOCR.js") as { extractTextFromPdfInCloud: (input: string, output: string) => Promise<void> };
    const { mapToFHIR } = await import("../llm/mapToFHIR.js") as { mapToFHIR: (text: string) => Promise<FHIRWithConfidence> };

    console.log("\n📤 Step 1: Testing PDF upload...");
    const gcsInputUri: string = await uploadToGCS(CONFIG.bucketName, CONFIG.localPdfPath);
    console.log(`✅ Upload successful: ${gcsInputUri}`);

    console.log("\n🧠 Step 2: Testing OCR...");
    const gcsOutputUri = `gs://${CONFIG.bucketName}/${CONFIG.outputPrefix}`;
    await extractTextFromPdfInCloud(gcsInputUri, gcsOutputUri);
    console.log("✅ OCR request sent successfully");

    console.log("\n⏳ Waiting 10 seconds for OCR to complete...");
    await new Promise(resolve => setTimeout(resolve, 10000));

    console.log("\n📖 Step 3: Extracting and analyzing full text...");
    const { Storage } = await import("@google-cloud/storage");
    // Credentials already set above, but ensure they're still set
    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      process.env.GOOGLE_APPLICATION_CREDENTIALS = absoluteGcpPath;
    }
    const storage = new Storage();
    console.log("✅ Google Cloud Storage client initialized");
    const [files] = await storage.bucket(CONFIG.bucketName).getFiles({ prefix: CONFIG.outputPrefix });
    console.log(`Found ${files.length} output files`);

    if (files.length > 0) {
      console.log("📄 Output files:");
      files.forEach(file => console.log(`  - ${file.name}`));
      
      // Try to read all JSON files
      const jsonFiles = files.filter(f => f.name.endsWith('.json'));
      if (jsonFiles.length > 0) {
        let allText = "";
        
        for (const file of jsonFiles) {
          console.log(`\n📋 Reading ${file.name}...`);
          const tempFile = path.join(__dirname, `temp-${Date.now()}.json`);
          await file.download({ destination: tempFile });
          const content = await fs.readFile(tempFile, "utf-8");
          const json: OCRResponse = JSON.parse(content);
          
          const text = json.responses?.[0]?.fullTextAnnotation?.text || "";
          if (text) {
            allText += text + "\n";
          }
          
          // Also check individual text annotations for more detailed extraction
          const annotations = json.responses?.[0]?.textAnnotations || [];
          console.log(`📊 Found ${annotations.length} text annotations`);
          
          if (annotations.length > 1) {
            console.log("\n🔍 INDIVIDUAL TEXT ELEMENTS:");
            annotations.slice(1, 21).forEach((annotation, idx) => {
              if (annotation.description && annotation.description.trim()) {
                const bounds = annotation.boundingPoly?.vertices || [];
                const x = bounds[0]?.x || 0;
                const y = bounds[0]?.y || 0;
                console.log(`   ${String(idx + 1).padStart(2, '0')}: "${annotation.description}" (x:${x}, y:${y})`);
              }
            });
            
            if (annotations.length > 21) {
              console.log(`   ... and ${annotations.length - 21} more elements`);
            }
          }
          
          await fs.unlink(tempFile).catch(() => {});
        }
        
        if (allText.length > 0) {
          console.log(`\n✅ Total extracted text: ${allText.length} characters`);
          
          // Parse the form fields
          parseFormFields(allText);
          
          // Test FHIR mapping with full text
          console.log("\n🤖 Step 4: Testing FHIR mapping with full text...");
          try {
            const fhirResult: FHIRWithConfidence = await mapToFHIR(allText);
            console.log("✅ FHIR mapping completed");
            console.log(`📊 Confidence: ${fhirResult.confidence?.overallConfidence || 'unknown'}`);
            console.log(`🔍 Needs review: ${fhirResult.needsReview ? 'YES' : 'NO'}`);
            
            // Display complete FHIR result structure
            console.log("\n📋 COMPLETE FHIR RESULT STRUCTURE:");
            console.log("🔍 Available properties:", Object.keys(fhirResult));
            
            // Explore the structure safely
            exploreObjectStructure(fhirResult, "fhirResult");
            
            // Display full result as JSON for complete visibility
            console.log("\n📄 COMPLETE FHIR RESULT (JSON):");
            console.log(JSON.stringify(fhirResult, null, 2));
            
          } catch (fhirError: any) {
            console.error("❌ FHIR mapping failed:", fhirError.message);
            console.error("🔍 Error details:", fhirError);
          }
        }
      }
    }

    console.log("\n🧹 Cleaning up test files...");
    for (const file of files) {
      await file.delete().catch(() => {});
    }
    // Delete uploaded PDF
    await storage.bucket(CONFIG.bucketName).file(path.basename(CONFIG.localPdfPath)).delete().catch(() => {});

    console.log("\n🎉 ENHANCED TYPESCRIPT PIPELINE TEST COMPLETED!");

  } catch (error: any) {
    console.error("\n💥 PIPELINE ERROR:");
    console.error("Message:", error.message);
    console.error("Stack:", error.stack);
    
    if (error.response) {
      console.error("HTTP Status:", error.response.status);
      console.error("Response data:", error.response.data);
    }
  }
}

console.log("\n🏁 Enhanced TypeScript debug script completed at:", new Date().toISOString());

// Run the main function
main().catch(console.error);