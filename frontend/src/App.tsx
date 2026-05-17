import { useState, useCallback } from "react";
import AppShell from "./components/layout/AppShell";
import InputPanel from "./components/input/InputPanel";
import CustomInput from "./components/input/CustomInput";
import BlastRadiusMap from "./components/graph/BlastRadiusMap";
import RiskScore from "./components/header/RiskScore";
import ProgressIndicator from "./components/header/ProgressIndicator";
import ImpactSummary from "./components/summary/ImpactSummary";
import NodeDetailPanel from "./components/detail/NodeDetailPanel";
import ReportExport from "./components/export/ReportExport";
import { useAnalysisStream } from "./hooks/useAnalysisStream";
import { ImpactPath, RepoContext } from "./types";

type InputMode = "demo" | "custom";

export default function App() {
  const {
    impactPaths,
    currentPhase,
    response,
    isStreaming,
    error,
    startAnalysis,
    reset,
  } = useAnalysisStream();

  const [selectedPath, setSelectedPath] = useState<ImpactPath | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<InputMode>("demo");

  const overallRisk = response?.overallRisk || null;

  const handleAnalyzeDemo = useCallback(
    (diff: string, changedFile: string, changedFunction: string, description: string) => {
      reset();
      setSelectedPath(null);
      setSelectedNodeId(null);
      startAnalysis({ diff, changedFile, changedFunction, description });
    },
    [startAnalysis, reset]
  );

  const handleAnalyzeCustom = useCallback(
    (params: {
      diff: string;
      changedFile: string;
      changedFunction: string;
      description: string;
      repoPath?: string;
      repoUrl?: string;
      repoContext?: RepoContext;
    }) => {
      reset();
      setSelectedPath(null);
      setSelectedNodeId(null);
      startAnalysis(params);
    },
    [startAnalysis, reset]
  );

  const handleNodeClick = useCallback((path: ImpactPath | null) => {
    setSelectedPath(path);
    setSelectedNodeId(path?.component || null);
  }, []);

  const header = (
    <div className="flex w-full items-center justify-between">
      <div className="flex items-center gap-4">
        <h1 className="font-mono text-sm font-semibold text-text-primary tracking-tight">
          ImpactTrace
        </h1>
        <span className="text-xs text-zinc-600 hidden sm:inline">
          Know what breaks before you ship
        </span>
        <div className="flex items-center gap-1.5 rounded border border-[#0f62fe]/30 bg-[#0f62fe]/10 px-2 py-0.5">
          <svg className="h-3 w-3 text-[#0f62fe]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
          </svg>
          <span className="text-[10px] font-medium text-[#0f62fe]">Powered by IBM Bob</span>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <ProgressIndicator
          phase={currentPhase}
          isStreaming={isStreaming}
          nodeCount={impactPaths.length}
        />
        <RiskScore risk={overallRisk} />
        <ReportExport response={response} impactPaths={impactPaths} />
      </div>
    </div>
  );

  const leftPanel = (
    <div className="flex flex-col h-full">
      <div className="flex border-b border-white/5">
        <button
          onClick={() => setInputMode("demo")}
          className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
            inputMode === "demo"
              ? "text-text-primary border-b border-text-primary"
              : "text-zinc-600 hover:text-zinc-400"
          }`}
        >
          Demo Scenarios
        </button>
        <button
          onClick={() => setInputMode("custom")}
          className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
            inputMode === "custom"
              ? "text-text-primary border-b border-text-primary"
              : "text-zinc-600 hover:text-zinc-400"
          }`}
        >
          Custom Repo
        </button>
      </div>
      {inputMode === "demo" ? (
        <InputPanel onAnalyze={handleAnalyzeDemo} isStreaming={isStreaming} />
      ) : (
        <CustomInput onAnalyze={handleAnalyzeCustom} isStreaming={isStreaming} />
      )}
    </div>
  );

  const center = (
    <div className="relative h-full">
      <BlastRadiusMap
        response={response}
        streamingPaths={impactPaths}
        onNodeClick={handleNodeClick}
        selectedNodeId={selectedNodeId}
      />
      <ImpactSummary response={response} />
    </div>
  );

  const rightPanel = selectedPath ? (
    <NodeDetailPanel path={selectedPath} onClose={() => handleNodeClick(null)} />
  ) : null;

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg-primary">
        <div className="text-center max-w-lg px-8">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-risk-high/10">
            <svg className="h-6 w-6 text-risk-high" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-risk-high font-mono text-sm mb-4">{error}</p>
          <button
            onClick={reset}
            className="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-text-primary hover:bg-white/15"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <AppShell
      header={header}
      leftPanel={leftPanel}
      center={center}
      rightPanel={rightPanel}
    />
  );
}
