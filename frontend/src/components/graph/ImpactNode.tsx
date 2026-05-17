import { Handle, Position } from "reactflow";
import type { ImpactPath } from "@/types";

interface ImpactNodeData {
  path: ImpactPath;
  isChanged?: boolean;
  isImplicit?: boolean;
  onSelect?: (path: ImpactPath) => void;
  isSelected?: boolean;
}

const RISK_MAP = {
  low: { border: "#34D399", bg: "rgba(52, 211, 153, 0.05)", text: "#34D399" },
  medium: { border: "#FBBF24", bg: "rgba(251, 191, 36, 0.05)", text: "#FBBF24" },
  high: { border: "#F87171", bg: "rgba(248, 113, 113, 0.1)", text: "#F87171" },
};

const CHANGED_STYLE = { border: "#FAFAFA", bg: "rgba(250, 250, 250, 0.1)", text: "#FAFAFA" };

export default function ImpactNode({ data }: { data: ImpactNodeData }) {
  const { path, isChanged, isImplicit, onSelect, isSelected } = data;
  const cfg = isChanged ? CHANGED_STYLE : RISK_MAP[path.riskLevel] ?? RISK_MAP.low;

  return (
    <div
      onClick={() => !isChanged && onSelect?.(path)}
      className="relative cursor-pointer transition-colors"
      style={{ minWidth: 180 }}
    >
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />

      <div
        className="px-3 py-2 border"
        style={{
          background: cfg.bg,
          borderColor: isSelected ? cfg.text : "transparent",
          borderLeftColor: cfg.border,
          borderLeftWidth: "4px",
        }}
      >
        <div className="flex justify-between items-start gap-4 mb-2">
          <span className="font-mono text-xs font-semibold break-all text-text-primary">
            {path.component}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[10px] text-text-muted uppercase tracking-wider">
            {path.dependencyType.replace(/_/g, " ")}
          </span>
          {isImplicit && (
            <span className="border border-zinc-700 px-1 text-[9px] uppercase tracking-wider text-text-secondary">
              Implicit
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
