/**
 * 代码节点组件
 *
 * 用于执行自定义代码（JavaScript 或 Python）
 */
"use client";

import { CodeNodeData } from "@/lib/workflow";
import React from "react";
import { BaseNode } from "../BaseNode";
import { CodeOutlined } from "@ant-design/icons";

/**
 * 编程语言显示文本映射
 */
const languageLabels: Record<CodeNodeData["language"], string> = {
  javascript: "JavaScript",
  python: "Python",
};

export interface CodeNodeProps {
  id: string;
  selected?: boolean;
  data: CodeNodeData;
}

/**
 * 代码节点组件
 */
export const CodeNode: React.FC<CodeNodeProps> = ({ id, selected, data }) => {
  return (
    <BaseNode
      id={id}
      selected={selected}
      icon={<CodeOutlined />}
      title={data.label}
      subtitle={languageLabels[data.language]}
      color={"orange"}
      showInput={true}
      showOutput={true}
    />
  );
};
