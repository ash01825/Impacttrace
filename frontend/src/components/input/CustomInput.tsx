import { useState } from "react";
import { RepoContext } from "@/types";
import DiffViewer from "./DiffViewer";

interface CustomInputProps {
  onAnalyze: (params: {
    diff: string;
    changedFile: string;
    changedFunction: string;
    description: string;
    repoPath?: string;
    repoUrl?: string;
    repoContext?: RepoContext;
  }) => void;
  isStreaming: boolean;
}

export default function CustomInput({ onAnalyze, isStreaming }: CustomInputProps) {
  const [repoUrl, setRepoUrl] = useState("");
  const [diff, setDiff] = useState("");
  const [changedFile, setChangedFile] = useState("");
  const [changedFunction, setChangedFunction] = useState("");
  const [description, setDescription] = useState("");
  const [repoContext, setRepoContext] = useState<RepoContext | null>(null);
  const [scanResult, setScanResult] = useState<{
    services: number;
    sharedModules: number;
    warnings: string[];
  } | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  const isGitHubUrl = (url: string) =>
    /^https?:\/\/github\.com\/[\w.-]+\/[\w.-]+/.test(url.trim());

  const handleScan = async () => {
    if (!repoUrl.trim()) return;
    setIsScanning(true);
    setScanError(null);
    setScanResult(null);
    setRepoContext(null);

    try {
      // For GitHub URLs, use clone-and-scan. For local paths, use scan-repo.
      const endpoint = isGitHubUrl(repoUrl) ? "/api/clone-and-scan" : "/api/scan-repo";
      const bodyKey = isGitHubUrl(repoUrl) ? "repoUrl" : "repoPath";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [bodyKey]: repoUrl.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setScanError(data.error || "Scan failed");
      } else {
        setScanResult({
          services: data.serviceCount,
          sharedModules: data.sharedModuleCount,
          warnings: data.warnings || [],
        });
        setRepoContext(data.repoContext);
      }
    } catch (err) {
      setScanError(err instanceof Error ? err.message : "Scan failed");
    } finally {
      setIsScanning(false);
    }
  };

  const handleAnalyze = () => {
    if (!diff.trim() || !changedFile.trim() || !changedFunction.trim()) return;

    const isGH = isGitHubUrl(repoUrl);

    onAnalyze({
      diff: diff.trim(),
      changedFile: changedFile.trim(),
      changedFunction: changedFunction.trim(),
      description: description.trim() || "Code modification",
      repoUrl: isGH ? repoUrl.trim() : undefined,
      repoPath: !isGH && repoUrl.trim() ? repoUrl.trim() : undefined,
      repoContext: repoContext || undefined,
    });
  };

  const isValid = diff.trim() && changedFile.trim() && changedFunction.trim();

  return (
    <div className="flex flex-col h-full p-4 space-y-4 overflow-y-auto">
      <div>
        <label className="text-xs font-medium uppercase tracking-wider text-zinc-500">
          Repository
        </label>
        <p className="text-[11px] text-zinc-600 mt-1 mb-2">
          Paste a GitHub URL or enter a local path, then scan to auto-discover the structure.
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={repoUrl}
            onChange={(e) => {
              setRepoUrl(e.target.value);
              setScanResult(null);
              setScanError(null);
              setRepoContext(null);
            }}
            placeholder="https://github.com/user/repo or ./my-project"
            disabled={isStreaming || isScanning}
            className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-mono text-text-primary placeholder:text-zinc-600 focus:outline-none focus:border-white/20 disabled:opacity-50"
          />
          <button
            onClick={handleScan}
            disabled={isStreaming || isScanning || !repoUrl.trim()}
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-text-primary hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
          >
            {isScanning ? "Cloning..." : "Scan"}
          </button>
        </div>

        {scanResult && (
          <div className="mt-2 rounded-lg border border-risk-low/30 bg-risk-low/5 p-2 text-xs">
            <span className="text-risk-low font-medium">
              Found {scanResult.services} service{scanResult.services !== 1 ? "s" : ""}, {scanResult.sharedModules} shared module{scanResult.sharedModules !== 1 ? "s" : ""}
            </span>
            {scanResult.warnings.length > 0 && (
              <span className="ml-2 text-amber-400">{scanResult.warnings.length} warning{scanResult.warnings.length !== 1 ? "s" : ""}</span>
            )}
          </div>
        )}
        {scanError && (
          <div className="mt-2 rounded-lg border border-risk-high/30 bg-risk-high/5 p-2 text-xs text-risk-high">
            {scanError}
          </div>
        )}
      </div>

      <div>
        <label className="text-xs font-medium uppercase tracking-wider text-zinc-500">
          Changed File
        </label>
        <input
          type="text"
          value={changedFile}
          onChange={(e) => setChangedFile(e.target.value)}
          placeholder="src/services/auth.ts"
          disabled={isStreaming}
          className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-mono text-text-primary placeholder:text-zinc-600 focus:outline-none focus:border-white/20 disabled:opacity-50"
        />
      </div>

      <div>
        <label className="text-xs font-medium uppercase tracking-wider text-zinc-500">
          Changed Function / Component
        </label>
        <input
          type="text"
          value={changedFunction}
          onChange={(e) => setChangedFunction(e.target.value)}
          placeholder="handleLogin"
          disabled={isStreaming}
          className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-mono text-text-primary placeholder:text-zinc-600 focus:outline-none focus:border-white/20 disabled:opacity-50"
        />
      </div>

      <div>
        <label className="text-xs font-medium uppercase tracking-wider text-zinc-500">
          Change Description
        </label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Changed the function signature"
          disabled={isStreaming}
          className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-text-primary placeholder:text-zinc-600 focus:outline-none focus:border-white/20 disabled:opacity-50"
        />
      </div>

      <div>
        <label className="text-xs font-medium uppercase tracking-wider text-zinc-500">
          Diff / Patch
        </label>
        <textarea
          value={diff}
          onChange={(e) => setDiff(e.target.value)}
          placeholder={`@@ -5,7 +5,7 @@\n function handleLogin(req, res) {\n-  const user = await db.findUser(req.body.email);\n+  const user = await db.findUser(req.body.email, req.body.tenantId);\n   if (!user) return res.status(401);`}
          disabled={isStreaming}
          rows={8}
          className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-mono text-text-primary placeholder:text-zinc-600 focus:outline-none focus:border-white/20 disabled:opacity-50 resize-y leading-relaxed"
        />
      </div>

      {diff && <DiffViewer diff={diff} />}

      <button
        onClick={handleAnalyze}
        disabled={isStreaming || !isValid}
        className="w-full rounded-lg bg-white/10 py-2.5 text-sm font-medium text-text-primary transition-colors hover:bg-white/15 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {isStreaming ? "Analyzing..." : "Analyze Impact"}
      </button>

      {!scanResult && (
        <p className="text-xs text-zinc-600 text-center">
          Scan a repository first, or just paste your diff — the demo repo context will be used as fallback.
        </p>
      )}
    </div>
  );
}
