// src/llm/mapToFHIR.ts
import axios from "axios";
import { jsonrepair } from "jsonrepair";
import dotenv from "dotenv";

dotenv.config();

// -----------------------------
// Type Definitions
// -----------------------------
interface ConfidenceMetrics {
  overallConfidence: "high" | "medium" | "low";
  confidenceScore: number; // 0–100
  flaggedFields: string[];
  ocrQualityScore: number;
  parsingIssues: string[];
  missingCriticalFields: string[];
}

interface FHIRWithConfidence {
  fhirBundle: any;
  confidence: ConfidenceMetrics;
  needsReview: boolean;
  reviewComments: string[];
}

interface ClaudeAPIResponse {
  content: { text: string }[];
}

// -----------------------------
// OCR Quality Analysis
// -----------------------------
function analyzeOCRQuality(ocrText: string): { score: number; issues: string[] } {
  const issues: string[] = [];
  let score = 100;

  const ocrProblems = [
    { pattern: /[|\\\/]{3,}/, issue: "Multiple vertical lines detected", penalty: 15 },
    { pattern: /\s{5,}/, issue: "Excessive whitespace", penalty: 10 },
    { pattern: /[0O]{3,}|[Il]{3,}/, issue: "Character confusion (0/O, I/l)", penalty: 20 },
    { pattern: /[^\w\s\-.,()/@:]/g, issue: "Special characters", penalty: 5 },
    { pattern: /^\s*$/, issue: "Empty or whitespace-only text", penalty: 100 },
  ];

  ocrProblems.forEach(({ pattern, issue, penalty }) => {
    if (pattern.test(ocrText)) {
      issues.push(issue);
      score -= penalty;
    }
  });

  if (ocrText.length < 100) {
    issues.push("Very short text - possible incomplete OCR");
    score -= 25;
  }

  if (!/patient|name|date|doctor|physician/i.test(ocrText)) {
    issues.push("No recognizable medical form structure");
    score -= 30;
  }

  return { score: Math.max(0, score), issues };
}

// -----------------------------
// Critical Field Checker
// -----------------------------
function identifyMissingFields(ocrText: string): string[] {
  const criticalFields = [
    { field: "Patient Name", patterns: [/patient.*name/i, /first.*name/i, /last.*name/i] },
    { field: "Date of Birth", patterns: [/date.*birth/i, /dob/i, /born/i] },
    { field: "Medical Record Number", patterns: [/medical.*record/i, /mrn/i, /patient.*id/i] },
    { field: "Referring Physician", patterns: [/referring.*physician/i, /doctor/i, /md/i] },
    { field: "Chief Complaint", patterns: [/chief.*complaint/i, /symptoms/i, /diagnosis/i] },
  ];

  return criticalFields
    .filter(({ patterns }) => !patterns.some((p) => p.test(ocrText)))
    .map(({ field }) => field);
}

// -----------------------------
// Main Mapping Function
// -----------------------------
export async function mapToFHIR(ocrText: string): Promise<FHIRWithConfidence> {
  try {
    console.log("Calling Claude API for FHIR mapping...");

    const ocrAnalysis = analyzeOCRQuality(ocrText);
    const missingFields = identifyMissingFields(ocrText);

    const claudeRes = await axios.post<ClaudeAPIResponse>(
      "https://api.anthropic.com/v1/messages",
      {
        model: "claude-3-5-haiku-20241022",
        max_tokens: 3000,
        messages: [
          {
            role: "user",
            content: `Convert the following medical referral form text into FHIR-compliant JSON. IMPORTANT: You must also provide a confidence assessment.

OCR Text:
${ocrText}

Please return a JSON response with this exact structure:
{
  "fhirBundle": { ... },
  "confidence": {
    "overallConfidence": "high|medium|low",
    "confidenceScore": 0-100,
    "flaggedFields": [],
    "parsingIssues": [],
    "reasoning": "..."
  }
}

Confidence Guidelines:
- HIGH (80-100): Clear text, all critical fields present, no ambiguity
- MEDIUM (50-79): Some unclear text or missing non-critical fields
- LOW (0-49): Poor text quality, missing critical fields, or high uncertainty

Be conservative with confidence scores for medical data. Flag any field where you had to guess or interpret unclear text.`,
          },
        ],
      },
      {
        headers: {
          "x-api-key": process.env.CLAUDE_API_KEY!,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
      }
    );

    const content = claudeRes.data?.content?.[0]?.text;

    if (!content) {
      throw new Error("No valid response content from Claude API");
    }

    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Claude returned invalid JSON format");

    const rawJson = jsonMatch[1] || jsonMatch[0];
    const parsed = JSON.parse(jsonrepair(rawJson));

    const combinedConfidence: ConfidenceMetrics = {
      overallConfidence: parsed.confidence?.overallConfidence || "low",
      confidenceScore: Math.min(parsed.confidence?.confidenceScore || 50, ocrAnalysis.score),
      flaggedFields: [...(parsed.confidence?.flaggedFields || []), ...missingFields],
      ocrQualityScore: ocrAnalysis.score,
      parsingIssues: [...(parsed.confidence?.parsingIssues || []), ...ocrAnalysis.issues],
      missingCriticalFields: missingFields,
    };

    const needsReview =
      combinedConfidence.confidenceScore < 70 ||
      combinedConfidence.overallConfidence === "low" ||
      missingFields.length > 2 ||
      ocrAnalysis.score < 60;

    const reviewComments: string[] = [];
    if (ocrAnalysis.score < 60) reviewComments.push("Poor OCR quality - verify data.");
    if (missingFields.length > 0) reviewComments.push(`Missing fields: ${missingFields.join(", ")}`);
    if (combinedConfidence.flaggedFields.length > 0)
      reviewComments.push(`Uncertain fields: ${combinedConfidence.flaggedFields.join(", ")}`);
    if (parsed.confidence?.reasoning) reviewComments.push(`Claude: ${parsed.confidence.reasoning}`);

    const enhancedBundle = {
      ...parsed.fhirBundle,
      meta: {
        ...parsed.fhirBundle?.meta,
        tag: [
          ...(parsed.fhirBundle?.meta?.tag || []),
          {
            system: "http://terminology.hl7.org/CodeSystem/v3-ObservationValue",
            code: combinedConfidence.overallConfidence,
            display: `Confidence: ${combinedConfidence.overallConfidence.toUpperCase()}`,
          },
        ],
        extension: [
          {
            url: "http://example.com/fhir/StructureDefinition/confidence-score",
            valueInteger: combinedConfidence.confidenceScore,
          },
          {
            url: "http://example.com/fhir/StructureDefinition/needs-review",
            valueBoolean: needsReview,
          },
        ],
      },
    };

    return {
      fhirBundle: enhancedBundle,
      confidence: combinedConfidence,
      needsReview,
      reviewComments,
    };
  } catch (error: any) {
    console.error("❌ Claude FHIR Mapping Error:", error.response?.data || error.message);

    return {
      fhirBundle: {
        resourceType: "Bundle",
        id: "error-bundle",
        type: "collection",
        timestamp: new Date().toISOString(),
        meta: {
          tag: [
            {
              system: "http://terminology.hl7.org/CodeSystem/v3-ObservationValue",
              code: "low",
              display: "Confidence: LOW",
            },
          ],
        },
        entry: [
          {
            resource: {
              resourceType: "OperationOutcome",
              id: "mapping-error",
              issue: [
                {
                  severity: "error",
                  code: "processing",
                  details: {
                    text: `Failed to map OCR text to FHIR: ${error.message}`,
                  },
                },
              ],
            },
          },
        ],
      },
      confidence: {
        overallConfidence: "low",
        confidenceScore: 0,
        flaggedFields: ["all"],
        ocrQualityScore: 0,
        parsingIssues: [error.message],
        missingCriticalFields: ["all"],
      },
      needsReview: true,
      reviewComments: ["Complete failure – manual entry required"],
    };
  }
}
