import { X } from "@phosphor-icons/react";
import type { ImpactPath } from "@/types";

interface Props {
  path: ImpactPath;
  onClose: () => void;
}

export default function NodeDetailPanel({ path, onClose }: Props) {
  const isImplicit = path.dependencyType === "behavioral_contract" || path.dependencyType === "shared_state";

  const riskClass = 
    path.riskLevel === "high" ? "text-risk-high border-risk-high/30 bg-risk-high/10" :
    path.riskLevel === "medium" ? "text-risk-medium border-risk-medium/30 bg-risk-medium/10" :
    "text-risk-low border-risk-low/30 bg-risk-low/10";

  return (
    <div className="flex h-full w-[340px] flex-col overflow-hidden bg-bg-surface">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
        <h3 className="font-semibold text-sm">Node Details</h3>
        <button
          onClick={onClose}
          className="text-text-muted hover:text-text-primary transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-8">
        {/* Component info */}
        <div>
          <div className="text-xs font-medium text-text-muted mb-2 uppercase tracking-wider">Component</div>
          <div className="font-mono text-sm break-all mb-1">{path.component}</div>
          {path.affectedFile && (
            <div className="font-mono text-xs text-text-secondary">
              {path.affectedFile}{path.affectedLine ? `:${path.affectedLine}` : ""}
            </div>
          )}
        </div>

        {/* Badges */}
        <div className="flex gap-4">
          <div>
            <div className="text-xs font-medium text-text-muted mb-2 uppercase tracking-wider">Risk</div>
            <div className={`px-2 py-1 text-xs font-mono font-bold uppercase inline-block border ${riskClass}`}>
              {path.riskLevel}
            </div>
          </div>
          <div>
            <div className="text-xs font-medium text-text-muted mb-2 uppercase tracking-wider">Type</div>
            <div className="px-2 py-1 text-xs border border-zinc-700 text-text-secondary inline-block">
              {isImplicit ? "Implicit" : "Explicit"}
            </div>
          </div>
        </div>

        {/* Explanation */}
        <div>
          <div className="text-xs font-medium text-text-muted mb-2 uppercase tracking-wider">IBM Bob Analysis</div>
          <p className="text-sm leading-relaxed text-text-secondary">
            {path.explanation}
          </p>
        </div>

        {/* Remediation */}
        <div>
          <div className="text-xs font-medium text-text-muted mb-2 uppercase tracking-wider">Suggested Fix</div>
          <p className="text-sm leading-relaxed text-text-secondary">
            {path.remediation}
          </p>
        </div>
      </div>
    </div>
  );
}
