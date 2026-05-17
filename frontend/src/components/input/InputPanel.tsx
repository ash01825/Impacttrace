import { useState, useEffect } from "react";
import { Scenario } from "@/types";
import ScenarioSelector from "./ScenarioSelector";
import DiffViewer from "./DiffViewer";

interface InputPanelProps {
  onAnalyze: (diff: string, changedFile: string, changedFunction: string, description: string) => void;
  isStreaming: boolean;
}

export default function InputPanel({ onAnalyze, isStreaming }: InputPanelProps) {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);

  useEffect(() => {
    fetch("/api/scenarios")
      .then((res) => res.json())
      .then(setScenarios)
      .catch(() => {});
  }, []);

  const handleSelect = (scenario: Scenario) => {
    setSelectedId(scenario.id);
    setSelectedScenario(scenario);
  };

  const handleAnalyze = () => {
    if (!selectedScenario) return;
    onAnalyze(
      selectedScenario.diffSnippet,
      selectedScenario.changedFile,
      selectedScenario.changedFunction,
      selectedScenario.description
    );
  };

  return (
    <div className="flex flex-col h-full p-4 space-y-4">
      <ScenarioSelector
        scenarios={scenarios}
        selectedId={selectedId}
        onSelect={handleSelect}
        disabled={isStreaming}
      />

      {selectedScenario && (
        <>
          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Change Preview
            </label>
            <div className="mt-2 flex items-center gap-2 font-mono text-xs text-zinc-400">
              <span className="rounded bg-white/5 px-1.5 py-0.5">{selectedScenario.changedFile}</span>
              <span className="text-zinc-600">→</span>
              <span className="rounded bg-white/5 px-1.5 py-0.5">{selectedScenario.changedFunction}</span>
            </div>
          </div>

          <DiffViewer diff={selectedScenario.diffSnippet} />

          <button
            onClick={handleAnalyze}
            disabled={isStreaming}
            className="w-full rounded-lg bg-white/10 py-2.5 text-sm font-medium text-text-primary transition-colors hover:bg-white/15 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isStreaming ? "Analyzing..." : "Analyze Impact"}
          </button>
        </>
      )}
    </div>
  );
}
