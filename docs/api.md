# eFax MCP Server API Documentation

## Overview

The eFax MCP Server provides a comprehensive API for converting eFax documents from OpenText Fax Server Software into structured JSON format. This document details all available tools, their parameters, and expected responses.

## Base Configuration

### Server Information
- **Name**: `efax-converter`
- **Version**: `1.0.0`
- **Protocol**: Model Context Protocol (MCP)
- **Transport**: STDIO

### Supported File Formats
- PDF (`.pdf`) - Portable Document Format
- TIFF (`.tiff`, `.tif`) - Tagged Image File Format
- CCD XML (`.xml`) - Clinical Document Architecture XML

## Tools Reference

### 1. convert_efax_document

Converts a single eFax document to JSON format.

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `filePath` | string | ✅ | - | Path to the eFax document file |
| `outputPath` | string | ❌ | auto-generated | Custom path for JSON output |
| `extractMetadata` | boolean | ❌ | `true` | Extract document metadata |
| `performOCR` | boolean | ❌ | `true` | Perform OCR on image content |
| `ocrLanguage` | string | ❌ | `"eng"` | OCR language code |
| `preserveFormatting` | boolean | ❌ | `false` | Preserve document formatting |
| `includeRawData` | boolean | ❌ | `false` | Include raw document data |

#### Example Request
```json
{
  "method": "tools/call",
  "params": {
    "name": "convert_efax_document",
    "arguments": {
      "filePath": "/path/to/document.pdf",
      "outputPath": "/path/to/output.json",
      "performOCR": true,
      "ocrLanguage": "eng",
      "extractMetadata": true
    }
  }
}
```

#### Response Format
```json
{
  "content": [
    {
      "type": "text",
      "text": "✅ Successfully converted eFax document\n\nInput: /path/to/document.pdf\nOutput: /path/to/output.json\n\nDocument Summary:\n📁 Format: pdf\n📄 Pages: 3\n📝 Text Length: 2,145 characters\n📊 File Size: 2.1 MB\n🔍 OCR Confidence: 95.2%\n⏱️ Processing Time: 3,200ms"
    }
  ]
}
```

### 2. batch_convert_efax

Converts multiple eFax documents in a directory.

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `inputDirectory` | string | ✅ | - | Directory containing eFax documents |
| `outputDirectory` | string | ✅ | - | Directory for JSON output files |
| `filePattern` | string | ❌ | `"*"` | File pattern to match |
| `extractMetadata` | boolean | ❌ | `true` | Extract document metadata |
| `performOCR` | boolean | ❌ | `true` | Perform OCR on image content |
| `ocrLanguage` | string | ❌ | `"eng"` | OCR language code |
| `continueOnError` | boolean | ❌ | `true` | Continue processing on errors |

#### Example Request
```json
{
  "method": "tools/call",
  "params": {
    "name": "batch_convert_efax",
    "arguments": {
      "inputDirectory": "/path/to/fax/documents",
      "outputDirectory": "/path/to/json/output",
      "filePattern": "*.pdf",
      "continueOnError": true
    }
  }
}
```

#### Response Format
```json
{
  "content": [
    {
      "type": "text",
      "text": "📊 Batch Conversion Results\n\nTotal Files: 15\n✅ Successful: 13\n❌ Failed: 2\n⏱️ Total Time: 45,300ms\n\nFile Results:\n1. ✅ document1.pdf (2,100ms)\n2. ✅ document2.pdf (3,200ms)\n3. ❌ corrupted.pdf - Invalid PDF structure\n...\n\n📈 Success Rate: 86.7%"
    }
  ]
}
```

### 3. validate_efax_json

Validates the structure of a converted JSON document.

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `jsonPath` | string | ✅ | - | Path to JSON file to validate |
| `generateReport` | boolean | ❌ | `true` | Generate detailed validation report |

#### Example Request
```json
{
  "method": "tools/call",
  "params": {
    "name": "validate_efax_json",
    "arguments": {
      "jsonPath": "/path/to/document.json",
      "generateReport": true
    }
  }
}
```

#### Response Format
```json
{
  "content": [
    {
      "type": "text",
      "text": "JSON Validation Results for: /path/to/document.json\n\nStatus: ✅ VALID\nScore: 98/100\n\nWarnings (1):\n1. Low OCR confidence detected, text accuracy may be compromised\n\nDocument structure is valid and ready for use."
    }
  ]
}
```

### 4. get_file_info

Retrieves detailed information about an eFax document file.

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `filePath` | string | ✅ | - | Path to the file |

#### Example Request
```json
{
  "method": "tools/call",
  "params": {
    "name": "get_file_info",
    "arguments": {
      "filePath": "/path/to/document.pdf"
    }
  }
}
```

#### Response Format
```json
{
  "content": [
    {
      "type": "text",
      "text": "File Information for: /path/to/document.pdf\n\nName: document\nExtension: .pdf\nSize: 2.15 MB\nMIME Type: application/pdf\nLast Modified: 2025-08-04T12:00:00.000Z\nFormat: pdf\nSupported: ✅ Yes\nValid: ✅ Yes"
    }
  ]
}
```

### 5. list_supported_formats

Lists all supported file formats and their capabilities.

#### Parameters
None required.

#### Example Request
```json
{
  "method": "tools/call",
  "params": {
    "name": "list_supported_formats",
    "arguments": {}
  }
}
```

#### Response Format
```json
{
  "content": [
    {
      "type": "text",
      "text": "Supported eFax Document Formats\n\n📄 PDF (.pdf)\n- Text extraction from native PDF content\n- OCR for scanned/image-based PDFs\n- Metadata extraction (author, creation date, etc.)\n- Multi-page support\n\n🖼️ TIFF (.tiff, .tif)\n- OCR text extraction\n- Multi-page TIFF support\n- Image metadata extraction\n- Confidence scoring for OCR results\n\n📋 CCD XML (.xml)\n- Clinical Document Architecture parsing\n- Patient and provider information extraction\n- Structured section processing\n- HL7 CDA compliance"
    }
  ]
}
```

## Data Structures

### EfaxDocument

The primary output structure for converted documents.

```typescript
interface EfaxDocument {
  id: string;                    // Unique document identifier
  source: "efax";                // Always "efax"
  format: "pdf" | "tiff" | "ccd_xml";
  timestamp: string;             // ISO 8601 timestamp
  metadata: EfaxMetadata;
  content: DocumentContent;
  rawData?: any;                 // Optional raw document data
}
```

### EfaxMetadata

Document metadata information.

```typescript
interface EfaxMetadata {
  faxNumber?: string;            // Originating fax number
  sender?: string;               // Sender name/organization
  recipient?: string;            // Recipient name/organization
  pages?: number;                // Number of pages
  resolution?: string;           // Image resolution (for TIFF)
  fileSize?: number;             // File size in bytes
  originalFileName?: string;     // Original file name
  processingTime?: number;       // Processing duration (ms)
  ocrConfidence?: number;        // OCR confidence score (0-100)
}
```

### DocumentContent

Extracted document content.

```typescript
interface DocumentContent {
  text: string;                  // Full extracted text
  pages?: DocumentPage[];        // Per-page content
  sections?: DocumentSection[];  // Structured sections (CCD XML)
}
```

### DocumentPage

Individual page information.

```typescript
interface DocumentPage {
  pageNumber: number;            // Page number (1-indexed)
  text: string;                  // Page text content
  confidence?: number;           // OCR confidence for this page
  metadata?: PageMetadata;       // Page-specific metadata
}
```

### ProcessingOptions

Configuration for document processing.

```typescript
interface ProcessingOptions {
  extractMetadata: boolean;      // Extract document metadata
  performOCR: boolean;           // Enable OCR processing
  ocrLanguage?: string;          // OCR language code
  preserveFormatting?: boolean;  // Preserve document formatting
  includeRawData?: boolean;      // Include raw document data
}
```

## Error Handling

### Error Codes

| Code | Description |
|------|-------------|
| `MethodNotFound` | Unknown tool requested |
| `InvalidParams` | Invalid or missing parameters |
| `InternalError` | Processing or system error |

### Error Response Format

```json
{
  "error": {
    "code": "InvalidParams",
    "message": "filePath is required"
  }
}
```

### Common Error Scenarios

1. **File Not Found**
   - Code: `InvalidParams`
   - Message: "File does not exist: /path/to/file"

2. **Unsupported Format**
   - Code: `InvalidParams`
   - Message: "Unsupported file extension: .doc"

3. **Processing Failure**
   - Code: `InternalError`
   - Message: "PDF processing failed: Corrupted file structure"

4. **OCR Error**
   - Code: `InternalError`
   - Message: "OCR processing failed: Tesseract not available"

## OCR Language Codes

Supported language codes for OCR processing:

| Code | Language |
|------|----------|
| `eng` | English |
| `spa` | Spanish |
| `fra` | French |
| `deu` | German |
| `ita` | Italian |
| `por` | Portuguese |
| `rus` | Russian |
| `chi_sim` | Chinese Simplified |
| `chi_tra` | Chinese Traditional |
| `jpn` | Japanese |
| `kor` | Korean |

## Performance Considerations

### Processing Times (Approximate)

| Document Type | Size | Processing Time |
|---------------|------|-----------------|
| Small PDF (1-2 pages) | < 1MB | 1-3 seconds |
| Large PDF (10+ pages) | 5-10MB | 10-30 seconds |
| TIFF Image | 2-5MB | 5-15 seconds |
| CCD XML | < 1MB | 1-2 seconds |

### Resource Usage

- **Memory**: 100-500MB per document during processing
- **CPU**: High usage during OCR operations
- **Disk**: Temporary files created during processing
- **Network**: No network access required

## Rate Limits

- No built-in rate limiting
- Recommend limiting concurrent requests to prevent resource exhaustion
- Consider batch processing for large document sets

## Best Practices

### File Organization
- Use consistent naming conventions
- Organize files by date or source
- Maintain backup copies of original documents

### Performance Optimization
- Process smaller batches for better memory management
- Use appropriate OCR language settings
- Enable metadata extraction only when needed

### Error Recovery
- Enable `continueOnError` for batch processing
- Implement retry logic for transient failures
- Monitor processing logs for recurring issues

### Quality Assurance
- Validate JSON output after conversion
- Review OCR confidence scores
- Spot-check converted content accuracy