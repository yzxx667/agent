import { create } from "zustand";
import type { Workflow } from "@/lib/types/workflow";
import {
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  type NodeChange,
  type EdgeChange,
  type Connection,
} from "@xyflow/react";
1;
import { temporal } from "zundo"; // 新增
import { nodeRegistry, NodeType } from "@/lib/workflow";
import type {
  WorkflowNode,
  WorkflowEdge,
  WorkflowNodeData,
} from "@/lib/workflow";

// 生成唯一节点 ID
const generateNodeId = (): string => {
  return `node_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
};

/**
 * 工作流编辑器状态接口
 *
 * 我们将接口分为两部分：
 * 1. 基础数据（State）：存储的数据
 * 2. Actions：修改数据的方法
 *
 * 这种分离让代码结构更清晰，也便于后续扩展
 */
interface WorkflowState {
  // ==================== 基础数据 ====================
  // 当前工作流数据
  workflow: Workflow | null;
  // 是否正在加载工作流数据
  isLoading: boolean;
  // 是否有未保存的修改
  isDirty: boolean;

  // ==================== Actions ====================
  // 设置当前工作流数据
  setWorkflow: (workflow: Workflow | null) => void;
  // 更新工作流部分字段
  updateWorkflow: (updates: Partial<Workflow>) => void;
  // 设置加载状态
  setLoading: (loading: boolean) => void;
  // 设置是否有修改
  setDirty: (dirty: boolean) => void;
  // 重置状态
  reset: () => void;

  /** 画布中的所有节点 */
  nodes: WorkflowNode[];
  /** 画布中的所有边（连线） */
  edges: WorkflowEdge[];
  /** 当前选中的节点 ID */
  selectedNodeId: string | null;
  /** 当前正在放置的节点类型（null 表示不在放置模式） */
  placingNodeType: NodeType | null;

  // ==================== 画布 Actions ====================
  /** 设置节点列表 */
  setNodes: (nodes: WorkflowNode[]) => void;
  /** 设置边列表 */
  setEdges: (edges: WorkflowEdge[]) => void;
  /** 开始放置 */
  startPlacingNode: (type: NodeType) => void;
  /** 取消放置 */
  cancelPlacingNode: () => void;

  /**
   * 处理节点变化
   *
   * ReactFlow 会在以下情况触发 onNodesChange：
   * - 节点被拖动（position 变化）
   * - 节点被选中/取消选中（selected 变化）
   * - 节点被删除（remove 变化）
   *
   * applyNodeChanges 是 ReactFlow 提供的工具函数，
   * 它会根据 changes 数组更新 nodes 数组
   */
  onNodesChange: (changes: NodeChange<WorkflowNode>[]) => void;

  /**
   * 处理边变化
   * 类似 onNodesChange，处理边的增删改
   */
  onEdgesChange: (changes: EdgeChange<WorkflowEdge>[]) => void;

  /**
   * 处理连接事件
   * 当用户从一个节点的输出拖到另一个节点的输入时触发
   *
   * addEdge 是 ReactFlow 提供的工具函数，
   * 它会创建一条新边并添加到 edges 数组
   */
  onConnect: (connection: Connection) => void;

  /**
   * 添加新节点
   *
   * @param type 节点类型
   * @param position 节点位置
   */
  addNode: (type: NodeType, position: { x: number; y: number }) => void;

  /**
   * 更新节点数据
   * 用于属性面板修改节点配置时
   */
  updateNodeData: (nodeId: string, data: Partial<WorkflowNodeData>) => void;

  /**
   * 删除节点
   */
  deleteNode: (nodeId: string) => void;

  /**
   * 设置选中的节点
   */
  setSelectedNodeId: (nodeId: string | null) => void;
}

/**
 * 初始状态
 * 将初始状态提取为常量，方便在 reset 时复用
 */
const initialState = {
  workflow: null,
  isLoading: true, // 默认为 true，因为页面加载时需要请求数据
  isDirty: false,
  // 当前是否选中放置
  placingNodeType: null as NodeType | null,
};

/**
 * 工作流编辑器 Store
 *
 * create<WorkflowState> 的泛型参数让 TypeScript 能够正确推导类型
 * 回调函数接收 set 参数，用于更新状态
 */
export const useWorkflowStore = create<WorkflowState>()(
  temporal(
    (set) => ({
      // 展开初始状态
      ...initialState,
      nodes: [],
      edges: [],
      selectedNodeId: null,
      setNodes: (nodes) => set({ nodes }),
      setEdges: (edges) => set({ edges }),

      onNodesChange: (changes) => {
        // console.log('onNodesChange', changes)
        set((state) => ({
          nodes: applyNodeChanges(changes, state.nodes),
        }));
      },
      onEdgesChange: (changes) => {
        console.log("onEdgesChange", changes);
        set((state) => ({
          edges: applyEdgeChanges(changes, state.edges),
        }));
      },
      onConnect: (connection) => {
        console.log("onConnect", connection);
        set((state) => ({
          edges: addEdge(connection, state.edges),
        }));
      },
      startPlacingNode: (type) => set({ placingNodeType: type }),
      cancelPlacingNode: () => set({ placingNodeType: null }),
      /** 新增节点 */
      addNode: (type, position) => {
        const config = nodeRegistry.get(type);
        if (!config) {
          console.error(`[WorkflowStore] 未找到节点类型: ${type}`);
          return;
        }

        const newNode: WorkflowNode = {
          id: `${type}_${Date.now()}`,
          type: type,
          position,
          data: config.defaultData as WorkflowNodeData,
        };

        // 需要基于上次的状态计算用函数式（带参数），不需要的话直接设置值（不带参数）
        set((state) => ({
          nodes: [...state.nodes, newNode],
        }));
      },
      updateNodeData: (nodeId, data) => {
        set((state) => ({
          nodes: state.nodes.map((node) =>
            node.id === nodeId
              ? { ...node, data: { ...node.data, ...data } }
              : node,
          ),
        }));
      },

      deleteNode: (nodeId) => {
        set((state) => ({
          nodes: state.nodes.filter((node) => node.id !== nodeId),
          // 同时删除与该节点相关的边
          edges: state.edges.filter(
            (edge) => edge.source !== nodeId && edge.target !== nodeId,
          ),
        }));
      },

      setSelectedNodeId: (nodeId) => set({ selectedNodeId: nodeId }),

      // 设置当前工作流数据 设置完成后loading状态为false
      setWorkflow: (workflow: Workflow | null) =>
        set({ workflow, isLoading: false }),
      // 更新工作流部分字段
      updateWorkflow: (updates: Partial<Workflow>) =>
        set((state) => ({
          workflow: state.workflow ? { ...state.workflow, ...updates } : null,
          // 标记为有修改
          isDirty: true,
        })),
      // 设置加载状态
      setLoading: (isLoading: boolean) => set({ isLoading }),
      // 设置是否有修改
      setDirty: (isDirty: boolean) => set({ isDirty }),
      // 重置状态
      reset: () => set(initialState),
    }),
    {
      // 只追踪 nodes 和 edges 的变化（不追踪 UI 状态如 selectedNodeId）
      partialize: (state) => ({
        nodes: state.nodes,
        edges: state.edges,
      }),
      // 限制历史记录数量，防止内存占用过大
      limit: 50,
    },
  ),
);
