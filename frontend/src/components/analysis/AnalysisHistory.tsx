import { useAnalysisStore } from "@/store/analysisStore";
import { Clock, Trash } from "@phosphor-icons/react";

export default function AnalysisHistory() {
  const { recentAnalyses, clearHistory } = useAnalysisStore();

  if (recentAnalyses.length === 0) {
    return (
      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-white/20 mb-4">
          Analysis History
        </h3>
        <p className="text-xs text-white/20">No analyses yet. Import a repo and run an analysis.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-white/20">
          Analysis History ({recentAnalyses.length})
        </h3>
        <button
          onClick={clearHistory}
          className="text-[10px] text-white/15 hover:text-red-400/60 transition-colors flex items-center gap-1"
        >
          <Trash size={10} />
          Clear
        </button>
      </div>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {recentAnalyses.map((entry) => (
          <div
            key={entry.id}
            className="rounded-lg border border-white/[0.03] bg-white/[0.01] px-3 py-2 flex items-center gap-3"
          >
            <div
              className="h-2 w-2 rounded-full shrink-0"
              style={{
                background:
                  entry.overallRisk === "high"
                    ? "#ef4444"
                    : entry.overallRisk === "medium"
                    ? "#f59e0b"
                    : "#2dd4bf",
              }}
            />
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-medium text-white/60 truncate">
                {entry.repoName}
              </div>
              <div className="text-[9px] text-white/15 mt-0.5 truncate">
                {entry.summary.whatChanged?.slice(0, 80)}...
              </div>
            </div>
            <div className="text-[9px] text-white/15 shrink-0 flex items-center gap-1">
              <Clock size={9} />
              {new Date(entry.timestamp).toLocaleDateString()}
            </div>
            <span
              className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full shrink-0"
              style={{
                background:
                  entry.overallRisk === "high"
                    ? "rgba(239,68,68,0.1)"
                    : entry.overallRisk === "medium"
                    ? "rgba(245,158,11,0.1)"
                    : "rgba(45,212,191,0.1)",
                color:
                  entry.overallRisk === "high"
                    ? "#ef4444"
                    : entry.overallRisk === "medium"
                    ? "#f59e0b"
                    : "#2dd4bf",
              }}
            >
              {entry.affectedCount} affected
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
