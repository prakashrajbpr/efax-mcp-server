# eFax to JSON MCP Server

A Model Context Protocol (MCP) server that converts eFax documents from OpenText Fax Server Software into structured JSON format. Supports PDF, TIFF, and CCD XML document formats with advanced OCR and metadata extraction capabilities.

## Features

### Supported Formats
- **PDF Documents** - Text extraction and OCR for scanned PDFs
- **TIFF Images** - Multi-page TIFF support with OCR processing
- **CCD XML** - Clinical Document Architecture parsing

### Processing Capabilities
- **Intelligent OCR** - Tesseract-based text recognition with confidence scoring
- **Metadata Extraction** - Preserve document properties and fax information
- **Batch Processing** - Convert multiple documents simultaneously  
- **Format Validation** - Comprehensive document structure validation
- **Error Recovery** - Robust error handling with detailed reporting

## Installation

### Prerequisites
- Node.js 18+ 
- System-level Tesseract OCR installation:
  - **Ubuntu/Debian**: `sudo apt-get install tesseract-ocr`
  - **macOS**: `brew install tesseract`
  - **Windows**: Download from [UB Mannheim releases](https://github.com/UB-Mannheim/tesseract/wiki)

### Setup Steps

1. **Create project directory**
   ```bash
   mkdir efax-mcp-server
   cd efax-mcp-server
   ```

2. **Initialize and install dependencies**
   ```bash
   npm init -y
   npm install @modelcontextprotocol/sdk pdf-parse sharp tesseract.js xml2js
   npm install -D @types/node @types/pdf-parse @types/xml2js typescript ts-node
   ```

3. **Create directory structure**
   ```bash
   mkdir -p src/{types,processors,utils}
   mkdir -p tests/test-files
   mkdir -p docs
   ```

4. **Add source files** (paste the provided code into respective files)

5. **Build the project**
   ```bash
   npm run build
   ```

## Usage

### MCP Client Configuration

Add to your MCP client configuration (e.g., Claude Desktop):

```json
{
  "mcpServers": {
    "efax-converter": {
      "command": "node",
      "args": ["/path/to/efax-mcp-server/dist/server.js"]
    }
  }
}
```

### Available Tools

#### 1. Convert Single Document
```bash
convert_efax_document --filePath "/path/to/document.pdf" --performOCR true
```

**Parameters:**
- `filePath` (required) - Path to eFax document
- `outputPath` (optional) - Custom output JSON path
- `extractMetadata` (default: true) - Extract document metadata
- `performOCR` (default: true) - Enable OCR processing
- `ocrLanguage` (default: "eng") - OCR language code
- `includeRawData` (default: false) - Include raw document data

#### 2. Batch Convert Documents
```bash
batch_convert_efax --inputDirectory "/path/to/docs" --outputDirectory "/path/to/json"
```

**Parameters:**
- `inputDirectory` (required) - Source document directory
- `outputDirectory` (required) - JSON output directory
- `filePattern` (default: "*") - File matching pattern
- `continueOnError` (default: true) - Continue on individual failures

#### 3. Validate JSON Output
```bash
validate_efax_json --jsonPath "/path/to/output.json"
```

#### 4. Get File Information
```bash
get_file_info --filePath "/path/to/document.pdf"
```

#### 5. List Supported Formats
```bash
list_supported_formats
```

## JSON Output Structure

```json
{
  "id": "efax_document_1234567890_abc123",
  "source": "efax",
  "format": "pdf|tiff|ccd_xml",
  "timestamp": "2025-08-04T12:00:00.000Z",
  "metadata": {
    "originalFileName": "fax_document.pdf",
    "fileSize": 2048576,
    "pages": 3,
    "sender": "John Doe",
    "recipient": "Jane Smith",
    "faxNumber": "+1-555-123-4567",
    "resolution": "1200x1800",
    "ocrConfidence": 95.5,
    "processingTime": 3500
  },
  "content": {
    "text": "Full extracted text content...",
    "pages": [
      {
        "pageNumber": 1,
        "text": "Page 1 text content...",
        "confidence": 96.2,
        "metadata": {
          "width": 1200,
          "height": 1800,
          "resolution": "1200x1800"
        }
      }
    ],
    "sections": [
      {
        "title": "Patient Information",
        "content": "Patient details...",
        "type": "patient",
        "pageNumbers": [1]
      }
    ]
  },
  "rawData": {
    "pdfInfo": {},
    "imageMetadata": {}
  }
}
```

## Architecture

### Modular Design
- **Processors**: Format-specific conversion logic
- **Utilities**: Shared validation and file handling
- **Types**: Comprehensive TypeScript definitions

### Processing Pipeline
1. **File Validation** - Format and size checks
2. **Format Detection** - Automatic type identification  
3. **Content Extraction** - Text and metadata processing
4. **OCR Processing** - Image-to-text conversion when needed
5. **Structure Validation** - Output quality assurance
6. **JSON Serialization** - Standardized output format

## Development

### Build Commands
```bash
npm run build     # Compile TypeScript
npm run dev       # Development mode with hot reload
npm run test      # Run test suite
npm run clean     # Clean build directory
```

### Testing
Place sample documents in `tests/test-files/` and run:
```bash
npm test
```

### Adding New Formats
1. Create processor in `src/processors/`
2. Add type definitions in `src/types/`
3. Register in main server
4. Update documentation

## Performance Considerations

- **OCR Processing**: CPU-intensive, consider batch size limits
- **Memory Usage**: Large TIFF files may require significant RAM
- **Processing Time**: Varies by document complexity and OCR requirements
- **Concurrent Processing**: Single-threaded OCR worker per instance

## Error Handling

The server provides comprehensive error handling:
- **File Validation Errors** - Invalid paths, unsupported formats
- **Processing Errors** - OCR failures, corrupted documents  
- **System Errors** - Memory issues, disk space problems
- **Validation Errors** - Output structure problems

## Troubleshooting

### Common Issues

**OCR Not Working**
- Verify Tesseract installation: `tesseract --version`
- Check language pack availability
- Ensure sufficient system memory

**Large File Processing**
- Monitor memory usage during conversion
- Consider breaking large batches into smaller chunks
- Verify available disk space for output

**Permission Errors**
- Check read permissions on input files
- Verify write permissions on output directory
- Ensure MCP server has appropriate file system access

## License

MIT License - see LICENSE file for details.

## Support

For issues and feature requests, please use the project's issue tracker.