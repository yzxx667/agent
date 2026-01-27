import {
  APINodeData,
  CodeInputVariable,
  CodeNodeData,
  PropertyPanelProps,
} from "@/lib/workflow";
import {
  getAvailableVariables,
  WorkflowVariable,
} from "@/lib/workflow/variableUtils";
import { useWorkflowStore } from "@/stores/workflowStore";
import {
  PlusOutlined,
  MinusCircleOutlined,
  CopyOutlined,
  ExpandOutlined,
} from "@ant-design/icons";
import { Divider, Input, message, Modal } from "antd";
import TextArea from "antd/es/input/TextArea";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";

interface VariableSelectorProps {
  visible: boolean;
  onSelect: (variableName: string) => void;
  onClose: () => void;
  variables: WorkflowVariable[];
  anchorRef: React.RefObject<HTMLDivElement | null>;
}

const VariableSelector: React.FC<VariableSelectorProps> = ({
  visible,
  onSelect,
  onClose,
  variables,
  anchorRef,
}) => {
  const [search, setSearch] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  // 弹出时清空搜索框
  useEffect(() => {
    if (visible) setSearch("");
  }, [visible]);

  // 计算浮层位置（锚定到输入框下方）
  useEffect(() => {
    if (visible && anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPosition({ top: rect.bottom + 4, left: rect.left });
    }
  }, [visible, anchorRef]);

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (visible) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [visible, onClose]);

  // ... 渲染逻辑
};

interface VariableInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  variables: WorkflowVariable[];
}

const VariableInput: React.FC<VariableInputProps> = ({
  value,
  onChange,
  placeholder,
  variables,
}) => {
  const [showSelector, setShowSelector] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const cursorPosRef = useRef<number>(0);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "/") {
      e.preventDefault(); // 阻止 '/' 输入
      cursorPosRef.current = e.currentTarget.selectionStart || 0;
      setShowSelector(true);
    }
  };

  const handleSelectVariable = (varName: string) => {
    const before = value.slice(0, cursorPosRef.current);
    const after = value.slice(cursorPosRef.current);
    onChange(`${before}{{${varName}}}${after}`);
    setShowSelector(false);
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
      />
      <VariableSelector
        visible={showSelector}
        onSelect={handleSelectVariable}
        onClose={() => setShowSelector(false)}
        variables={variables}
        anchorRef={wrapperRef}
      />
    </div>
  );
};

interface InputVariableEditorProps {
  items: CodeInputVariable[];
  onChange: (items: CodeInputVariable[]) => void;
  variables: WorkflowVariable[];
}

const InputVariableEditor: React.FC<InputVariableEditorProps> = ({
  items,
  onChange,
  variables,
}) => {
  const handleAdd = () => {
    const newItem: CodeInputVariable = {
      id: `input-${Date.now()}`,
      name: `arg${items.length + 1}`,
      value: "",
    };
    onChange([...items, newItem]);
  };

  const handleRemove = (id: string) => {
    onChange(items.filter((item) => item.id !== id));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span>输入</span>
        <button onClick={handleAdd}>
          <PlusOutlined />
        </button>
      </div>
      {items.map((item) => (
        <div key={item.id} className="grid grid-cols-[1fr_1fr_24px] gap-2">
          <Input
            value={item.name}
            onChange={(e) =>
              onChange(
                items.map((i) =>
                  i.id === item.id ? { ...i, name: e.target.value } : i,
                ),
              )
            }
            placeholder="变量名"
          />
          <VariableInput
            value={item.value}
            onChange={(value) =>
              onChange(
                items.map((i) => (i.id === item.id ? { ...i, value } : i)),
              )
            }
            variables={variables}
          />
          <button onClick={() => handleRemove(item.id)}>
            <MinusCircleOutlined />
          </button>
        </div>
      ))}
    </div>
  );
};

interface CodeEditorProps {
  code: string;
  onChange: (code: string) => void;
  language?: string;
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  code,
  onChange,
  language,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenCode, setFullscreenCode] = useState(code);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code);
    message.success("代码已复制到剪贴板");
  }, [code]);

  const handleOpenFullscreen = () => {
    setFullscreenCode(code);
    setIsFullscreen(true);
  };

  const handleCloseFullscreen = () => {
    onChange(fullscreenCode); // 保存全屏中的修改
    setIsFullscreen(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <span>代码</span>
        <div>
          <button onClick={handleCopy}>
            <CopyOutlined />
          </button>
          <button onClick={handleOpenFullscreen}>
            <ExpandOutlined />
          </button>
        </div>
      </div>
      <TextArea
        value={code}
        onChange={(e) => onChange(e.target.value)}
        style={{ backgroundColor: "#1e1e1e", color: "#d4d4d4" }}
      />
      <Modal
        open={isFullscreen}
        onCancel={handleCloseFullscreen}
        onOk={handleCloseFullscreen}
        width="90vw"
      >
        <TextArea
          value={fullscreenCode}
          onChange={(e) => setFullscreenCode(e.target.value)}
        />
      </Modal>
    </div>
  );
};

export const CodePropertyPanel: React.FC<PropertyPanelProps<CodeNodeData>> = ({
  nodeId,
  data,
}) => {
  const { nodes, edges, updateNodeData } = useWorkflowStore();

  // 获取上游可用变量
  const availableVariables = useMemo(() => {
    return getAvailableVariables(nodeId, nodes, edges);
  }, [nodeId, nodes, edges]);

  // 更新节点数据
  const handleUpdate = useCallback(
    <K extends keyof CodeNodeData>(field: K, value: CodeNodeData[K]) => {
      updateNodeData(nodeId, { [field]: value });
    },
    [nodeId, updateNodeData],
  );

  return (
    <div className="space-y-4 p-4">
      {/* 描述 */}
      <div>
        <div className="text-sm font-medium text-gray-700 mb-1">描述</div>
        <Input.TextArea
          value={data.description || ""}
          onChange={(e) => handleUpdate("description", e.target.value)}
          placeholder="描述这个 Code 节点的用途"
          rows={2}
        />
      </div>

      <Divider className="my-3" />

      {/* 输入变量编辑器 */}
      <InputVariableEditor
        items={data.inputs}
        onChange={(items) => handleUpdate("inputs", items)}
        variables={availableVariables}
      />

      <Divider className="my-3" />

      <CodeEditor
        code={data.code}
        onChange={(code) => handleUpdate("code", code)}
        language={data.language}
      />

      <Divider className="my-3" />

      {/* 输出 */}
      <div>
        <div className="text-sm font-medium text-gray-700 mb-2">输出</div>
        <div className="space-y-2">
          {data.outputs?.map((output, index) => (
            <div
              key={output.name}
              className="flex items-center justify-between p-2 bg-gray-50 rounded"
            >
              <span className="text-sm text-gray-800">{output.name}</span>
              <span className="text-xs text-gray-400 capitalize">
                {output.type}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
