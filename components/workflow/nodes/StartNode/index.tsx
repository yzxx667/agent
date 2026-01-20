/**
 * 开始节点组件
 *
 * 工作流的入口节点，只有输出连接点，没有输入连接点
 * 显示输入变量列表
 */
"use client";

import React, { useState } from "react";
import { Handle, Position } from "@xyflow/react";
import {
  PlayCircleOutlined,
  DownOutlined,
  RightOutlined,
} from "@ant-design/icons";
import type { StartNodeData } from "@/lib/workflow/types";
import { BaseNode } from "../BaseNode";

/**
 * 变量类型显示映射
 */
const typeLabels: Record<string, string> = {
  string: "string",
  number: "number",
  boolean: "boolean",
  object: "object",
  array: "array",
};

export interface StartNodeProps {
  id: string;
  data: StartNodeData;
  selected?: boolean;
}

/**
 * 开始节点组件
 */
export const StartNode: React.FC<StartNodeProps> = ({ id, data, selected }) => {
  const [showInputs, setShowInputs] = useState(true);

  // 获取输入变量列表
  const inputs = data.inputs || [];

  return (
    // 修改后
    <BaseNode
      id={id}
      selected={selected}
      icon={<PlayCircleOutlined />}
      title="开始"
      subtitle={"配置输入变量"}
      iconColor="green" // color → iconColor
      showInput={false}
    />
  );
};
