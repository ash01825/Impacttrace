import { useCallback, useEffect, useMemo } from "react";
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
import { GraniteResponse, ImpactPath } from "@/types";
import { buildGraphFromResponse } from "./graphUtils";

const nodeTypes: NodeTypes = {
  impactNode: ImpactNode,
};

interface BlastRadiusMapProps {
  response: GraniteResponse | null;
  streamingPaths: ImpactPath[];
  onNodeClick: (path: ImpactPath | null) => void;
  selectedNodeId: string | null;
}

export default function BlastRadiusMap({
  response,
  streamingPaths,
  onNodeClick,
  selectedNodeId,
}: BlastRadiusMapProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const currentResponse = useMemo((): GraniteResponse | null => {
    if (streamingPaths.length === 0) return null;
    return {
      overallRisk: "medium",
      affectedCount: streamingPaths.length,
      impactPaths: streamingPaths,
      summary: {
        whatChanged: "",
        whatIsAtRisk: "",
        whatToDo: "",
      },
    };
  }, [streamingPaths]);

  useEffect(() => {
    const source = response || currentResponse;
    if (!source) return;

    const paths = source.impactPaths || streamingPaths;
    if (!paths || paths.length === 0) return;

    const { nodes: newNodes, edges: newEdges } = buildGraphFromResponse(paths);
    setNodes(newNodes);
    setEdges(newEdges);
  }, [response, currentResponse, streamingPaths, setNodes, setEdges]);

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
        const nodeId = p.component.replace("services/", "").replace(/^.*\//, "");
        return nodeId === node.id || p.component === node.id;
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
      </ReactFlow>
    </div>
  );
}
