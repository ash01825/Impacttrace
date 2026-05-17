import { Scenario } from "@/types";

interface ScenarioSelectorProps {
  scenarios: Scenario[];
  selectedId: string | null;
  onSelect: (scenario: Scenario) => void;
  disabled: boolean;
}

export default function ScenarioSelector({
  scenarios,
  selectedId,
  onSelect,
  disabled,
}: ScenarioSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-medium uppercase tracking-wider text-zinc-500">
        Select Scenario
      </label>
      {scenarios.map((scenario) => (
        <button
          key={scenario.id}
          onClick={() => onSelect(scenario)}
          disabled={disabled}
          className={`w-full rounded-lg border p-3 text-left transition-colors ${
            selectedId === scenario.id
              ? "border-white/20 bg-white/10"
              : "border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/5"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <div className="text-sm font-medium text-text-primary">{scenario.name}</div>
          <div className="mt-1 text-xs text-zinc-500">{scenario.description}</div>
          <div className="mt-1 font-mono text-[11px] text-zinc-600">
            {scenario.changedFile}
          </div>
        </button>
      ))}
    </div>
  );
}
