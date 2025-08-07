// src/utils/file-utils.ts
import fs from 'fs/promises';
import path from 'path';

export interface FileInfo {
  name: string;
  extension: string;
  size: number;
  mimeType?: string;
  lastModified: Date;
}

export class FileUtils {
  static async getFileInfo(filePath: string): Promise<FileInfo> {
    const stats = await fs.stat(filePath);
    const parsedPath = path.parse(filePath);
    
    return {
      name: parsedPath.name,
      extension: parsedPath.ext,
      size: stats.size,
      lastModified: stats.mtime
    };
  }

  static formatFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  static async readJsonFile(filePath: string): Promise<any> {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  }

  static async writeJsonFile(filePath: string, data: any): Promise<void> {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  }
}

// src/utils/document-validator.ts
export interface ValidationResult {
  isValid: boolean;
  score: number;
  errors: string[];
  warnings?: string[];
}

export class DocumentValidator {
  static validateEfaxDocument(document: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let score = 100;

    // Basic FHIR validation
    if (!document.resourceType) {
      errors.push("Missing resourceType");
      score -= 30;
    }

    if (!document.id) {
      errors.push("Missing document ID");
      score -= 20;
    }

    if (document.resourceType === 'Bundle') {
      if (!document.entry || !Array.isArray(document.entry)) {
        errors.push("Bundle missing entry array");
        score -= 25;
      } else {
        // Validate bundle entries
        document.entry.forEach((entry: any, index: number) => {
          if (!entry.resource || !entry.resource.resourceType) {
            errors.push(`Entry ${index + 1} missing resource or resourceType`);
            score -= 10;
          }
        });
        
        if (document.entry.length === 0) {
          warnings.push("Bundle has no entries");
          score -= 5;
        }
      }
    }

    // Check for required FHIR fields
    if (document.resourceType === 'Bundle' && !document.type) {
      warnings.push("Bundle missing type field");
      score -= 5;
    }

    if (!document.timestamp && document.resourceType === 'Bundle') {
      warnings.push("Bundle missing timestamp");
      score -= 5;
    }

    return {
      isValid: errors.length === 0,
      score: Math.max(0, score),
      errors,
      warnings
    };
  }

  static generateValidationReport(validation: ValidationResult): string {
    let report = "📋 Validation Report\n\n";
    report += `Score: ${validation.score}/100\n`;
    report += `Status: ${validation.isValid ? '✅ Valid' : '❌ Invalid'}\n\n`;
    
    if (validation.errors.length > 0) {
      report += "❌ Errors:\n";
      validation.errors.forEach(error => {
        report += `  • ${error}\n`;
      });
    }

    if (validation.warnings && validation.warnings.length > 0) {
      report += "\n⚠️ Warnings:\n";
      validation.warnings.forEach(warning => {
        report += `  • ${warning}\n`;
      });
    }

    return report;
  }
}