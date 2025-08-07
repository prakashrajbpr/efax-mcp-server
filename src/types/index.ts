// src/types/index.ts
export interface EfaxDocument {
  id: string;
  filename: string;
  content: Buffer | string;
  contentType: string;
  size: number;
  metadata: {
    source?: string;
    uploadedAt: Date;
    processedAt?: Date;
    originalFilename?: string;
    [key: string]: any;
  };
}

export interface ProcessingResult {
  success: boolean;
  document?: EfaxDocument;
  fhirBundle?: any;
  confidence?: ConfidenceMetrics;
  processingTime: number;
  ocrTextLength: number;
  needsReview: boolean;
  reviewComments: string[];
  files?: {
    fhirOutput?: string;
    confidenceReport?: string;
    rawOcrText?: string;
  };
  errors?: string[];
}

export interface ProcessingOptions {
  storeData?: boolean;
  outputFormat?: 'fhir' | 'hl7' | 'json';
  quality?: 'high' | 'medium' | 'low';
  ocrTimeout?: number;
  maxRetries?: number;
  metadata?: Record<string, any>;
}

export interface BatchProcessingResult {
  results: ProcessingResult[];
  summary: {
    total: number;
    successful: number;
    failed: number;
    needsReview: number;
    avgConfidence: number;
    totalProcessingTime: number;
  };
}

export interface ConfidenceMetrics {
  overallConfidence: 'high' | 'medium' | 'low';
  confidenceScore: number; // 0-100
  flaggedFields: string[];
  ocrQualityScore: number;
  parsingIssues: string[];
  missingCriticalFields: string[];
}

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
}

// Document format specific interfaces
export interface PDFInfo {
  pages: number;
  size: number;
  version?: string;
  encrypted?: boolean;
  metadata?: {
    title?: string;
    author?: string;
    creator?: string;
    creationDate?: Date;
  };
}

export interface TIFFInfo {
  width: number;
  height: number;
  pages: number;
  compression?: string;
  colorSpace?: string;
  resolution?: {
    x: number;
    y: number;
    unit: string;
  };
}

export interface OCRResult {
  text: string;
  confidence: number;
  boundingBoxes?: Array<{
    text: string;
    confidence: number;
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
  language?: string;
}

export interface DocumentSection {
  type: 'header' | 'body' | 'footer' | 'table' | 'form' | 'signature';
  content: string;
  confidence: number;
  position?: {
    page: number;
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

// Server and routing types
export interface ServerConfig {
  port: number;
  host: string;
  cors?: {
    origin: string | string[];
    credentials: boolean;
  };
  rateLimit?: {
    windowMs: number;
    max: number;
  };
}

export interface UploadConfig {
  maxFileSize: number;
  allowedMimeTypes: string[];
  destination: string;
}

// Error types
export interface ProcessingError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
  recoverable: boolean;
}

// Authentication types
export interface AuthConfig {
  apiKeys: string[];
  jwtSecret?: string;
  sessionTimeout?: number;
}

// Cloud storage types
export interface CloudConfig {
  provider: 'gcs' | 'aws' | 'azure';
  bucket: string;
  region?: string;
  credentials: {
    keyFile?: string;
    projectId?: string;
  };
}

// FHIR specific types
export interface FHIRBundle {
  resourceType: 'Bundle';
  id: string;
  type: 'collection' | 'document' | 'message' | 'transaction';
  timestamp: string;
  entry: FHIREntry[];
  meta?: {
    tag?: Array<{
      system: string;
      code: string;
      display: string;
    }>;
    extension?: Array<{
      url: string;
      valueInteger?: number;
      valueBoolean?: boolean;
      valueString?: string;
    }>;
  };
}

export interface FHIREntry {
  resource: FHIRResource;
}

export interface FHIRResource {
  resourceType: string;
  id: string;
  [key: string]: any;
}

// Validation types
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  code?: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  suggestion?: string;
}

// Statistics and monitoring types
export interface ProcessingStats {
  totalProcessed: number;
  highConfidence: number;
  mediumConfidence: number;
  lowConfidence: number;
  needsReview: number;
  avgProcessingTime: number;
  successRate: number;
  errorRate: number;
}

export interface MonitoringMetrics {
  uptime: number;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage: NodeJS.CpuUsage;
  requestCount: number;
  errorCount: number;
  averageResponseTime: number;
}