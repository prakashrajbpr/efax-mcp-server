// src/cli.ts

import eFaxProcessor, { ProcessingConfig } from "./processors/eFaxProcessor.js";
import path from "path";
import fs from "fs/promises";
import { program } from "commander";
import chalk from "chalk";

interface CLIOptions {
  output?: string;
  bucket?: string;
  store?: boolean;
  batch?: boolean;
  concurrency?: number;
  stats?: boolean;
  validate?: string;
  confidence?: string;
  config?: string;
  verbose?: boolean;
}

class eFaxCLI {
  private processor: eFaxProcessor;
  private verbose: boolean = false;

  constructor(config: ProcessingConfig, verbose: boolean = false) {
    this.verbose = verbose;
    this.processor = new eFaxProcessor(config);
  }

  private log(level: string, message: string, data?: any) {
    const colors = {
      info: chalk.blue,
      warn: chalk.yellow,
      error: chalk.red,
      debug: chalk.gray
    };

    if (!this.verbose && level === 'debug') return;
    const color = colors[level as keyof typeof colors] || chalk.white;
    console.log(color(`[${level.toUpperCase()}] ${message}`));
    if (data && this.verbose) console.log(chalk.gray(JSON.stringify(data, null, 2)));
  }

  async processSingle(pdfPath: string, options: CLIOptions) {
    const result = await this.processor.processPDF(pdfPath, { filename: path.basename(pdfPath) });
    this.log("info", "Processing complete.");

    console.log(`Success: ${result.success}`);
    console.log(`Confidence: ${result.confidence?.overallConfidence}`);
    console.log(`Review Needed: ${result.needsReview}`);
    console.log(`FHIR Output: ${result.files.fhirOutput ?? "Not saved"}`);
  }

  async processBatch(pdfPaths: string[], options: CLIOptions) {
    const results = await this.processor.processBatch(pdfPaths, options.concurrency || 3);
    this.log("info", "Batch processing complete");

    results.forEach((r, i) => {
      const status = r.success ? chalk.green("✅") : chalk.red("❌");
      console.log(`${status} ${path.basename(pdfPaths[i])} – Confidence: ${r.confidence?.overallConfidence ?? "N/A"}`);
    });
  }

  async showStats() {
    const stats = await this.processor.getStats();
    console.log(chalk.cyan("📊 Stats"));
    console.log(`Processed: ${stats.totalProcessed}`);
    console.log(`High Confidence: ${stats.highConfidence}`);
    console.log(`Medium Confidence: ${stats.mediumConfidence}`);
    console.log(`Low Confidence: ${stats.lowConfidence}`);
    console.log(`Needs Review: ${stats.needsReview}`);
    console.log(`Avg Time: ${stats.avgProcessingTime} ms`);
    console.log(`Success Rate: ${stats.successRate * 100}%`);
    console.log(`Error Rate: ${stats.errorRate * 100}%`);
  }

  async validateFHIR(filePath: string) {
    const raw = await fs.readFile(filePath, "utf8");
    const fhir = JSON.parse(raw);

    console.log(chalk.cyan("🔍 FHIR Validation"));

    const issues: string[] = [];

    if (!fhir.resourceType) {
      issues.push("Missing resourceType");
    }

    if (fhir.resourceType === "Bundle" && (!Array.isArray(fhir.entry) || !fhir.entry.length)) {
      issues.push("Bundle is missing entries or entry is empty");
    }

    if (issues.length) {
      issues.forEach(i => console.log(chalk.red("❌ " + i)));
    } else {
      console.log(chalk.green("✅ FHIR bundle is valid"));
    }
  }

  async showConfidenceReport(filePath: string) {
    const raw = await fs.readFile(filePath, "utf8");
    const report = JSON.parse(raw);

    console.log(chalk.cyan("📊 Confidence Report"));

    console.log(`Confidence Level: ${report.confidence?.overallConfidence ?? "unknown"}`);
    console.log(`Confidence Score: ${report.confidence?.confidenceScore ?? "N/A"}`);
    console.log(`OCR Text Length: ${report.ocrTextLength}`);
    console.log(`Needs Review: ${report.needsReview ? chalk.yellow("YES") : chalk.green("NO")}`);

    if (Array.isArray(report.reviewComments)) {
      console.log("Review Comments:");
      report.reviewComments.forEach((c: string) => console.log("  • " + c));
    }
  }
}

// CLI Definitions
program
  .name("efax-processor")
  .description("eFax to FHIR CLI")
  .version("1.0.0");

program
  .command("process <pdfPath>")
  .description("Process a single eFax PDF file")
  .option("-o, --output <dir>", "Output directory", "./output")
  .option("-b, --bucket <name>", "GCS bucket name", "efax-docs-bucket")
  .option("-s, --store", "Store intermediate files", false)
  .option("-v, --verbose", "Verbose logging", false)
  .action(async (pdfPath, options: CLIOptions) => {
    const config: ProcessingConfig = {
      bucketName: options.bucket!,
      storeData: !!options.store,
      outputDir: options.output!
    };

    const cli = new eFaxCLI(config, options.verbose);
    await cli.processSingle(pdfPath, options);
  });

program
  .command("batch <pdfPaths...>")
  .description("Batch process multiple eFax PDFs")
  .option("-o, --output <dir>", "Output directory", "./output")
  .option("-b, --bucket <name>", "GCS bucket name", "efax-docs-bucket")
  .option("-c, --concurrency <n>", "Concurrency level", "3")
  .option("-s, --store", "Store intermediate files", false)
  .option("-v, --verbose", "Verbose logging", false)
  .action(async (pdfPaths: string[], options: CLIOptions) => {
    const config: ProcessingConfig = {
      bucketName: options.bucket!,
      storeData: !!options.store,
      outputDir: options.output!
    };

    const cli = new eFaxCLI(config, options.verbose);
    await cli.processBatch(pdfPaths, options);
  });

program
  .command("stats")
  .description("Show processor statistics")
  .action(async () => {
    const cli = new eFaxCLI({
      bucketName: "efax-docs-bucket",
      storeData: false,
      outputDir: "./output"
    });
    await cli.showStats();
  });

program
  .command("validate <filePath>")
  .description("Validate FHIR bundle")
  .action(async (filePath: string) => {
    const cli = new eFaxCLI({
      bucketName: "efax-docs-bucket",
      storeData: false,
      outputDir: "./output"
    });
    await cli.validateFHIR(filePath);
  });

program
  .command("report <filePath>")
  .description("Show detailed confidence report")
  .action(async (filePath: string) => {
    const cli = new eFaxCLI({
      bucketName: "efax-docs-bucket",
      storeData: false,
      outputDir: "./output"
    });
    await cli.showConfidenceReport(filePath);
  });

program.parse();
