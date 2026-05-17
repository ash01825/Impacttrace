import { GraniteResponse, ImpactPath } from "../types";

export function parseGraniteResponse(rawText: string): GraniteResponse {
  try {
    const cleaned = extractJSON(rawText);
    const parsed = JSON.parse(cleaned);
    validateResponse(parsed);
    return parsed;
  } catch (jsonErr) {
    // Granite often returns markdown instead of JSON — parse that
    process.stderr.write(`[parser] JSON parse failed, trying markdown. First 300: ${rawText.slice(0, 300)}\n`);
    try {
      const parsed = parseMarkdownReport(rawText);
      validateResponse(parsed);
      return parsed;
    } catch (mdErr) {
      throw new GraniteParseError(
        `Both JSON and markdown parsing failed. JSON error: ${(jsonErr as Error).message}`,
        rawText
      );
    }
  }
}

function parseMarkdownReport(text: string): GraniteResponse {
  const response: GraniteResponse = {
    overallRisk: "low",
    affectedCount: 0,
    impactPaths: [],
    summary: {
      whatChanged: "",
      whatIsAtRisk: "",
      whatToDo: "",
    },
  };

  // Extract overall risk
  const riskMatch = text.match(/(?:overall risk|risk level).*?(low|medium|high)/i);
  if (riskMatch) {
    response.overallRisk = riskMatch[1].toLowerCase() as "low" | "medium" | "high";
  }

  // Extract impact paths — split by numbered list items
  const pathBlocks = text.split(/\n\s*(?=[\d]+\.\s+\*{1,2}[\w\/])/);

  for (const block of pathBlocks) {
    const pathMatch = block.match(
      /(?:^|\n)\s*[\d]+\.\s*\*{0,2}([\w\/\.\-]+\.(?:tsx|jsx|ts|js|json|css|html|md|py|go|rs|java))\*{0,2}/
    );
    if (!pathMatch) continue;

    const component = pathMatch[1];
    
    const depTypeMatch = block.match(/dependencyType\*?\*?\s*:\s*(direct_caller|transitive_caller|behavioral_contract|shared_state)/i);
    const riskLevelMatch = block.match(/riskLevel\*?\*?\s*:\s*(low|medium|high)/i);
    const explanationMatch = block.match(/explanation\*?\*?\s*:\s*(.+?)(?:\n\s*[-*]|\n\n|$)/is);
    const remediationMatch = block.match(/remediation\*?\*?\s*:\s*(.+?)(?:\n\s*[-*]|\n\n|$)/is);
    const affectedFileMatch = block.match(/affectedFile\*?\*?\s*:\s*(.+?)(?:\n\s*[-*]|\n\n|$)/is);

    response.impactPaths.push({
      component,
      dependencyType: (depTypeMatch?.[1] || "direct_caller") as ImpactPath["dependencyType"],
      riskLevel: (riskLevelMatch?.[1] || "low") as ImpactPath["riskLevel"],
      explanation: explanationMatch?.[1]?.trim() || "Impact detected.",
      remediation: remediationMatch?.[1]?.trim() || "Review affected component.",
      affectedFile: affectedFileMatch?.[1]?.trim() || component,
    });
  }

  // Extract summary sections
  const whatChangedMatch = text.match(/(?:what changed|what was changed)[:\s]+(.+?)(?:\n\n|\n###|\n##|$)/is);
  const whatAtRiskMatch = text.match(/(?:what is at risk|what.s at risk)[:\s]+(.+?)(?:\n\n|\n###|\n##|$)/is);
  const whatToDoMatch = text.match(/(?:what to do|remediation steps|action items)[:\s]+(.+?)(?:\n\n|\n###|\n##|$)/is);

  response.summary = {
    whatChanged: cleanMarkdown(whatChangedMatch?.[1]?.trim() || "Code modification detected."),
    whatIsAtRisk: cleanMarkdown(whatAtRiskMatch?.[1]?.trim() || "Review affected components."),
    whatToDo: cleanMarkdown(whatToDoMatch?.[1]?.trim() || "Address high-risk items before shipping."),
  };

  response.affectedCount = response.impactPaths.length;

  return response;
}

function cleanMarkdown(text: string): string {
  return text
    .replace(/^\*{1,2}\s*/, "")
    .replace(/\*{1,2}$/, "")
    .trim();
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
    process.stderr.write(`[parser] No JSON in response. Raw: ${text.slice(0, 600)}\n`);
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
