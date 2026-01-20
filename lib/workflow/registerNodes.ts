import React from "react";
import {
  CodeOutlined,
  PlayCircleOutlined,
  RobotOutlined,
  StopOutlined,
} from "@ant-design/icons";
import { nodeRegistry } from "./nodeRegistry";
import { NodeType } from "./types";
import { StartPropertyPanel } from "@/components/workflow/panels/StartPropertyPanel";
import { EndPropertyPanel } from "@/components/workflow/panels/EndPropertyPanel";
import type {
  StartNodeData,
  EndNodeData,
  CodeNodeData,
  LLMNodeData,
} from "./types";
import { StartNode } from "@/components/workflow/nodes/StartNode";
import { EndNode } from "@/components/workflow/nodes/EndNode";
import { CodeNode } from "@/components/workflow/nodes";
import { LLMNode } from "@/components/workflow/nodes/LLMNode"; // 新增
import { LLMPropertyPanel } from "@/components/workflow/panels/LLMPropertyPanel"; // 新增

/**
 * 注册所有节点类型
 */
export function registerAllNodes() {
  // 注册开始节点
  nodeRegistry.register<StartNodeData>({
    type: NodeType.START,
    label: "开始",
    description: "工作流的起点，定义输入变量",
    icon: React.createElement(PlayCircleOutlined),
    iconColor: "green",
    category: "trigger",
    component: StartNode,
    // 使用自定义属性面板（支持动态添加变量）
    propertyPanel: StartPropertyPanel,
    maxInputs: 0, // 开始节点没有输入
    maxOutputs: 1, // 只能有一个输出
    // 修改后
    defaultData: {
      label: "开始",
      inputs: [],
    },
  });

  // 注册结束节点
  // ==================== 注册结束节点 ====================
  nodeRegistry.register<EndNodeData>({
    type: NodeType.END,
    label: "结束",
    description: "工作流的终点，定义输出变量",
    icon: React.createElement(StopOutlined),
    iconColor: "red",
    category: "end",
    component: EndNode,
    // 使用自定义属性面板（支持动态添加变量）
    propertyPanel: EndPropertyPanel,
    maxInputs: 1, // 只能有一个输入
    maxOutputs: 0, // 结束节点没有输出
    defaultData: {
      label: "结束",
      outputVariables: [], // 默认没有输出变量
    },
  });

  // 注册代码节点
  nodeRegistry.register<CodeNodeData>({
    type: NodeType.CODE,
    label: "代码",
    description: "执行自定义 JavaScript 或 Python 代码",
    icon: React.createElement(CodeOutlined),
    iconColor: "orange",
    category: "action",
    component: CodeNode,
    formSchema: [
      {
        name: "label",
        label: "节点名称",
        type: "input",
        required: true,
      },
      {
        name: "language",
        label: "编程语言",
        type: "select",
        required: true,
        options: [
          { label: "JavaScript", value: "javascript" },
          { label: "Python", value: "python" },
        ],
      },
      {
        name: "code",
        label: "代码",
        type: "textarea",
        placeholder: "请输入代码",
      },
    ],
    maxInputs: 1,
    maxOutputs: 1,
    defaultData: {
      label: "代码",
      language: "javascript",
      code: '// 在这里编写代码\nreturn { result: "Hello World" };',
    },
  });

  // ==================== 注册大模型节点 ====================
  nodeRegistry.register<LLMNodeData>({
    type: NodeType.LLM,
    label: "大模型",
    description: "调用大语言模型（LLM）生成内容",
    icon: React.createElement(RobotOutlined),
    iconColor: "blue",
    category: "action",
    component: LLMNode,
    // 使用自定义属性面板（复杂表单）
    propertyPanel: LLMPropertyPanel,
    maxInputs: 1,
    maxOutputs: 1,
    defaultData: {
      label: "大模型",
      model: undefined, // 默认未选择模型
      temperatureEnabled: true, // 默认启用温度参数
      temperature: 0.6, // 默认温度
      topPEnabled: false, // 默认不启用 Top P
      topP: 0.8, // 默认 Top P 值
      context: "", // 上下文变量
      prompt: "", // 提示词
      outputs: [
        // 默认输出变量
        {
          name: "text",
          type: "string",
          description: "生成内容",
        },
      ],
    },
  });
}

/**
 * 初始化节点注册表
 * 使用标志位确保只注册一次
 */
let isRegistered = false;

export function initializeNodeRegistry(): void {
  if (isRegistered) return;
  registerAllNodes();
  isRegistered = true;
}
