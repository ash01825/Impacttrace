import { motion, AnimatePresence } from "framer-motion";
import type { PhaseData } from "@/types";


const PHASES = [
  { key: "identifying_direct_dependencies", label: "Direct deps" },
  { key: "analyzing_transitive_dependencies", label: "Transitive" },
  { key: "detecting_behavioral_contracts", label: "Contracts" },
  { key: "computing_risk_scores", label: "Risk scores" },
];

interface Props {
  phase: PhaseData | null;
  isStreaming: boolean;
  nodeCount: number;
}

export default function ProgressIndicator({ phase, isStreaming, nodeCount }: Props) {
  if (!isStreaming && !phase) return null;

  const currentIdx = PHASES.findIndex((p) => p.key === phase?.phase);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={phase?.phase || "idle"}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center gap-3"
      >
        {isStreaming && (
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-xs text-text-secondary">{phase?.label || "Analyzing..."}</span>
          </div>
        )}
        {nodeCount > 0 && (
          <span className="font-mono text-xs text-text-muted">
            {nodeCount} component{nodeCount !== 1 ? "s" : ""}
          </span>
        )}
        {isStreaming && PHASES.length > 0 && (
          <div className="hidden sm:flex items-center gap-1">
            {PHASES.map((p, i) => {
              const done = i < currentIdx;
              const active = i === currentIdx;
              return (
                <div key={p.key} className="flex items-center gap-1">
                  <div className={`h-1 w-1 rounded-full transition-all duration-500 ${
                    done ? "bg-teal-400" : active ? "bg-amber-400 animate-pulse" : "bg-white/10"
                  }`} />
                  {i < PHASES.length - 1 && (
                    <div className={`h-px w-3 transition-all duration-500 ${done ? "bg-teal-400/40" : "bg-white/6"}`} />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
