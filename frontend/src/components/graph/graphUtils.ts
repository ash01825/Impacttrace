import { ImpactPath } from "@/types";
import { Node, Edge, MarkerType } from "reactflow";

const NODE_POSITIONS: Record<string, { x: number; y: number }> = {
  "tokenValidator.js": { x: 400, y: 300 },
  "authMiddleware.js": { x: 200, y: 150 },
  "sessionManager.js": { x: 600, y: 150 },
  "orderService.js": { x: 50, y: 50 },
  "orderController.js": { x: 50, y: 450 },
  "checkoutService.js": { x: 50, y: 250 },
  "userController.js": { x: 750, y: 50 },
  "profileService.js": { x: 750, y: 450 },
  "preferencesService.js": { x: 750, y: 550 },
  "validateCheckoutToken.js": { x: 750, y: 250 },
  "paymentProcessor.js": { x: 800, y: 100 },
  "refundHandler.js": { x: 800, y: 400 },
};

export function buildGraphFromResponse(
  currentPaths: ImpactPath[]
): { nodes: Node[]; edges: Edge[] } {
  const seen = new Set<string>();
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Center node (the changed file)
  const centerId = "tokenValidator.js";
  if (!seen.has(centerId)) {
    seen.add(centerId);
    nodes.push(createNode(centerId, "changed", { x: 400, y: 300 }));
  }

  for (const path of currentPaths) {
    const nodeId = path.component.replace("services/", "").replace(/^.*\//, "");

    const isNew = !seen.has(nodeId);

    if (isNew) {
      seen.add(nodeId);
      const pos = NODE_POSITIONS[nodeId] || randomPosition(seen.size);
      nodes.push(createNode(nodeId, path.dependencyType, pos, path.riskLevel));
    }

    if (isNew) {
      const isImplicitDep =
        path.dependencyType === "behavioral_contract" || path.dependencyType === "shared_state";

      edges.push({
        id: `e-${centerId}-${nodeId}`,
        source: centerId,
        target: nodeId,
        type: "smoothstep",
        animated: isImplicitDep,
        style: {
          stroke: isImplicitDep ? "#ef4444" : getEdgeColor(path.riskLevel),
          strokeWidth: isImplicitDep ? 2.5 : 1.5,
          strokeDasharray: isImplicitDep ? "8 4" : "none",
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isImplicitDep ? "#ef4444" : getEdgeColor(path.riskLevel),
        },
        label: path.dependencyType.replace(/_/g, " "),
        labelStyle: {
          fill: "#e4e4e7",
          fontSize: 10,
          fontFamily: "Inter, sans-serif",
        },
        labelBgStyle: { fill: "#0a0a0b" },
        labelBgPadding: [4, 2] as [number, number],
      });
    }
  }

  return { nodes, edges };
}

function createNode(
  id: string,
  dependencyType: string,
  position: { x: number; y: number },
  riskLevel?: string
): Node {
  const isImplicitDep =
    dependencyType === "behavioral_contract" || dependencyType === "shared_state";

  return {
    id,
    type: "impactNode",
    position,
    data: {
      label: id,
      dependencyType,
      riskLevel: riskLevel || "low",
      isImplicitDep,
    },
  };
}

function getEdgeColor(riskLevel: string): string {
  switch (riskLevel) {
    case "high":
      return "#ef4444";
    case "medium":
      return "#f59e0b";
    default:
      return "#2dd4bf";
  }
}

function randomPosition(seed: number): { x: number; y: number } {
  const angle = (seed * 137.508) % 360;
  const radius = 150 + seed * 20;
  const x = 400 + Math.cos((angle * Math.PI) / 180) * radius;
  const y = 300 + Math.sin((angle * Math.PI) / 180) * radius;
  return { x, y };
}

export function getRiskLabel(risk: string): string {
  switch (risk) {
    case "high":
      return "High";
    case "medium":
      return "Medium";
    default:
      return "Low";
  }
}

export function getRiskColor(risk: string): string {
  switch (risk) {
    case "high":
      return "#ef4444";
    case "medium":
      return "#f59e0b";
    default:
      return "#2dd4bf";
  }
}
