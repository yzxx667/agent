import {
  APINodeData,
  BodyType,
  HttpMethod,
  KeyValuePair,
  PropertyPanelProps,
} from "@/lib/workflow";
import {
  getAvailableVariables,
  WorkflowVariable,
} from "@/lib/workflow/variableUtils";
import { useWorkflowStore } from "@/stores/workflowStore";
import {
  ExpandOutlined,
  MinusCircleOutlined,
  PlusOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { Divider, Input, InputNumber, Modal, Select, Switch } from "antd";
import TextArea from "antd/es/input/TextArea";
import { useState, useRef, useEffect, useMemo, useCallback } from "react";

const BODY_TYPES: { label: string; value: BodyType }[] = [
  { label: "无", value: "none" },
  { label: "Form Data", value: "form-data" },
  { label: "JSON", value: "json" },
  { label: "Raw", value: "raw" },
  { label: "x-www-form-urlencoded", value: "x-www-form-urlencoded" },
];

const HTTP_METHODS: { label: string; value: HttpMethod }[] = [
  { label: "GET", value: "GET" },
  { label: "POST", value: "POST" },
  { label: "PUT", value: "PUT" },
  { label: "DELETE", value: "DELETE" },
  { label: "PATCH", value: "PATCH" },
];

/**
 * 变量选择器组件
 */
interface VariableSelectorProps {
  visible: boolean;
  onSelect: (variableName: string) => void;
  onClose: () => void;
  variables: WorkflowVariable[];
  anchorRef: React.RefObject<HTMLElement | null>;
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

  // 当弹出时清空搜索框，避免 "/" 字符被当作搜索条件
  useEffect(() => {
    if (visible) {
      setSearch("");
    }
  }, [visible]);

  // 计算位置（相对于触发元素）
  useEffect(() => {
    if (visible && anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 4,
        left: rect.left,
      });
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
      const timer = setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside);
      }, 0);
      return () => {
        clearTimeout(timer);
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [visible, onClose]);

  // 搜索过滤
  const filteredVariables = useMemo(() => {
    if (!search) return variables;
    return variables.filter(
      (v) =>
        v.name.toLowerCase().includes(search.toLowerCase()) ||
        v.sourceNodeLabel.toLowerCase().includes(search.toLowerCase()),
    );
  }, [variables, search]);

  if (!visible) return null;

  return (
    <div
      ref={panelRef}
      className="fixed z-[9999] bg-white border border-gray-200 rounded-lg shadow-lg w-64 max-h-80 overflow-hidden"
      style={{ top: position.top, left: position.left }}
    >
      {/* 搜索框 */}
      <div className="p-2 border-b border-gray-100">
        <Input
          size="small"
          placeholder="搜索变量..."
          prefix={<SearchOutlined className="text-gray-400" />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
        />
      </div>

      {/* 变量列表 */}
      <div className="max-h-60 overflow-y-auto p-2">
        {filteredVariables.length === 0 ? (
          <div className="text-center text-gray-400 py-4 text-sm">
            {variables.length === 0 ? "暂无可用变量" : "未找到匹配的变量"}
          </div>
        ) : (
          <div className="space-y-1">
            {filteredVariables.map((variable) => (
              <div
                key={variable.id}
                className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer"
                onClick={() => onSelect(variable.name)}
              >
                <div className="flex flex-col">
                  <span className="text-gray-800 font-medium text-sm">
                    {variable.name}
                  </span>
                  <span className="text-gray-400 text-xs">
                    来自: {variable.sourceNodeLabel}
                  </span>
                </div>
                <span className="text-gray-400 text-xs">{variable.type}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * 带变量选择功能的输入框
 */
interface VariableInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  variables: WorkflowVariable[];
  className?: string;
}

const VariableInput: React.FC<VariableInputProps> = ({
  value,
  onChange,
  placeholder,
  variables,
  className,
}) => {
  const [showSelector, setShowSelector] = useState(false);
  // 使用包装 div 的 ref 来获取位置，因为 Ant Design Input 的 ref 不是 DOM 元素
  const wrapperRef = useRef<HTMLDivElement>(null);
  const cursorPosRef = useRef<number>(0);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "/") {
      e.preventDefault(); // 阻止 '/' 字符输入到搜索框
      cursorPosRef.current = e.currentTarget.selectionStart || 0;
      setShowSelector(true);
    }
  };

  const handleSelectVariable = (varName: string) => {
    const before = value.slice(0, cursorPosRef.current);
    const after = value.slice(cursorPosRef.current);
    // 移除触发的 '/' 字符（如果有的话）
    const newBefore = before.endsWith("/") ? before.slice(0, -1) : before;
    onChange(`${newBefore}{{${varName}}}${after}`);
    setShowSelector(false);
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder || "键入 '/' 键快速插入变量..."}
        className={className}
        size="small"
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

/**
 * 键值对编辑器组件
 */
interface KeyValueEditorProps {
  title: string;
  items: KeyValuePair[];
  onChange: (items: KeyValuePair[]) => void;
  variables: WorkflowVariable[];
  addButtonText?: string;
}

const KeyValueEditor: React.FC<KeyValueEditorProps> = ({
  title,
  items,
  onChange,
  variables,
  addButtonText = "添加",
}) => {
  const handleAdd = () => {
    const newItem: KeyValuePair = {
      id: `kv-${Date.now()}`,
      key: "",
      value: "",
      enabled: true,
    };
    onChange([...items, newItem]);
  };

  const handleRemove = (id: string) => {
    onChange(items.filter((item) => item.id !== id));
  };

  const handleUpdate = (
    id: string,
    field: "key" | "value",
    newValue: string,
  ) => {
    onChange(
      items.map((item) =>
        item.id === id ? { ...item, [field]: newValue } : item,
      ),
    );
  };

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-gray-700">{title}</div>

      {items.map((item) => (
        <div
          key={item.id}
          className="grid grid-cols-[1fr_1fr_24px] gap-2 items-center"
        >
          <VariableInput
            value={item.key}
            onChange={(v) => handleUpdate(item.id, "key", v)}
            placeholder="键"
            variables={variables}
          />
          <VariableInput
            value={item.value}
            onChange={(v) => handleUpdate(item.id, "value", v)}
            placeholder="值"
            variables={variables}
          />
          <button
            onClick={() => handleRemove(item.id)}
            className="text-gray-400 hover:text-red-500 transition-colors"
          >
            <MinusCircleOutlined />
          </button>
        </div>
      ))}

      <button
        onClick={handleAdd}
        className="flex items-center gap-1 text-sm text-blue-500 hover:text-blue-600"
      >
        <PlusOutlined />
        {addButtonText}
      </button>
    </div>
  );
};

/**
 * JSON 编辑器组件
 */
interface JsonEditorProps {
  value: string;
  onChange: (value: string) => void;
  variables: WorkflowVariable[];
}

const JsonEditor: React.FC<JsonEditorProps> = ({
  value,
  onChange,
  variables,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [tempValue, setTempValue] = useState(value);

  const handleOpenFullscreen = () => {
    setTempValue(value);
    setIsFullscreen(true);
  };

  const handleConfirm = () => {
    onChange(tempValue);
    setIsFullscreen(false);
  };

  return (
    <>
      <div className="relative">
        <TextArea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder='{"key": "value"}'
          rows={4}
          className="font-mono text-sm"
        />
        <button
          onClick={handleOpenFullscreen}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
        >
          <ExpandOutlined />
        </button>
      </div>

      <Modal
        title="编辑 JSON"
        open={isFullscreen}
        onOk={handleConfirm}
        onCancel={() => setIsFullscreen(false)}
        width={800}
        okText="确定"
        cancelText="取消"
      >
        <TextArea
          value={tempValue}
          onChange={(e) => setTempValue(e.target.value)}
          placeholder='{"key": "value"}'
          rows={20}
          className="font-mono text-sm"
        />
        <div className="mt-2 text-xs text-gray-400">
          提示：输入 / 可以插入变量，格式为 {"{{variableName}}"}
        </div>
      </Modal>
    </>
  );
};

export const APIPropertyPanel: React.FC<PropertyPanelProps<APINodeData>> = ({
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
    <K extends keyof APINodeData>(field: K, value: APINodeData[K]) => {
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
          placeholder="描述这个 API 节点的用途..."
          rows={2}
        />
      </div>

      <Divider className="my-3" />

      {/* API 配置 */}
      <div>
        <div className="text-sm font-medium text-gray-700 mb-2">API</div>
        <div className="flex gap-2">
          <Select
            value={data.method}
            onChange={(v) => handleUpdate("method", v)}
            options={HTTP_METHODS.map((m) => ({
              value: m.value,
              label: <span>{m.label}</span>,
            }))}
            className="w-24"
          />
          <div className="flex-1">
            <VariableInput
              value={data.url}
              onChange={(v) => handleUpdate("url", v)}
              placeholder="https://api.example.com/path"
              variables={availableVariables}
            />
          </div>
        </div>
      </div>

      <Divider className="my-3" />

      {/* 请求参数 */}
      <KeyValueEditor
        title="请求参数"
        items={data.params}
        onChange={(items) => handleUpdate("params", items)}
        variables={availableVariables}
        addButtonText="添加参数"
      />

      <Divider className="my-3" />

      {/* 请求头 */}
      <KeyValueEditor
        title="请求头"
        items={data.headers}
        onChange={(items) => handleUpdate("headers", items)}
        variables={availableVariables}
        addButtonText="添加请求头"
      />

      <Divider className="my-3" />

      {/* 鉴权 */}
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-gray-700">鉴权</div>
        <Switch
          checked={data.authEnabled}
          onChange={(checked) => handleUpdate("authEnabled", checked)}
        />
      </div>

      <Divider className="my-3" />

      {/* 请求体 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-medium text-gray-700">请求体</div>
          <Select
            value={data.bodyType}
            onChange={(v) => handleUpdate("bodyType", v)}
            options={BODY_TYPES}
            className="w-40"
          />
        </div>

        {/* 根据类型显示不同的编辑器 */}
        {data.bodyType === "json" && (
          <JsonEditor
            value={data.bodyJson}
            onChange={(v) => handleUpdate("bodyJson", v)}
            variables={availableVariables}
          />
        )}

        {data.bodyType === "raw" && (
          <TextArea
            value={data.bodyRaw}
            onChange={(e) => handleUpdate("bodyRaw", e.target.value)}
            placeholder="输入原始文本..."
            rows={4}
          />
        )}

        {(data.bodyType === "form-data" ||
          data.bodyType === "x-www-form-urlencoded") && (
          <KeyValueEditor
            title=""
            items={data.bodyFormData}
            onChange={(items) => handleUpdate("bodyFormData", items)}
            variables={availableVariables}
            addButtonText="添加字段"
          />
        )}
      </div>

      <Divider className="my-3" />

      {/* 超时设置 */}
      <div>
        <div className="text-sm font-medium text-gray-700 mb-2">超时设置</div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-gray-500 mb-1">重试间隔（秒）</div>
            <InputNumber
              value={data.timeout}
              onChange={(v) => handleUpdate("timeout", v || 120)}
              min={1}
              max={600}
              className="w-full"
            />
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">重试次数</div>
            <InputNumber
              value={data.retryCount}
              onChange={(v) => handleUpdate("retryCount", v || 3)}
              min={0}
              max={10}
              className="w-full"
            />
          </div>
        </div>
      </div>

      <Divider className="my-3" />

      {/* 输出 */}
      <div>
        <div className="text-sm font-medium text-gray-700 mb-2">输出</div>
        <div className="space-y-2">
          {data.outputs?.map((output) => (
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
