import { useCallback, useEffect } from "react";
import ReactFlow, {
  Background,
  Controls,
  Node,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  NodeTypes,
} from "reactflow";
import "reactflow/dist/style.css";
import ImpactNode from "./ImpactNode";
import GraphLegend from "./GraphLegend";
import type { GraniteResponse, ImpactPath } from "@/types";
import { buildGraphFromPaths, toNodeId } from "./graphUtils";

const nodeTypes: NodeTypes = {
  impactNode: ImpactNode,
};

interface BlastRadiusMapProps {
  response: GraniteResponse | null;
  streamingPaths: ImpactPath[];
  changedFiles: string[];
  onNodeClick: (path: ImpactPath | null) => void;
  selectedNodeId: string | null;
}

export default function BlastRadiusMap({
  response,
  streamingPaths,
  changedFiles,
  onNodeClick,
  selectedNodeId,
}: BlastRadiusMapProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    const paths = response?.impactPaths || streamingPaths;
    if (!paths || paths.length === 0) {
      setNodes([]);
      setEdges([]);
      return;
    }

    const files = changedFiles.length > 0 ? changedFiles : [];
    if (files.length === 0 && response?.changedFiles) {
      files.push(...response.changedFiles);
    }

    const { nodes: newNodes, edges: newEdges } = buildGraphFromPaths(paths, files);
    setNodes(newNodes);
    setEdges(newEdges);
  }, [response, streamingPaths, changedFiles, setNodes, setEdges]);

  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        selected: node.id === selectedNodeId,
        style: {
          ...node.style,
          opacity: selectedNodeId && node.id !== selectedNodeId ? 0.4 : 1,
        },
      }))
    );
  }, [selectedNodeId, setNodes]);

  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      const allPaths = response?.impactPaths || streamingPaths || [];
      const path = allPaths.find((p) => {
        const nid = toNodeId(p.component);
        return nid === node.id || p.component === node.id;
      });
      onNodeClick(path || null);
    },
    [response, streamingPaths, onNodeClick]
  );

  return (
    <div className="h-full w-full rounded-lg border border-white/5 bg-bg-primary">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.3}
        maxZoom={1.5}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          color="rgba(255,255,255,0.04)"
        />
        <Controls
          className="[&>button]:!bg-white/5 [&>button]:!border-white/10 [&>button]:!text-white/60 [&>button:hover]:!bg-white/10"
        />
        <GraphLegend />
      </ReactFlow>
    </div>
  );
}
