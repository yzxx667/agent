/**
 * 节点选择菜单组件
 * 纯 UI 组件，负责渲染节点列表并在点击时触发回调
 */

import {
  NodeCategory,
  nodeRegistry,
  NodeType,
  categoryLabels,
} from "@/lib/workflow";
import React, { useMemo } from "react";

interface NodeHoverMenuProps {
  onSelect: (type: NodeType) => void;
  onClose?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  style?: React.CSSProperties;
}

export const NodeHoverMenu: React.FC<NodeHoverMenuProps> = ({
  onSelect,
  onClose,
  onMouseEnter,
  onMouseLeave,
  style,
}) => {
  const allNodes = nodeRegistry
    .getAll()
    .filter((v) => v.type !== NodeType.START);
  // 1. 获取并通过 useMemo 缓存节点数据
  const groupedNodes = useMemo(() => {
    const groups: Record<string, Array<(typeof allNodes)[0]>> = {};
    allNodes.forEach((node) => {
      if (!groups[node.category]) groups[node.category] = [];
      groups[node.category].push(node);
    });
    return groups;
  }, [allNodes]);
  return (
    <div
      className=" absolute bg-white rounded-lg shadow-xl border border-gray-100 w-56 max-h-80 overflow-y-auto z-[100] nodrag nopan "
      style={style}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {Object.entries(groupedNodes).map(([category, nodes]: any) => (
        <div key={category} className="border-b last:border-0 border-gray-100">
          <div className="px-3 py-1.5 bg-gray-50 text-xs text-gray-500 font-medium sticky top-0">
            {categoryLabels[category as NodeCategory]}
          </div>
          {nodes?.map((node: any) => (
            <div
              key={node.type}
              className="px-4 py-2 hover:bg-blue-50 cursor-pointer flex items-center gap-2"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(node.type);
              }}
            >
              <div className="w-5 h-5 rounded flex items-center justify-center text-xs text-white bg-blue-500">
                {node.icon}
              </div>
              <span className="text-sm text-gray-700">{node.label}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};
