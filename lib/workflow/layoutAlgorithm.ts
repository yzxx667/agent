/**
 * 自动布局算法
 * 使用 dagre 库实现有向图的自动布局
 */
import dagre, { Edge } from "dagre";
import { WorkflowNode, NodeType, WorkflowEdge } from "./types";
import { Position } from "@xyflow/react";

// 节点默认大小（用于布局计算）
const NODE_WIDTH = 250;
const NODE_HEIGHT = 100;

/**
 * 计算自动布局后的节点和边
 * @param nodes 当前节点列表
 * @param edges 当前边列表
 * @param direction 布局方向：'TB' (从上到下) | 'LR' (从左到右)
 */

export const getLayoutedElements = (
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
  direction = "LR",
): { nodes: WorkflowNode[]; edges: WorkflowEdge[] } => {
  if (edges.length === 0) {
    // [a, b, d, c]
    const sortedNodes = [...nodes].sort((a, b) => {
      if (a.type === NodeType.START) return -1;
      if (b.type === NodeType.START) return 1;
      if (a.type === NodeType.END) return 1;
      if (b.type === NodeType.END) return -1;
      return 0;
    });

    let currentX = 0;
    const layoutedNodes = sortedNodes.map((node) => {
      const width = node.measured?.width || NODE_WIDTH;
      const position = { x: currentX, y: 0 };
      currentX += width + 50; // 节点宽度 + 间距
      return {
        ...node,
        targetPosition: direction === "LR" ? "left" : "top",
        sourcePosition: direction === "LR" ? "right" : "bottom",
        position,
      };
    });
    return { nodes: layoutedNodes as WorkflowNode[], edges };
  }

  const dagreGraph = new dagre.graphlib.Graph();
  const isHorizontal = direction === "LR";
  dagreGraph.setGraph({
    rankdir: direction,
    align: "DL", // 尽量向左上对齐
    nodesep: 50, // 同层节点间距
    ranksep: 80, // 层与层间距 }); // 'TB' 或 'LR'
  });

  nodes.forEach((node) => {
    // 必须传入节点宽高，否则布局会重叠
    dagreGraph.setNode(node.id, {
      width: node.measured?.width || NODE_WIDTH,
      height: node.measured?.height || NODE_HEIGHT,
    });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target, {});
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      targetPosition: isHorizontal ? Position.Left : Position.Top,
      sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
      position: { x: nodeWithPosition.x, y: nodeWithPosition.y },
    };
  });

  return { nodes: layoutedNodes, edges };
};
