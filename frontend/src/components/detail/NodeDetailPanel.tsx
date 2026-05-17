import { motion, AnimatePresence } from "framer-motion";
import { ImpactPath } from "@/types";
import { getRiskColor } from "../graph/graphUtils";

interface NodeDetailPanelProps {
  path: ImpactPath | null;
  onClose: () => void;
}

export default function NodeDetailPanel({ path, onClose }: NodeDetailPanelProps) {
  return (
    <AnimatePresence>
      {path && (
        <motion.div
          initial={{ x: 320, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 320, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="flex flex-col h-full p-4 space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-text-primary">Bob's Analysis</h2>
              <span className="text-[10px] font-medium text-[#0f62fe] bg-[#0f62fe]/10 rounded px-1.5 py-0.5">IBM Bob</span>
            </div>
            <button
              onClick={onClose}
              className="rounded p-1 text-zinc-500 hover:text-text-primary hover:bg-white/5 transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-medium uppercase tracking-wider text-zinc-600">
                Component
              </label>
              <p className="mt-1 font-mono text-sm text-text-primary">{path.component}</p>
            </div>

            <div className="flex gap-3">
              <Badge
                label="Dependency"
                value={path.dependencyType.replace(/_/g, " ")}
                color="#e4e4e7"
              />
              <Badge
                label="Risk"
                value={path.riskLevel}
                color={getRiskColor(path.riskLevel)}
              />
            </div>

            {path.affectedFile && (
              <div>
                <label className="text-[10px] font-medium uppercase tracking-wider text-zinc-600">
                  Affected File
                </label>
                <p className="mt-1 font-mono text-xs text-amber-400">{path.affectedFile}</p>
                {path.affectedLine && (
                  <p className="font-mono text-[11px] text-zinc-600">
                    Line {path.affectedLine}
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="text-[10px] font-medium uppercase tracking-wider text-zinc-600">
                Explanation
              </label>
              <p className="mt-1 text-sm leading-relaxed text-zinc-300">
                {path.explanation}
              </p>
            </div>

            <div>
              <label className="text-[10px] font-medium uppercase tracking-wider text-zinc-600">
                Remediation
              </label>
              <p className="mt-1 text-sm leading-relaxed text-zinc-300">
                {path.remediation}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Badge({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="flex-1">
      <label className="text-[10px] font-medium uppercase tracking-wider text-zinc-600">
        {label}
      </label>
      <div
        className="mt-1 inline-block rounded px-2 py-0.5 text-xs font-medium capitalize"
        style={{
          background: `${color}15`,
          color,
          border: `1px solid ${color}30`,
        }}
      >
        {value}
      </div>
    </div>
  );
}
