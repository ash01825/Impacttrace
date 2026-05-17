import { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAnalysisStream } from "./hooks/useAnalysisStream";
import { useAnalysisStore } from "./store/analysisStore";
import BlastRadiusMap from "./components/graph/BlastRadiusMap";
import ImpactSummary from "./components/summary/ImpactSummary";
import NodeDetailPanel from "./components/detail/NodeDetailPanel";
import ReportExport from "./components/analysis/ReportExport";
import AnalysisHistory from "./components/analysis/AnalysisHistory";
import CodebaseHealth from "./components/analysis/CodebaseHealth";
import RiskScore from "./components/header/RiskScore";
import ProgressIndicator from "./components/header/ProgressIndicator";
import DiffInputPanel from "./components/analyze/DiffInputPanel";
import ParsedFileList from "./components/analyze/ParsedFileList";
import type { ImpactPath, GraniteResponse } from "./types";
import { CircleNotch, Robot } from "@phosphor-icons/react";

export default function App() {
  const { currentRepoContext, currentRepoName, addAnalysis } = useAnalysisStore();
  const [diff, setDiff] = useState("");
  const [description, setDescription] = useState("");
  const [changedFiles, setChangedFiles] = useState<string[]>([]);
  const [selectedNode, setSelectedNode] = useState<ImpactPath | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const handleAnalysisComplete = useCallback(
    (resp: GraniteResponse) => {
      addAnalysis({
        id: crypto.randomUUID(),
        repoName: currentRepoName || "unknown",
        repoUrl: "",
        diff,
        description,
        overallRisk: resp.overallRisk,
        affectedCount: resp.affectedCount,
        impactPaths: resp.impactPaths,
        summary: resp.summary,
        codebaseInsights: resp.codebaseInsights,
        modelInfo: resp.modelInfo,
        timestamp: Date.now(),
      });
    },
    [currentRepoName, diff, description, addAnalysis]
  );

  const { impactPaths, response, currentPhase, isStreaming, error, startAnalysis, reset } =
    useAnalysisStream(handleAnalysisComplete);

  const handleAnalyze = useCallback(() => {
    if (!diff.trim() || !currentRepoContext) return;
    reset();
    setSelectedNode(null);
    setSelectedNodeId(null);
    const parsed = changedFiles.map((f) => {
      const base = f.split("/").pop()?.replace(/\.[^.]*$/, "") || f;
      return { filePath: f, changedFunctions: [base] };
    });
    startAnalysis({
      diff,
      description: description || "Code modification",
      repoContext: currentRepoContext,
      parsedFiles: parsed.length > 0 ? { files: parsed } : undefined,
    });
  }, [diff, description, changedFiles, currentRepoContext, startAnalysis, reset]);

  const responseChangedFiles = response?.changedFiles || [];

  return (
    <div className="flex h-full bg-bg-primary font-sans text-text-primary">
      {/* Left: Input */}
      <div className="flex w-80 shrink-0 flex-col border-r border-zinc-800 bg-bg-surface">
        <div className="border-b border-zinc-800 px-5 py-4">
          <h2 className="text-sm font-semibold">Context Input</h2>
          {currentRepoName ? (
            <p className="mt-1 font-mono text-xs text-text-muted truncate">{currentRepoName}</p>
          ) : (
            <p className="mt-1 text-xs text-risk-high">No repository selected</p>
          )}
        </div>

        <div className="flex-1 space-y-6 overflow-auto p-5">
          <DiffInputPanel
            value={diff}
            onChange={setDiff}
            onFilesDetected={setChangedFiles}
            description={description}
            onDescriptionChange={setDescription}
          />

          {changedFiles.length > 0 && <ParsedFileList files={changedFiles} />}

          <button
            onClick={handleAnalyze}
            disabled={!diff.trim() || !currentRepoContext || isStreaming}
            className="btn-primary w-full py-3 flex justify-center items-center"
          >
            {isStreaming ? (
              <span className="flex items-center gap-2">
                <CircleNotch size={16} className="animate-spin" />
                Analyzing...
              </span>
            ) : (
              "Compute Impact"
            )}
          </button>

          {error && (
            <div className="border border-risk-high/30 bg-risk-high/10 p-3 rounded-lg text-sm text-risk-high">
              {error}
            </div>
          )}

          <CodebaseHealth />
          <AnalysisHistory />
        </div>
      </div>

      {/* Center: Graph */}
      <div className="relative flex flex-1 flex-col min-w-0 bg-bg-primary">
        {/* Top bar */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4 bg-bg-surface">
          <div className="flex items-center gap-6">
            <RiskScore risk={response?.overallRisk || null} />
            <ProgressIndicator phase={currentPhase} isStreaming={isStreaming} nodeCount={impactPaths.length} />
          </div>
          <div className="flex items-center gap-4">
            {response && (
              <ReportExport
                response={response}
                repoName={currentRepoName || "unknown"}
                changedFiles={responseChangedFiles.length > 0 ? responseChangedFiles : changedFiles}
                diff={diff}
              />
            )}
            <a href="https://bob.ibm.com/" target="_blank" rel="noopener noreferrer" className="text-xs text-[#0f62fe] bg-[#0f62fe]/10 border border-[#0f62fe]/20 flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm font-medium hover:bg-[#0f62fe]/20 transition-colors">
              <Robot size={14} weight="fill" /> IBM Bob
            </a>
          </div>
        </div>

        {/* Graph */}
        <div className="relative flex-1">
          <BlastRadiusMap
            response={response}
            streamingPaths={impactPaths}
            changedFiles={responseChangedFiles.length > 0 ? responseChangedFiles : changedFiles}
            onNodeClick={(path) => {
              setSelectedNode(path);
              setSelectedNodeId(path?.component || null);
            }}
            selectedNodeId={selectedNodeId}
          />
          {response?.summary && <ImpactSummary response={response} />}
        </div>
      </div>

      {/* Right: Detail */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 340, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="shrink-0 border-l border-zinc-800 bg-bg-surface overflow-hidden"
          >
            <NodeDetailPanel
              path={selectedNode}
              onClose={() => { setSelectedNode(null); setSelectedNodeId(null); }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
