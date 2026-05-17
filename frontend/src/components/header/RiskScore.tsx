import { motion, AnimatePresence } from "framer-motion";

const RISK_MAP = {
  high: { color: "#ef4444", glow: "#ef444440", label: "HIGH" },
  medium: { color: "#f59e0b", glow: "#f59e0b30", label: "MED" },
  low: { color: "#2dd4bf", glow: "#2dd4bf30", label: "LOW" },
};

interface Props {
  risk: string | null;
}

export default function RiskScore({ risk }: Props) {
  const cfg = RISK_MAP[risk as keyof typeof RISK_MAP] ?? null;

  if (!risk || !cfg) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-text-muted">Overall risk</span>
        <span className="font-mono text-xs text-text-muted">—</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2.5">
      <span className="text-xs text-text-muted">Overall risk</span>
      <AnimatePresence mode="wait">
        <motion.div
          key={risk}
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          className="flex items-center gap-1.5 rounded-full px-2.5 py-1"
          style={{ background: `${cfg.color}12`, border: `1px solid ${cfg.color}30` }}
        >
          <div
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: cfg.color, boxShadow: `0 0 8px ${cfg.glow}` }}
          />
          <span className="font-mono text-xs font-bold" style={{ color: cfg.color }}>
            {cfg.label}
          </span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
