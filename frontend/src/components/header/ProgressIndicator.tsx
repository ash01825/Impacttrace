import { motion, AnimatePresence } from "framer-motion";
import { PhaseData } from "@/types";

interface ProgressIndicatorProps {
  phase: PhaseData | null;
  isStreaming: boolean;
  nodeCount: number;
}

export default function ProgressIndicator({
  phase,
  isStreaming,
  nodeCount,
}: ProgressIndicatorProps) {
  if (!isStreaming && !phase) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={phase?.phase || "idle"}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className="flex items-center gap-3 text-sm"
      >
        {isStreaming && (
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
            <span className="text-zinc-400">{phase?.label || "Analyzing..."}</span>
          </div>
        )}
        {nodeCount > 0 && (
          <span className="font-mono text-xs text-zinc-600">
            {nodeCount} component{nodeCount !== 1 ? "s" : ""} found
          </span>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
