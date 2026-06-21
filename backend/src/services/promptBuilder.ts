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
  // Filter out modules deleted in the diff
  const activeSharedModules = repoContext.sharedModules.filter(
    (m) => !change.diff.includes(`--- a/${m.path}`) || !change.diff.includes("deleted file")
  );

  // Build dependency graph
  const fileDeps = new Map<string, string[]>();
  const reverseDeps = new Map<string, string[]>();
  const allFiles = new Set<string>();

  for (const svc of repoContext.services) {
    allFiles.add(svc.path);
    for (const dep of svc.dependencies) {
      allFiles.add(dep);
      if (!fileDeps.has(svc.path)) fileDeps.set(svc.path, []);
      fileDeps.get(svc.path)!.push(dep);
      if (!reverseDeps.has(dep)) reverseDeps.set(dep, []);
      reverseDeps.get(dep)!.push(svc.path);
    }
  }

  // Build compact summary
  const depEntries: string[] = [];
  for (const [file, deps] of fileDeps) {
    const importedBy = reverseDeps.get(file) || [];
    depEntries.push(
      `${file}\n  → imports: [${deps.join(", ")}]\n  ← imported by: [${importedBy.join(", ")}]`
    );
  }

  // Find most-critical files (most imported)
  const sortedByCriticality = [...reverseDeps.entries()]
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 5);

  const criticalFiles = sortedByCriticality.map(
    ([file, importers]) => `- **${file}** — imported by ${importers.length} files: [${importers.join(", ")}]`
  ).join("\n");

  const depGraph = depEntries.join("\n");

  const sharedInfo = activeSharedModules.length > 0
    ? activeSharedModules
        .map((m) => `- **${m.path}** → consumed by: [${m.consumedBy.join(", ")}] (no imports between them)`)
        .join("\n")
    : "";

  const hasShared = activeSharedModules.length > 0;

  const changedFilesList = change.changedFiles
    .map((f) => `- **${f.filePath}** (functions: ${f.changedFunctions.join(", ") || "unknown"})`)
    .join("\n");

  return `You are the ImpactTrace AI Engine, a pre-commit change intelligence platform. You analyze how code changes propagate through dependency graphs to find every file that could break — including implicit dependencies invisible to static analysis.

## CODEBASE DEPENDENCY GRAPH

**Critical files (most widely imported):**
${criticalFiles}

**Full dependency map (${allFiles.size} files):**
${depGraph}

${hasShared ? `**Cross-cutting shared files (behavioral contract risks):**\n${sharedInfo}\n` : ""}

## CHANGE TO ANALYZE

${changedFilesList}

**Intent:** ${change.description}

\`\`\`diff
${change.diff}
\`\`\`

## ANALYSIS

**CRITICAL**: The dependency graph is the source of truth. Ignore file paths appearing only in deleted diff content.

Run these phases — trace ALL impact chains:

### 1. Direct Callers
Every file that imports (→) a changed file. These break immediately.

### 2. Transitive Callers
Follow import chains 2-3 levels deep. If A→B→changed, A is transitive. Identify real breakage risks, not theoretical chains.

${hasShared ? `### 3. Behavioral Contracts (IMPORTANT)
${sharedInfo}

These files are consumed by multiple modules without imports between them. If the change alters a contract (schema, types, config format, API shape), ALL independent consumers break silently. No linter catches this. Flag as "behavioral_contract" with risk "high".` : `### 3. Implicit Contracts
Look for config formats, type definitions, or API shapes in shared files that multiple modules consume independently without import relationships.`}

### 4. Shared State
Files reading the same configuration/types/state as changed code.

## DETERMINE OVERALL RISK

- **high**: Any behavioral contract OR >5 high-risk transitive paths OR changed file is in the "most imported" list
- **medium**: 2-5 medium-risk paths, no behavioral contracts
- **low**: 1-2 low-risk direct callers only, no chain depth >1

## RETURN JSON ONLY

Return EXACTLY this structure, no markdown:

{
  "overallRisk": "low",
  "affectedCount": 4,
  "impactPaths": [
    {
      "component": "src/services/auth.ts",
      "dependencyType": "direct_caller",
      "riskLevel": "medium",
      "explanation": "auth.ts directly imports the changed tokenValidator and will receive a compile error from the signature mismatch",
      "remediation": "Update the call on line 23 to pass the new config parameter",
      "affectedFile": "src/services/auth.ts",
      "affectedLine": 23
    }
  ],
  "summary": {
    "whatChanged": "The validateToken function signature was updated to require a config parameter. This function is the entry point for all token validation across 4 services.",
    "whatIsAtRisk": "auth.ts and sessionManager.ts will break at compile time. The payment validation service shares a behavioral contract through token-schema.json — it will silently reject all tokens after this change.",
    "whatToDo": "1. Update auth.ts line 23 to pass config. 2. Update sessionManager.ts to match. 3. Run payment validation integration tests — this is the highest risk."
  },
  "codebaseInsights": {
    "criticalFiles": ["src/types/index.ts", "src/stores/connection-store.ts"],
    "architectureConcern": "The connection-store is imported by 4 services creating a single point of failure — changes here cascade widely",
    "recommendedTests": ["auth integration test", "payment validation contract test", "session restore e2e test"]
  }
}`;
}
