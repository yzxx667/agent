/**
 * 结束节点组件
 *
 * 工作流的出口节点，只有输入连接点，没有输出连接点
 * 显示输出变量列表
 */
"use client";

import React, { useState } from "react";
import { Handle, Position } from "@xyflow/react";
import { StopOutlined, DownOutlined, RightOutlined } from "@ant-design/icons";
import type { EndNodeData } from "@/lib/workflow/types";
import { BaseNode } from "../BaseNode";

export interface EndNodeProps {
  id: string;
  data: EndNodeData;
  selected?: boolean;
}

/**
 * 结束节点组件
 */
export const EndNode: React.FC<EndNodeProps> = ({ id, data, selected }) => {
  const [showOutputs, setShowOutputs] = useState(true);

  // 获取输出变量列表
  const outputVariables = data.outputVariables || [];

  return (
    // 修改后
    <BaseNode
      id={id}
      selected={selected}
      icon={<StopOutlined />}
      title="结束"
      subtitle={"配置输出变量"}
      iconColor="red" // color → iconColor
      showOutput={false}
    />
  );
};
