import { Router, Request, Response } from "express";
import * as path from "path";
import * as os from "os";
import * as fs from "fs";
import simpleGit from "simple-git";
import { generateText } from "../services/watsonxClient";
import { buildImpactAnalysisPrompt } from "../services/promptBuilder";
import { parseGraniteResponse } from "../parsers/graniteParser";
import { getFallbackResponse } from "../services/fallback";
import { scanRepository } from "../services/repoScanner";
import demoRepoContext from "../context/repoContext.json";
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
  const { diff, changedFile, changedFunction, description, repoPath, repoUrl, repoContext } = req.body;

  if (!diff || !changedFile || !changedFunction) {
    res.status(400).json({ error: "Missing required fields: diff, changedFile, changedFunction" });
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

  // Determine repo context: provided directly > scanned from path > demo default
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

      // Clean up
      try { fs.rmSync(clonePath, { recursive: true, force: true }); } catch {}

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
    context = demoRepoContext as RepoContext;
    contextSource = "demo";
  }

  const useFallback = process.env.USE_FALLBACK === "true";

  if (useFallback) {
    await streamFallbackPhasesAndResults(res, sendEvent);
    res.end();
    return;
  }

  // Stream phases to frontend while Granite processes
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
        changedFile,
        changedFunction,
        description: description || "Code modification",
      },
      context
    );

    const rawResponse = await generateText(prompt, { maxTokens: 8192, temperature: 0.1 });

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
      summary: parsed.summary,
      contextSource,
    });
  } catch (err) {
    clearInterval(phaseInterval);
    process.stderr.write(`Granite analysis failed, falling back: ${err}\n`);
    await streamFallbackResultsOnly(res, sendEvent);
  }

  res.end();
});

async function streamFallbackPhasesAndResults(
  res: Response,
  sendEvent: (event: string, data: unknown) => void
) {
  const fallback = getFallbackResponse();

  for (let i = 0; i < PHASES.length; i++) {
    sendEvent("phase", {
      phase: PHASES[i].phase,
      label: PHASES[i].label,
    });
    await delay(600);
  }

  for (let i = 0; i < fallback.impactPaths.length; i++) {
    sendEvent("impact_path", fallback.impactPaths[i]);
    await delay(200);
  }

  sendEvent("complete", {
    overallRisk: fallback.overallRisk,
    affectedCount: fallback.affectedCount,
    summary: fallback.summary,
  });
}

async function streamFallbackResultsOnly(
  res: Response,
  sendEvent: (event: string, data: unknown) => void
) {
  const fallback = getFallbackResponse();

  for (let i = 0; i < fallback.impactPaths.length; i++) {
    sendEvent("impact_path", fallback.impactPaths[i]);
    await delay(200);
  }

  sendEvent("complete", {
    overallRisk: fallback.overallRisk,
    affectedCount: fallback.affectedCount,
    summary: fallback.summary,
  });
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
