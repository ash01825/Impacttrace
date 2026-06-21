import { Handle, Position } from "reactflow";

const RISK_MAP: Record<string, { border: string; bg: string; text: string }> = {
  low: { border: "#34D399", bg: "rgba(52, 211, 153, 0.05)", text: "#34D399" },
  medium: { border: "#FBBF24", bg: "rgba(251, 191, 36, 0.05)", text: "#FBBF24" },
  high: { border: "#F87171", bg: "rgba(248, 113, 113, 0.1)", text: "#F87171" },
};

export default function ImpactNode({ data }: { data: Record<string, unknown> }) {
  const riskLevel = (data.riskLevel as string) || "low";
  const isChanged = !!data.isCenter;
  const cfg = isChanged
    ? { border: "#FAFAFA", bg: "rgba(250, 250, 250, 0.1)", text: "#FAFAFA" }
    : RISK_MAP[riskLevel] ?? RISK_MAP.low;
  const label = String(data.label || data.fullPath || "node");
  const depType = String(data.dependencyType || "");

  return (
    <div className={`relative cursor-pointer transition-all duration-200 hover:scale-105 ${data.isSelected ? 'scale-105 z-10' : ''}`} style={{ minWidth: 200, maxWidth: 280 }}>
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />

      <div
        className={`px-4 py-3 rounded-lg backdrop-blur-md shadow-lg transition-all ${
          (data.isImplicit as boolean) ? 'border-dashed' : 'border-solid'
        }`}
        style={{
          background: cfg.bg,
          borderWidth: "1px",
          borderColor: data.isSelected ? cfg.border : "rgba(255,255,255,0.05)",
          borderLeftColor: cfg.border,
          borderLeftWidth: "4px",
          boxShadow: data.isSelected ? `0 0 20px ${cfg.bg}` : "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
        }}
      >
        <div className="flex flex-col gap-2 mb-2">
          <span className="font-mono text-xs font-semibold break-words text-text-primary leading-tight">
            {label}
          </span>
          
          <div className="flex flex-wrap items-center gap-2">
            {depType && (
              <span className="font-sans text-[9px] text-zinc-400 uppercase tracking-wider bg-black/20 px-1.5 py-0.5 rounded-sm">
                {depType.replace(/_/g, " ")}
              </span>
            )}
            {!isChanged && (data.isImplicit as boolean) && (
              <span className="border border-emerald-500/30 text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-sm animate-pulse">
                AI Discovery
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
