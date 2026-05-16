import { GraniteResponse, ImpactPath } from "../types";

export function parseGraniteResponse(rawText: string): GraniteResponse {
  const cleaned = extractJSON(rawText);

  let parsed: GraniteResponse;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    throw new GraniteParseError(
      `Failed to parse Granite response as JSON. Raw output: ${rawText.slice(0, 500)}`,
      rawText
    );
  }

  validateResponse(parsed);

  return parsed;
}

function extractJSON(text: string): string {
  // Remove markdown code fences if present
  let cleaned = text.trim();

  // Strip ```json ... ``` fences
  const fenceMatch = cleaned.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (fenceMatch) {
    cleaned = fenceMatch[1].trim();
  }

  // Find first { and last }
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1) {
    throw new GraniteParseError("No JSON object found in Granite response", text);
  }

  return cleaned.slice(firstBrace, lastBrace + 1);
}

function validateResponse(response: GraniteResponse): void {
  if (!response.overallRisk || !["low", "medium", "high"].includes(response.overallRisk)) {
    response.overallRisk = "medium";
  }

  if (!Array.isArray(response.impactPaths)) {
    throw new GraniteParseError(
      "Granite response missing impactPaths array",
      JSON.stringify(response).slice(0, 500)
    );
  }

  response.impactPaths = response.impactPaths.map(validateImpactPath);
  response.affectedCount = response.impactPaths.length;

  if (!response.summary) {
    response.summary = {
      whatChanged: "Analysis completed. See impact paths for details.",
      whatIsAtRisk: "Review each affected component below.",
      whatToDo: "Address high-risk items before shipping.",
    };
  }

  // Normalize summary fields — Granite sometimes returns arrays
  response.summary.whatChanged = normalizeSummaryField(response.summary.whatChanged);
  response.summary.whatIsAtRisk = normalizeSummaryField(response.summary.whatIsAtRisk);
  response.summary.whatToDo = normalizeSummaryField(response.summary.whatToDo);
}

function normalizeSummaryField(field: unknown): string {
  if (typeof field === "string") return field;
  if (Array.isArray(field)) return field.filter((s) => typeof s === "string").join(". ");
  return String(field || "");
}

function validateImpactPath(path: ImpactPath): ImpactPath {
  return {
    component: path.component || "unknown",
    dependencyType: validateDependencyType(path.dependencyType),
    riskLevel: validateRiskLevel(path.riskLevel),
    explanation: path.explanation || "No explanation provided.",
    remediation: path.remediation || "Review the affected component for compatibility.",
    affectedFile: path.affectedFile || undefined,
    affectedLine: typeof path.affectedLine === "number" ? path.affectedLine : undefined,
  };
}

function validateDependencyType(
  type: string
): ImpactPath["dependencyType"] {
  const valid = ["direct_caller", "transitive_caller", "behavioral_contract", "shared_state"];
  return valid.includes(type)
    ? (type as ImpactPath["dependencyType"])
    : "direct_caller";
}

function validateRiskLevel(level: string): ImpactPath["riskLevel"] {
  const valid = ["low", "medium", "high"];
  return valid.includes(level) ? (level as ImpactPath["riskLevel"]) : "medium";
}

export class GraniteParseError extends Error {
  public rawOutput: string;

  constructor(message: string, rawOutput: string) {
    super(message);
    this.name = "GraniteParseError";
    this.rawOutput = rawOutput;
  }
}
