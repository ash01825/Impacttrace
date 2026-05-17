import { motion, AnimatePresence } from "framer-motion";
import { getRiskColor, getRiskLabel } from "../graph/graphUtils";

interface RiskScoreProps {
  risk: string | null;
}

export default function RiskScore({ risk }: RiskScoreProps) {
  const displayRisk = risk || "low";
  const color = getRiskColor(displayRisk);

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium text-zinc-500">Impact Risk</span>
      <AnimatePresence mode="wait">
        <motion.div
          key={displayRisk}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="flex items-center gap-2"
        >
          <div
            className="h-3 w-3 rounded-full"
            style={{ background: color, boxShadow: `0 0 12px ${color}40` }}
          />
          <span className="font-mono text-lg font-bold" style={{ color }}>
            {getRiskLabel(displayRisk)}
          </span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
