import { RepoContext } from "../types";

interface ChangeContext {
  diff: string;
  changedFile: string;
  changedFunction: string;
  description: string;
}

export function buildImpactAnalysisPrompt(
  change: ChangeContext,
  repoContext: RepoContext
): string {
  // Build service and shared module descriptions for the prompt
  const serviceDescriptions = repoContext.services
    .map(
      (s) =>
        `  - ${s.name} (${s.path}): ${s.description}\n    Exports: [${s.exports.join(", ")}]\n    Dependencies: [${s.dependencies.join(", ")}]`
    )
    .join("\n");

  const sharedModuleDescriptions = repoContext.sharedModules.length > 0
    ? repoContext.sharedModules
        .map(
          (m) =>
            `  - ${m.name} (${m.path}): ${m.description}\n    Consumed independently by: [${m.consumedBy.join(", ")}]`
        )
        .join("\n")
    : "  (No shared modules detected)";

  const hasSharedModules = repoContext.sharedModules.length > 0;

  const implicitContractInstruction = hasSharedModules
    ? `### Phase 3 — Behavioral Contracts (CRITICAL — DO NOT SKIP)
Look at the Shared Modules section above. These modules are consumed independently by multiple services WITHOUT any import dependency between those services. Two services can read the same shared config, schema, or type definition without ever importing from each other. If the changed file alters a contract that a shared module defines, services consuming that module independently will break silently — no import analysis, linter, or dependency graph tool will catch this.

For each shared module consumed by multiple services, determine if this change could break the contract for any consumer. Flag these as "behavioral_contract" dependencies. This discovery is the primary value of your analysis.

When you find a behavioral contract, set the risk level to "high" and explain that the dependency is invisible to static analysis tools.`
    : `### Phase 3 — Behavioral Contracts
Check if this change could create implicit contracts with code that has no direct import relationship. Look for configuration, type definitions, environment variables, or data formats that multiple independent modules might consume. If found, flag as "behavioral_contract". If none exist, skip this phase.`;

  return `You are a code impact analysis engine performing a blast radius assessment. Analyze this code change across four dependency layers. Your most critical task is discovering IMPLICIT dependencies that no import graph would reveal.

## Repository Architecture

### Services (${repoContext.services.length} detected)
${serviceDescriptions}

### Shared Modules (${repoContext.sharedModules.length} detected)
${sharedModuleDescriptions}

## Code Change to Analyze

**File changed:** ${change.changedFile}
**Function modified:** ${change.changedFunction}
**Description:** ${change.description}

**Diff:**
\`\`\`
${change.diff}
\`\`\`

## ANALYSIS INSTRUCTIONS

Reason through these four phases. Do not skip phases.

### Phase 1 — Direct Callers
Identify every file that directly imports or requires the changed file. Use the "Dependencies" lists above — if a service lists the changed file or its parent module as a dependency, examine it. Only include files with an explicit import/require relationship.

### Phase 2 — Transitive Callers
For each direct caller from Phase 1, trace the dependency chain further. Follow chains as deep as they go. A service that depends on a direct caller is a transitive caller.

${implicitContractInstruction}

### Phase 4 — Shared State
Identify files that read shared configuration, types, or state that the changed function also touches. Check the "Consumed independently by" lists in shared modules. Files that share state with the changed code but have no import relationship are "shared_state" dependencies.

## OUTPUT RULES

1. Return ONLY valid JSON. No markdown fences, no explanations before or after.
2. Every impact path must reference real files from the repository architecture above.
3. If shared modules exist, the behavioral contract findings MUST be present.
4. dependencyType MUST be one of: "direct_caller", "transitive_caller", "behavioral_contract", "shared_state"
5. Risk level MUST be one of: "low", "medium", "high"
6. Summary paragraphs must name specific services, files, and failure modes.

## JSON SCHEMA

{
  "overallRisk": "low" | "medium" | "high",
  "affectedCount": <number>,
  "impactPaths": [
    {
      "component": "<exact file name or path>",
      "dependencyType": "direct_caller" | "transitive_caller" | "behavioral_contract" | "shared_state",
      "riskLevel": "low" | "medium" | "high",
      "explanation": "<1-2 sentence impact description naming specific services>",
      "remediation": "<specific actionable step>",
      "affectedFile": "<path to affected file, or null>",
      "affectedLine": <number or null>
    }
  ],
  "summary": {
    "whatChanged": "<detailed description of what the code change does>",
    "whatIsAtRisk": "<services and business functions that could break>",
    "whatToDo": "<prioritized, specific actions ordered by risk>"
  }
}

Begin. Return JSON only.`;
}
