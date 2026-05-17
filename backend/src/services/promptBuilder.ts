import { RepoContext } from "../types";

interface ChangeContext {
  diff: string;
  changedFiles: Array<{
    filePath: string;
    changedFunctions: string[];
  }>;
  description: string;
}

export function buildImpactAnalysisPrompt(
  change: ChangeContext,
  repoContext: RepoContext
): string {
  // Filter out shared modules that are marked as deleted in the diff
  const activeSharedModules = repoContext.sharedModules.filter(
    (m) => !change.diff.includes(`--- a/${m.path}`) || !change.diff.includes("deleted file")
  );
  const fileDeps = new Map<string, string[]>();
  const reverseDeps = new Map<string, string[]>();

  for (const svc of repoContext.services) {
    for (const dep of svc.dependencies) {
      if (!fileDeps.has(svc.path)) fileDeps.set(svc.path, []);
      fileDeps.get(svc.path)!.push(dep);
      if (!reverseDeps.has(dep)) reverseDeps.set(dep, []);
      reverseDeps.get(dep)!.push(svc.path);
    }
  }

  // Build compact dependency summary
  const depEntries: string[] = [];
  for (const [file, deps] of fileDeps) {
    const importedBy = reverseDeps.get(file) || [];
    depEntries.push(
      `  ${file}\n` +
      `    → imports: [${deps.join(", ")}]\n` +
      `    ← imported by: [${importedBy.join(", ")}]`
    );
  }
  const depGraph = depEntries.join("\n") || "  (no dependencies detected)";

  // Shared modules (cross-cutting concerns)
  const sharedInfo = activeSharedModules.length > 0
    ? activeSharedModules
        .map(
          (m) =>
            `- **${m.path}** → consumed independently by: [${m.consumedBy.join(", ")}] (no import between them)`
        )
        .join("\n")
    : "";

  const hasShared = activeSharedModules.length > 0;

  const implicitSection = hasShared
    ? `### Phase 3 — Behavioral Contracts (CRITICAL)
These files are consumed independently by multiple modules WITHOUT any import between them:
${sharedInfo}

If the changed code alters a contract that any shared file defines (format, schema, types, config keys), the independent consumers will break silently. No linter or static analyzer catches this. Flag these as "behavioral_contract" with risk "high".`
    : `### Phase 3 — Behavioral Contracts
Check if the change could break implicit contracts — configuration formats, type definitions, API signatures in files consumed by multiple modules without import relationships.`;

  const changedFilesList = change.changedFiles
    .map((f) => `- **${f.filePath}** (functions: ${f.changedFunctions.join(", ") || "unknown"})`)
    .join("\n");

  return `Analyze the blast radius of this code change. Discover ALL files affected — directly, transitively, and implicitly.

**CRITICAL:** The dependency graph below is the SOLE source of truth for what files exist in this codebase. Ignore file paths or service names that appear ONLY in deleted diff content. Deleted files are removed — analyze impact of their removal on remaining code.

${depGraph}

${hasShared ? `## Shared Cross-Cutting Files\n${sharedInfo}\n` : ""}

## Change

${changedFilesList}

**Intent:** ${change.description}

\`\`\`diff
${change.diff}
\`\`\`

## Phased Analysis

Run all 4 phases. Assess overall risk considering combined impact across all phases.

### Phase 1 — Direct Dependents
From the dependency graph, find every file that imports (→) any changed file. These will break immediately.

### Phase 2 — Transitive Dependents  
Trace chains: if A imports B and B imports the changed file, A is a transitive dependent. Follow chains 2-3 levels.

${implicitSection}

### Phase 4 — Shared State
Files that read the same configuration, types, or state as the changed code. Found via the "imported by" (←) relationship from shared files.

## Output — JSON only, no markdown

{
  "overallRisk": "low" | "medium" | "high",
  "affectedCount": <number>,
  "impactPaths": [
    {
      "component": "<affected file path from the dependency graph>",
      "dependencyType": "direct_caller" | "transitive_caller" | "behavioral_contract" | "shared_state",
      "riskLevel": "low" | "medium" | "high",
      "explanation": "<concrete: what file, what breaks, why>",
      "remediation": "<specific action>",
      "affectedFile": "<file path>",
      "affectedLine": <number or null>
    }
  ],
  "summary": {
    "whatChanged": "<concrete description of the diff>",
    "whatIsAtRisk": "<which files break and how>",
    "whatToDo": "<prioritized steps, risk-ordered>"
  }
}`;
}
