import {
  BranchCondition,
  BranchNodeData,
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
  SearchOutlined,
  BranchesOutlined,
} from "@ant-design/icons";
import { Button, Divider, Input } from "antd";
import { useState, useRef, useEffect, useMemo } from "react";

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

interface BranchEditorProps {
  branches: BranchCondition[];
  onChange: (branches: BranchCondition[]) => void;
  variables: WorkflowVariable[];
}

const BranchEditor: React.FC<BranchEditorProps> = ({
  branches,
  onChange,
  variables,
}) => {
  const handleAdd = () => {
    const newBranch: BranchCondition = {
      id: `branch-${Date.now()}`,
      label: branches.length === 0 ? "如果" : "否则如果",
      condition: "",
    };
    onChange([...branches, newBranch]);
  };

  const handleRemove = (id: string) => {
    onChange(branches.filter((branch) => branch.id !== id));
  };

  const handleChange = (
    id: string,
    field: "label" | "condition",
    newValue: string,
  ) => {
    onChange(
      branches.map((branch) =>
        branch.id === id ? { ...branch, [field]: newValue } : branch,
      ),
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">条件分支</span>
        <button onClick={handleAdd}>
          <PlusOutlined />
        </button>
      </div>

      {branches.length === 0 ? (
        <div className="border border-dashed border-gray-200 rounded-lg p-4 text-center text-gray-400">
          点击 + 添加条件分支
        </div>
      ) : (
        <div className="space-y-3">
          {branches.map((branch, index) => (
            <div
              key={branch.id}
              className="border border-gray-200 rounded-lg p-3 space-y-2"
            >
              {/* 分支标签 */}
              <div className="flex items-center gap-2">
                <Input
                  value={branch.label}
                  onChange={(e) =>
                    handleChange(branch.id, "label", e.target.value)
                  }
                  placeholder={index === 0 ? "如果" : "否则如果"}
                />
                <button onClick={() => handleRemove(branch.id)}>
                  <MinusCircleOutlined />
                </button>
              </div>

              {/* 条件表达式 */}
              <div className="space-y-1">
                <div className="text-xs text-gray-500">+ 添加条件</div>
                <VariableInput
                  value={branch.condition || ""}
                  onChange={(v) => handleChange(branch.id, "condition", v)}
                  placeholder="添加条件"
                  variables={variables}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const BranchPropertyPanel: React.FC<PropertyPanelProps> = ({
  nodeId,
}) => {
  const { nodes, edges, updateNodeData } = useWorkflowStore();
  const node = nodes.find((n) => n.id === nodeId);

  // 获取上游节点的可用变量
  const availableVariables = useMemo(() => {
    return getAvailableVariables(nodeId, nodes, edges);
  }, [nodeId, nodes, edges]);

  if (!node || node.type !== "branch") {
    return <div className="p-4 text-gray-500">请选择一个分支器节点</div>;
  }

  const data = node.data as BranchNodeData;

  const handleBranchesChange = (branches: BranchCondition[]) => {
    updateNodeData(nodeId, { branches });
  };

  const handleToggleElseBranch = () => {
    updateNodeData(nodeId, { showElseBranch: !data.showElseBranch });
  };

  return (
    <div className="p-4 space-y-4">
      {/* 节点标题 */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center text-white">
          <BranchesOutlined />
        </div>
        <span className="font-medium text-gray-800">{data.label}</span>
      </div>

      <Divider />

      {/* 条件分支编辑器 */}
      <BranchEditor
        branches={data.branches || []}
        onChange={handleBranchesChange}
        variables={availableVariables}
      />

      <Divider />

      {/* 否则分支开关 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">否则分支</span>
          <Button
            type={data.showElseBranch ? "primary" : "default"}
            size="small"
            onClick={handleToggleElseBranch}
          >
            {data.showElseBranch ? "已启用" : "已禁用"}
          </Button>
        </div>
        {data.showElseBranch && (
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-sm text-gray-800 font-medium">否则</div>
            <div className="text-xs text-gray-500">
              用于定义当 if 条件不满足时应执行的逻辑。
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
