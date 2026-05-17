import { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { motion } from "framer-motion";
import { getRiskColor } from "./graphUtils";

interface ImpactNodeData {
  label: string;
  dependencyType: string;
  riskLevel: string;
  isImplicitDep: boolean;
}

function ImpactNode({ data, selected }: NodeProps<ImpactNodeData>) {
  const { label, dependencyType, riskLevel, isImplicitDep } = data;
  const color = getRiskColor(riskLevel);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={isImplicitDep ? "implicit-node" : ""}
    >
      {/* Custom React Flow node for impact visualization */}
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: color, border: "none" }}
      />

      <div
        className="rounded-lg border px-3 py-2 shadow-lg backdrop-blur-sm"
        style={{
          background: "rgba(10, 10, 11, 0.95)",
          borderColor: selected ? color : isImplicitDep ? color : `${color}40`,
          borderWidth: isImplicitDep ? 2 : 1,
          borderStyle: isImplicitDep ? "dashed" : "solid",
          minWidth: 140,
        }}
      >
        <div
          className="text-xs font-mono truncate"
          style={{ color: "#e4e4e7", maxWidth: 160 }}
        >
          {label}
        </div>
        <div className="mt-1 flex items-center gap-1.5">
          <div
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: color }}
          />
          <span className="text-[10px] font-medium" style={{ color }}>
            {dependencyType.replace(/_/g, " ")}
          </span>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        style={{ background: color, border: "none" }}
      />
    </motion.div>
  );
}

export default memo(ImpactNode);
