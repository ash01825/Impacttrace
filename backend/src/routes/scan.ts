import { Router, Request, Response } from "express";
import * as path from "path";
import * as os from "os";
import * as fs from "fs";
import simpleGit from "simple-git";
import { scanRepository } from "../services/repoScanner";

export const scanRouter = Router();

const PROJECT_ROOT = path.resolve(__dirname, "../../..");
const CLONE_DIR = path.join(os.tmpdir(), "impacttrace-repos");

scanRouter.post("/scan-repo", (req: Request, res: Response) => {
  const { repoPath } = req.body;

  if (!repoPath) {
    res.status(400).json({ error: "repoPath is required" });
    return;
  }

  try {
    const resolved = path.resolve(PROJECT_ROOT, repoPath);
    const result = scanRepository(resolved);
    res.json({
      repoContext: result.repoContext,
      fileCount: result.fileTree.length,
      serviceCount: result.repoContext.services.length,
      sharedModuleCount: result.repoContext.sharedModules.length,
      warnings: result.warnings,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: message });
  }
});

scanRouter.post("/clone-and-scan", async (req: Request, res: Response) => {
  const { repoUrl } = req.body;

  if (!repoUrl) {
    res.status(400).json({ error: "repoUrl is required" });
    return;
  }

  // Sanitize URL to create a valid directory name
  const repoName = repoUrl
    .replace(/^https?:\/\//, "")
    .replace(/github\.com\//, "")
    .replace(/[^a-zA-Z0-9-_]/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 80);

  const clonePath = path.join(CLONE_DIR, `${repoName}_${Date.now()}`);

  try {
    // Ensure clone directory exists
    fs.mkdirSync(CLONE_DIR, { recursive: true });

    // Clone with depth=1 for speed
    const git = simpleGit();
    await git.clone(repoUrl, clonePath, ["--depth", "1"]);

    const result = scanRepository(clonePath);

    // Clean up clone after scanning
    fs.rmSync(clonePath, { recursive: true, force: true });

    res.json({
      repoContext: result.repoContext,
      fileCount: result.fileTree.length,
      serviceCount: result.repoContext.services.length,
      sharedModuleCount: result.repoContext.sharedModules.length,
      warnings: result.warnings,
    });
  } catch (err) {
    // Clean up on error
    try { fs.rmSync(clonePath, { recursive: true, force: true }); } catch {}

    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: message });
  }
});
