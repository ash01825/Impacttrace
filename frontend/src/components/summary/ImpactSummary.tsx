import { motion, AnimatePresence } from "framer-motion";
import type { GraniteResponse } from "@/types";

interface Props {
  response: GraniteResponse;
}

export default function ImpactSummary({ response }: Props) {
  if (!response?.summary) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 w-full max-w-3xl"
      >
        <div className="bg-bg-primary border border-zinc-700 p-6 shadow-2xl flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <h3 className="font-semibold text-sm tracking-tight">Impact Summary</h3>
            <div className="flex gap-4">
              <div className="text-xs">
                <span className="text-text-muted">Risk:</span>{" "}
                <span className="font-mono font-bold uppercase">{response.overallRisk}</span>
              </div>
              <div className="text-xs">
                <span className="text-text-muted">Affected:</span>{" "}
                <span className="font-mono">{response.affectedCount}</span>
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            <div>
              <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">What Changed</h4>
              <p className="text-sm text-text-secondary leading-relaxed">{response.summary.whatChanged}</p>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Risk Surface</h4>
              <p className="text-sm text-text-secondary leading-relaxed">{response.summary.whatIsAtRisk}</p>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Remediation</h4>
              <p className="text-sm text-text-secondary leading-relaxed">{response.summary.whatToDo}</p>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
