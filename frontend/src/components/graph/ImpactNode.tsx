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
    <div className="relative cursor-pointer transition-colors" style={{ minWidth: 180 }}>
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />

      <div
        className="px-3 py-2 border rounded-sm"
        style={{
          background: cfg.bg,
          borderColor: data.isSelected ? cfg.text : "transparent",
          borderLeftColor: cfg.border,
          borderLeftWidth: "4px",
        }}
      >
        <div className="flex justify-between items-start gap-4 mb-2">
          <span className="font-mono text-xs font-semibold break-all text-text-primary">
            {label}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {depType && (
            <span className="font-mono text-[10px] text-text-muted uppercase tracking-wider">
              {depType.replace(/_/g, " ")}
            </span>
          )}
          {!isChanged && (data.isImplicit as boolean) && (
            <span className="border border-zinc-700 px-1 text-[9px] uppercase tracking-wider text-text-secondary">
              Implicit
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
