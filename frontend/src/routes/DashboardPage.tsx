import { useState } from "react";
import { Link } from "react-router-dom";
import { useAnalysisStore } from "../store/analysisStore";
import { ArrowRight, HardDrives, Scan, Folder, WarningCircle, CircleNotch } from "@phosphor-icons/react";

const API_BASE = "/api";

export default function DashboardPage() {
  const [repoUrl, setRepoUrl] = useState("");
  const [repoPath, setRepoPath] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<"url" | "path">("url");

  const { scannedRepos, addScannedRepo, setCurrentRepo } = useAnalysisStore();

  const handleScan = async () => {
    const input = inputMode === "url" ? repoUrl.trim() : repoPath.trim();
    if (!input) return;
    setScanning(true);
    setScanError(null);
    try {
      const endpoint = inputMode === "url" ? "/clone-and-scan" : "/scan-repo";
      const body = inputMode === "url" ? { repoUrl: input } : { repoPath: input };
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Scan failed");
      }
      const data = await res.json();
      addScannedRepo({
        id: Date.now().toString(),
        name: inputMode === "url" ? extractRepoName(input) : input.split("/").pop() || input,
        url: input,
        context: data.repoContext,
        serviceCount: data.serviceCount || 0,
        moduleCount: data.sharedModuleCount || 0,
        scannedAt: Date.now(),
      });
      setRepoUrl("");
      setRepoPath("");
    } catch (err) {
      setScanError(err instanceof Error ? err.message : "Scan failed");
    } finally {
      setScanning(false);
    }
  };

  const handleLoadDemo = async () => {
    setScanning(true);
    setScanError(null);
    try {
      const res = await fetch(`${API_BASE}/repo-context`);
      if (!res.ok) throw new Error("Failed to load demo repository");
      const data = await res.json();
      const context = {
        services: data.services || [],
        sharedModules: data.sharedModules || [],
      };
      addScannedRepo({
        id: "demo",
        name: "demo-monorepo",
        url: "local://demo-repo",
        context,
        serviceCount: context.services.length,
        moduleCount: context.sharedModules.length,
        scannedAt: Date.now(),
      });
      setCurrentRepo(context, "demo-monorepo");
    } catch (err) {
      setScanError(err instanceof Error ? err.message : "Failed to load demo");
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="flex h-full flex-col bg-bg-primary overflow-hidden">
      {/* Header */}
      <header className="border-b border-zinc-800 px-8 py-6 flex items-center justify-between bg-bg-surface">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Repository Context</h1>
          <p className="text-sm text-text-muted mt-1">Import repositories to build the context graph.</p>
        </div>
        <Link to="/analyze" className="btn-primary rounded-sm flex items-center gap-2 text-sm">
          Go to Analyze <ArrowRight />
        </Link>
      </header>

      <div className="flex-1 overflow-auto p-8 max-w-5xl mx-auto w-full space-y-12">
        {/* Import section */}
        <section>
          <div className="border border-zinc-700 bg-bg-surface p-8">
            <h2 className="text-base font-semibold mb-6">Import source code</h2>
            
            <div className="flex gap-6 items-start">
              <div className="flex-1 space-y-4">
                {/* Tabs */}
                <div className="flex gap-4 border-b border-zinc-800 pb-2">
                  {(["url", "path"] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setInputMode(mode)}
                      className={`text-sm pb-2 mb-[-10px] transition-colors border-b-2 ${
                        inputMode === mode
                          ? "border-text-primary text-text-primary font-medium"
                          : "border-transparent text-text-muted hover:text-text-secondary"
                      }`}
                    >
                      {mode === "url" ? "GitHub URL" : "Local Path"}
                    </button>
                  ))}
                </div>

                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                      {inputMode === "url" ? <HardDrives /> : <Folder />}
                    </div>
                    <input
                      type="text"
                      value={inputMode === "url" ? repoUrl : repoPath}
                      onChange={(e) => inputMode === "url" ? setRepoUrl(e.target.value) : setRepoPath(e.target.value)}
                      placeholder={inputMode === "url" ? "https://github.com/owner/repo" : "/Users/you/Projects/repo"}
                      className="w-full bg-bg-primary border border-zinc-700 px-4 py-2 pl-10 text-sm focus:outline-none focus:border-text-primary transition-colors"
                      onKeyDown={(e) => e.key === "Enter" && handleScan()}
                    />
                  </div>
                  <button
                    onClick={handleScan}
                    disabled={scanning || (!repoUrl.trim() && !repoPath.trim())}
                    className="btn-primary text-sm flex items-center gap-2"
                  >
                    {scanning ? <CircleNotch className="animate-spin" /> : <Scan />}
                    Scan Context
                  </button>
                </div>

                {scanError && (
                  <div className="flex items-center gap-2 text-risk-high text-sm p-3 bg-risk-high/10 border border-risk-high/20">
                    <WarningCircle /> {scanError}
                  </div>
                )}
              </div>

              {/* Demo quick load */}
              <div className="w-72 border-l border-zinc-800 pl-6 flex flex-col justify-center">
                <h3 className="text-sm font-semibold mb-2">Quick Start</h3>
                <p className="text-xs text-text-muted mb-4 leading-relaxed">
                  Use our sample monorepo pre-configured with engineered implicit dependencies.
                </p>
                <button
                  onClick={handleLoadDemo}
                  disabled={scanning}
                  className="btn-secondary text-xs w-full justify-center text-center"
                >
                  Load Demo Repository
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Scanned repos */}
        {scannedRepos.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-widest mb-4">Indexed Contexts</h2>
            <div className="border border-zinc-700">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-700 bg-bg-surface text-xs text-text-muted uppercase">
                    <th className="px-4 py-3 font-medium">Repository</th>
                    <th className="px-4 py-3 font-medium">Services</th>
                    <th className="px-4 py-3 font-medium">Modules</th>
                    <th className="px-4 py-3 font-medium">Indexed Date</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-border-subtle">
                  {scannedRepos.map((repo) => (
                    <tr key={repo.id} className="hover:bg-bg-surface transition-colors">
                      <td className="px-4 py-4 font-mono text-text-primary">{repo.name}</td>
                      <td className="px-4 py-4 text-text-secondary">{repo.serviceCount}</td>
                      <td className="px-4 py-4 text-text-secondary">{repo.moduleCount}</td>
                      <td className="px-4 py-4 text-text-muted">{new Date(repo.scannedAt).toLocaleDateString()}</td>
                      <td className="px-4 py-4 text-right">
                        <Link
                          to="/analyze"
                          onClick={() => setCurrentRepo(repo.context, repo.name)}
                          className="text-text-primary hover:underline text-xs font-medium inline-flex items-center gap-1"
                        >
                          Analyze <ArrowRight />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function extractRepoName(url: string): string {
  const match = url.match(/github\.com\/([^/]+\/[^/]+)/);
  return match ? match[1].replace(/\.git$/, "") : url;
}
