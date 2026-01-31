import { PlusOutlined } from "@ant-design/icons";
import {
  Handle,
  Position,
  useConnection,
  useEdges,
  useNodeId,
  useReactFlow,
} from "@xyflow/react";
import { NodeHoverMenu } from "../NodeHoverMenu";
import { NodeType } from "@/lib/workflow";
import { useEffect, useMemo, useRef, useState } from "react";
import { useWorkflowStore } from "@/stores/workflowStore";

interface CustomHandleProps {
  type: "source" | "target";
  position: Position;
  className?: string;
  style?: React.CSSProperties;
  id?: string;
}
export const CustomHandle: React.FC<CustomHandleProps> = ({
  type,
  position,
  id,
  className,
  style,
}) => {
  const [showNodeMenu, setShowNodeMenu] = useState<boolean>(false);
  const closeTimer = useRef<NodeJS.Timeout | null>(null);

  const NodeId = useNodeId();
  const edges = useEdges();
  const connection = useConnection();
  const { getNode } = useReactFlow();

  // 正在连接
  const isConnecting = connection.inProgress;
  const isConnected = useMemo(
    () =>
      edges.some((edge) => {
        if (type === "source") {
          return edge.source === NodeId && (!id || edge.sourceHandle === id);
        } else {
          return edge.target === NodeId && (!id || edge.targetHandle === id);
        }
      }),
    [edges, NodeId, type, id],
  );

  useEffect(() => {
    if (isConnecting) {
      // 连接过程中，显示所有可连接的 target handle
      if (type === "target" && connection.fromNode?.id !== NodeId) {
        setShowNodeMenu(true);
      }
    } else {
      setShowNodeMenu(false);
    }
  }, [isConnecting]);

  //   新增节点
  const addNode = useWorkflowStore((state) => state.addNode);
  const handleSelect = (nodeType: NodeType) => {
    // addNode(nodeType, { x: position.x, y: 0 });
    const currentNode = getNode(NodeId!);
    if (!currentNode) return;
    addNode(nodeType, {
      x: currentNode.position.x + 400,
      y: currentNode.position.y,
    });
    setShowNodeMenu(false);
  };
  const handleClose = () => {};

  const handleMouseEnter = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setShowNodeMenu(true);
  };
  const handleMouseLeave = () => {
    closeTimer.current = setTimeout(() => {
      setShowNodeMenu(false);
    }, 200);
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setShowNodeMenu((prev) => !prev);
  };

  return (
    <>
      <Handle
        className={`!w-4 !h-4 !bg-transparent !border-0 flex items-center justify-center transition-opacity duration-300 !cursor-pointer ${
          showNodeMenu ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        } ${isConnected ? "opacity-100" : "opacity-0 group-hover:opacity-100"} ${className}`}
        type={type}
        position={position}
        id={id}
        onMouseLeave={handleMouseLeave}
        style={style}
      >
        <div
          className={`flex items-center justify-center w-full h-full text-white transition-transform duration-300 bg-blue-500 rounded-full  shadow-sm hover:scale-125 ${
            showNodeMenu ? "scale-125" : ""
          }`}
          onClick={handleClick}
        >
          {isConnected ? null : <PlusOutlined style={{ fontSize: "10px" }} />}
        </div>
      </Handle>
      {showNodeMenu && type === "source" && (
        <NodeHoverMenu
          onSelect={(type) => handleSelect(type)}
          onClose={handleClose}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{
            top: "50%",
            transform: "translateY(-50%)",
            left: position === Position.Right ? "106%" : undefined,
            right: position === Position.Left ? "100%" : undefined,
            zIndex: 1000,
          }}
        />
      )}
    </>
  );
};
