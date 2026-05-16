import { Router } from "express";
import repoContext from "../context/repoContext.json";

export const repoContextRouter = Router();

repoContextRouter.get("/repo-context", (_req, res) => {
  res.json(repoContext);
});
