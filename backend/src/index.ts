import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import * as path from "path";
import { healthRouter } from "./routes/health";
import { analyzeRouter } from "./routes/analyze";
import { scanRouter } from "./routes/scan";
import { repoContextRouter } from "./routes/repoContext";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.use("/api", healthRouter);
app.use("/api", analyzeRouter);
app.use("/api", scanRouter);
app.use("/api", repoContextRouter);

if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    process.stdout.write(`ImpactTrace backend running on http://localhost:${PORT}\n`);
  });
}

export default app;
