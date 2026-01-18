"use client";

import React from "react";
import { StopOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { BaseNode } from "../BaseNode";
import type { EndNodeData } from "@/lib/workflow";

/**
 * 开始节点组件 Props
 *
 * ReactFlow 会传入这些属性：
 * - id: 节点 ID
 * - data: 节点数据（我们定义的 StartNodeData）
 * - selected: 是否被选中
 */
export interface EndNodeProps {
  id: string;
  data: EndNodeData;
  selected?: boolean;
}

/**
 * 触发类型的中文标签
 */
const statusConfig = {
  success: {
    icon: <CheckCircleOutlined />,
    label: "成功结束",
    color: "green" as const,
  },
  failure: {
    icon: <StopOutlined />,
    label: "失败结束",
    color: "red" as const,
  },
};

export const EndNode: React.FC<EndNodeProps> = ({ id, data, selected }) => {
  const config = statusConfig[data.endStatus];

  return (
    <BaseNode
      id={id}
      selected={selected}
      icon={config.icon}
      title={data.label}
      subtitle={config.label}
      color={config.color}
      showInput={true} // 结束节点有输入
      showOutput={false}
    />
  );
};
