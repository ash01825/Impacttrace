import dagre from "dagre";
import type { Node, Edge } from "reactflow";
import type { ImpactPath } from "../../types";

const CENTER_NODE_WIDTH = 200;
const CENTER_NODE_HEIGHT = 80;
const AFFECTED_NODE_WIDTH = 170;
const AFFECTED_NODE_HEIGHT = 65;

export function buildGraphFromPaths(
  impactPaths: ImpactPath[],
  changedFiles: string[]
): { nodes: Node[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: "LR",
    nodesep: 100,
    ranksep: 180,
    marginx: 40,
    marginy: 40,
  });

  const seenNodes = new Set<string>();

  // Add center nodes (changed files)
  for (const filePath of changedFiles) {
    const nodeId = toNodeId(filePath);
    if (seenNodes.has(nodeId)) continue;
    seenNodes.add(nodeId);
    g.setNode(nodeId, { width: CENTER_NODE_WIDTH, height: CENTER_NODE_HEIGHT });
  }

  // Add affected nodes
  for (const path of impactPaths) {
    const nodeId = toNodeId(path.component);
    if (seenNodes.has(nodeId)) continue;
    seenNodes.add(nodeId);
    g.setNode(nodeId, { width: AFFECTED_NODE_WIDTH, height: AFFECTED_NODE_HEIGHT });
  }

  // Add edges from closest changed file to affected node
  for (const path of impactPaths) {
    const targetId = toNodeId(path.component);
    const sourceId = findClosestSource(path.component, changedFiles);
    if (!sourceId) continue;

    g.setEdge(sourceId, targetId, {
      riskLevel: path.riskLevel,
      dependencyType: path.dependencyType,
    });
  }

  dagre.layout(g);

  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const centerIds = new Set(changedFiles.map(toNodeId));

  for (const nodeId of g.nodes()) {
    const dagreNode = g.node(nodeId);
    const isCenter = centerIds.has(nodeId);
    const impactPath = isCenter ? null : impactPaths.find((p) => toNodeId(p.component) === nodeId);
    const fullPath = isCenter
      ? changedFiles.find((f) => toNodeId(f) === nodeId) || nodeId
      : impactPath?.component || nodeId;
    const serviceName = extractServiceName(fullPath);

    nodes.push({
      id: nodeId,
      type: "impactNode",
      position: {
        x: dagreNode.x - (isCenter ? CENTER_NODE_WIDTH / 2 : AFFECTED_NODE_WIDTH / 2),
        y: dagreNode.y - (isCenter ? CENTER_NODE_HEIGHT / 2 : AFFECTED_NODE_HEIGHT / 2),
      },
      data: {
        label: nodeId,
        fullPath,
        serviceName,
        isCenter,
        dependencyType: isCenter ? "changed" : impactPath?.dependencyType || "unknown",
        riskLevel: isCenter ? "low" : impactPath?.riskLevel || "low",
      },
    });
  }

  for (const edge of g.edges()) {
    const impactPath = impactPaths.find(
      (p) => toNodeId(p.component) === edge.w
    );

    edges.push({
      id: `${edge.v}->${edge.w}`,
      source: edge.v,
      target: edge.w,
      type: "smoothstep",
      animated: true,
      style: {
        stroke: getEdgeColor(impactPath?.riskLevel || "low"),
        strokeWidth: 1.5,
        strokeDasharray: ["behavioral_contract", "shared_state"].includes(
          impactPath?.dependencyType || ""
        )
          ? "6 4"
          : "none",
      },
      label: impactPath?.dependencyType || "",
    });
  }

  return { nodes, edges };
}

export function toNodeId(component: string): string {
  return component
    .replace(/^.*[/\\]/, "")
    .replace(/\.[^.]*$/, "");
}

function findClosestSource(
  target: string,
  changedFiles: string[]
): string | null {
  if (changedFiles.length === 0) return null;
  if (changedFiles.length === 1) return toNodeId(changedFiles[0]);

  const targetDir = target.split("/").slice(0, -1).join("/");
  let best: string | null = null;
  let bestScore = -1;

  for (const file of changedFiles) {
    const fileDir = file.split("/").slice(0, -1).join("/");
    const score = sharedPrefixLength(targetDir, fileDir);
    if (score > bestScore) {
      bestScore = score;
      best = file;
    }
  }

  return best ? toNodeId(best) : toNodeId(changedFiles[0]);
}

function sharedPrefixLength(a: string, b: string): number {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  return i;
}

function extractServiceName(filePath: string): string {
  const parts = filePath.split("/");
  if (parts.length >= 2) {
    for (let i = 0; i < parts.length - 1; i++) {
      if (["services", "components", "routes", "stores", "hooks", "lib", "src"].includes(parts[i])) {
        return parts[i + 1] || "";
      }
    }
  }
  return "";
}

export function getEdgeColor(riskLevel: string): string {
  switch (riskLevel) {
    case "high": return "#ef4444";
    case "medium": return "#f59e0b";
    case "low": return "#2dd4bf";
    default: return "#52525b";
  }
}

export function getRiskColor(riskLevel: string): string {
  switch (riskLevel) {
    case "high": return "#ef4444";
    case "medium": return "#f59e0b";
    case "low": return "#2dd4bf";
    default: return "#71717a";
  }
}

export function getRiskLabel(riskLevel: string): string {
  switch (riskLevel) {
    case "high": return "High Risk";
    case "medium": return "Medium Risk";
    case "low": return "Low Risk";
    default: return "Unknown";
  }
}
