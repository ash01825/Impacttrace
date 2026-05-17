import { Router, Request, Response } from "express";
import * as path from "path";
import * as os from "os";
import * as fs from "fs";
import simpleGit from "simple-git";
import { generateText } from "../services/aiClient";
import { buildImpactAnalysisPrompt } from "../services/promptBuilder";
import { parseGraniteResponse } from "../parsers/graniteParser";
import { scanRepository } from "../services/repoScanner";
import { parseMultiFileDiff } from "../services/diffParser";
import { PhaseData, RepoContext } from "../types";

const PROJECT_ROOT = path.resolve(__dirname, "../../..");
const CLONE_DIR = path.join(os.tmpdir(), "impacttrace-repos");

export const analyzeRouter = Router();

const PHASES: { phase: PhaseData["phase"]; label: string }[] = [
  { phase: "indexing", label: "Indexing change context" },
  { phase: "identifying_direct", label: "Identifying direct dependencies" },
  { phase: "discovering_transitive", label: "Discovering transitive dependencies" },
  { phase: "checking_behavioral", label: "Checking behavioral contracts" },
];

analyzeRouter.post("/analyze", async (req: Request, res: Response) => {
  const { diff, description, repoPath, repoUrl, repoContext, parsedFiles } = req.body;

  if (!diff) {
    res.status(400).json({ error: "Missing required field: diff" });
    return;
  }

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  const sendEvent = (event: string, data: unknown) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  let context: RepoContext;
  let contextSource: string;

  if (repoContext) {
    context = repoContext as RepoContext;
    contextSource = "provided";
  } else if (repoPath) {
    try {
      const resolved = path.resolve(PROJECT_ROOT, repoPath);
      const scanResult = scanRepository(resolved);
      context = scanResult.repoContext;
      contextSource = "scanned";

      sendEvent("phase", {
        phase: "indexing",
        label: `Scanned ${scanResult.repoContext.services.length} services, ${scanResult.repoContext.sharedModules.length} shared modules`,
      });
      await delay(300);
    } catch (err) {
      sendEvent("error", {
        message: `Failed to scan repository: ${err instanceof Error ? err.message : String(err)}`,
      });
      res.end();
      return;
    }
  } else if (repoUrl) {
    try {
      const repoName = repoUrl
        .replace(/^https?:\/\//, "")
        .replace(/github\.com\//, "")
        .replace(/[^a-zA-Z0-9-_]/g, "_")
        .replace(/_+/g, "_")
        .slice(0, 80);
      const clonePath = path.join(CLONE_DIR, `${repoName}_${Date.now()}`);

      fs.mkdirSync(CLONE_DIR, { recursive: true });

      sendEvent("phase", {
        phase: "indexing",
        label: `Cloning ${repoUrl}...`,
      });

      const git = simpleGit();
      await git.clone(repoUrl, clonePath, ["--depth", "1"]);

      const scanResult = scanRepository(clonePath);
      context = scanResult.repoContext;
      contextSource = "cloned";

      try {
        fs.rmSync(clonePath, { recursive: true, force: true });
      } catch {}

      sendEvent("phase", {
        phase: "indexing",
        label: `Scanned ${scanResult.repoContext.services.length} services, ${scanResult.repoContext.sharedModules.length} shared modules`,
      });
      await delay(300);
    } catch (err) {
      sendEvent("error", {
        message: `Failed to clone or scan: ${err instanceof Error ? err.message : String(err)}`,
      });
      res.end();
      return;
    }
  } else {
    sendEvent("error", {
      message: "No repository context provided. Please scan a repo first.",
    });
    res.end();
    return;
  }

  // Parse diff for changed files (multi-file support)
  const diffInfo = parsedFiles || parseMultiFileDiff(diff);
  const changedFilePaths = diffInfo.files.map((f: { filePath: string; changedFunctions: string[] }) => f.filePath);

  sendEvent("changed_files", changedFilePaths);

  let phaseIndex = 0;
  const phaseInterval = setInterval(() => {
    if (phaseIndex < PHASES.length) {
      sendEvent("phase", {
        phase: PHASES[phaseIndex].phase,
        label: PHASES[phaseIndex].label,
      });
      phaseIndex++;
    }
  }, 900);

  try {
    const prompt = buildImpactAnalysisPrompt(
      {
        diff,
        changedFiles: diffInfo.files.map((f: { filePath: string; changedFunctions: string[] }) => ({
          filePath: f.filePath,
          changedFunctions: f.changedFunctions,
        })),
        description: description || "Code modification across multiple files",
      },
      context
    );

    const analysisStartTime = Date.now();
    const rawResponse = await generateText(prompt, { maxTokens: 8192, temperature: 0.1 });
    const analysisTimeMs = Date.now() - analysisStartTime;

    clearInterval(phaseInterval);

    while (phaseIndex < PHASES.length) {
      sendEvent("phase", {
        phase: PHASES[phaseIndex].phase,
        label: PHASES[phaseIndex].label,
      });
      phaseIndex++;
    }

    const parsed = parseGraniteResponse(rawResponse);

    for (let i = 0; i < parsed.impactPaths.length; i++) {
      sendEvent("impact_path", parsed.impactPaths[i]);
      await delay(200);
    }

    sendEvent("complete", {
      overallRisk: parsed.overallRisk,
      affectedCount: parsed.affectedCount,
      impactPaths: parsed.impactPaths,
      summary: parsed.summary,
      contextSource,
      changedFiles: diffInfo.files.map((f: { filePath: string; changedFunctions: string[] }) => f.filePath),
      codebaseInsights: parsed.codebaseInsights,
      modelInfo: {
        model: "nvidia/nemotron-3-nano-30b-a3b:free",
        provider: "NVIDIA (via OpenRouter)",
        analysisTimeMs,
      },
    });
  } catch (err) {
    clearInterval(phaseInterval);
    sendEvent("error", {
      message: `Analysis failed: ${err instanceof Error ? err.message : String(err)}. Please check your API key and try again.`,
    });
  }

  res.end();
});

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
