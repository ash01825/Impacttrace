import { Router, Request, Response } from "express";
import * as path from "path";
import { scanRepository } from "../services/repoScanner";

export const repoContextRouter = Router();

const DEMO_REPO_PATH = path.resolve(__dirname, "../../../demo-repo");

repoContextRouter.get("/repo-context", (req: Request, res: Response) => {
  try {
    const result = scanRepository(DEMO_REPO_PATH);
    res.json(result.repoContext);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});
