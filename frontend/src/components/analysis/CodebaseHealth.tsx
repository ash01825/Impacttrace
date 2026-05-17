import { useAnalysisStore } from "@/store/analysisStore";
import { Graph, TreeStructure, ShareNetwork, WarningCircle } from "@phosphor-icons/react";

export default function CodebaseHealth() {
  const { scannedRepos, recentAnalyses } = useAnalysisStore();

  const latestRepo = scannedRepos[0];

  // Compute risk distribution
  const riskCounts = { high: 0, medium: 0, low: 0 };
  for (const a of recentAnalyses) {
    riskCounts[a.overallRisk]++;
  }
  const totalAnalyses = recentAnalyses.length;

  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-white/20 mb-5">
        Codebase Health
      </h3>

      {latestRepo ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <MetricCard
              icon={<TreeStructure size={14} weight="fill" />}
              value={latestRepo.serviceCount}
              label="Services"
              color="#0f62fe"
            />
            <MetricCard
              icon={<ShareNetwork size={14} weight="fill" />}
              value={latestRepo.moduleCount}
              label="Shared Modules"
              color="#f59e0b"
            />
          </div>

          {totalAnalyses > 0 && (
            <>
              <div className="border-t border-white/[0.03] pt-3">
                <div className="text-[10px] font-medium text-white/25 uppercase tracking-wider mb-2">
                  Risk Distribution
                </div>
                <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-white/[0.03]">
                  {riskCounts.high > 0 && (
                    <div
                      className="bg-red-500/60 h-full"
                      style={{ width: `${(riskCounts.high / totalAnalyses) * 100}%` }}
                    />
                  )}
                  {riskCounts.medium > 0 && (
                    <div
                      className="bg-amber-500/60 h-full"
                      style={{ width: `${(riskCounts.medium / totalAnalyses) * 100}%` }}
                    />
                  )}
                  {riskCounts.low > 0 && (
                    <div
                      className="bg-teal-400/60 h-full"
                      style={{ width: `${(riskCounts.low / totalAnalyses) * 100}%` }}
                    />
                  )}
                </div>
                <div className="flex gap-4 mt-2">
                  <RiskLabel color="#ef4444" count={riskCounts.high} label="High" />
                  <RiskLabel color="#f59e0b" count={riskCounts.medium} label="Medium" />
                  <RiskLabel color="#2dd4bf" count={riskCounts.low} label="Low" />
                </div>
              </div>
            </>
          )}

          {latestRepo.context.sharedModules?.length > 0 && (
            <div className="border-t border-white/[0.03] pt-3">
              <div className="text-[10px] font-medium text-white/25 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <WarningCircle size={10} weight="fill" style={{ color: "#f59e0b" }} />
                Shared Modules
              </div>
              <div className="space-y-1">
                {latestRepo.context.sharedModules.slice(0, 3).map((m) => (
                  <div key={m.path} className="text-[10px] text-white/30 truncate flex items-center gap-1.5">
                    <span className="text-white/10">•</span>
                    {m.path}
                    <span className="text-white/10 ml-auto text-[9px]">
                      used by {m.consumedBy.length}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-6">
          <Graph size={24} className="mx-auto text-white/[0.06] mb-2" />
          <p className="text-xs text-white/15">Scan a repository to see health metrics</p>
        </div>
      )}
    </div>
  );
}

function MetricCard({
  icon,
  value,
  label,
  color,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  color: string;
}) {
  return (
    <div
      className="rounded-lg border border-white/[0.03] bg-white/[0.01] px-3 py-2.5"
    >
      <div className="flex items-center gap-2 mb-1">
        <span style={{ color }}>{icon}</span>
        <span className="text-lg font-semibold text-white">{value}</span>
      </div>
      <div className="text-[10px] text-white/20">{label}</div>
    </div>
  );
}

function RiskLabel({
  color,
  count,
  label,
}: {
  color: string;
  count: number;
  label: string;
}) {
  return (
    <div className="flex items-center gap-1">
      <div className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      <span className="text-[9px] text-white/30">
        {count} {label}
      </span>
    </div>
  );
}
