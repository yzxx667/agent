/**
 * 画布工具栏组件
 *
 * 位于画布底部中央，提供节点添加、缩放、撤销等功能
 */
'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { useReactFlow } from '@xyflow/react' // 新增
import { Button, Popover, Tooltip, Divider } from 'antd'
import { useStore } from 'zustand' // 新增
import { useWorkflowStore } from '@/stores/workflowStore' // 新增
import {
  PlusOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  AimOutlined,
  UndoOutlined,
  RedoOutlined
} from '@ant-design/icons'
import { NodeSelector } from '../NodeSelector'

export const CanvasToolbar: React.FC = () => {
  const [selectorOpen, setSelectorOpen] = useState(false)
  // 新增：获取 ReactFlow 实例，用于缩放控制
  const { zoomIn, zoomOut, fitView } = useReactFlow()

  // 新增：获取撤销/重做相关方法
  const { undo, redo } = useWorkflowStore.temporal.getState()

  // 新增：订阅 temporal store 的状态变化，获取历史记录长度
  const canUndo = useStore(
    useWorkflowStore.temporal,
    state => state.pastStates.length > 0
  )
  const canRedo = useStore(
    useWorkflowStore.temporal,
    state => state.futureStates.length > 0
  )

  // 缩放处理函数
  const handleZoomIn = useCallback(() => {
    zoomIn({ duration: 200 }) // 200ms 过渡动画
  }, [zoomIn])

  const handleZoomOut = useCallback(() => {
    zoomOut({ duration: 200 })
  }, [zoomOut])

  const handleFitView = useCallback(() => {
    fitView({ padding: 0.2, duration: 200 }) // 边缘留 20% 空白
  }, [fitView])

  // 撤销/重做处理函数
  const handleUndo = useCallback(() => {
    undo()
  }, [undo])

  const handleRedo = useCallback(() => {
    redo()
  }, [redo])

  // 键盘快捷键支持 (Ctrl+Z / Ctrl+Shift+Z)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // 检查是否按下 Ctrl 键（Mac 上是 Cmd 键）
      const isCtrlOrCmd = event.ctrlKey || event.metaKey

      if (isCtrlOrCmd && event.key === 'z') {
        event.preventDefault() // 阻止浏览器默认行为
        if (event.shiftKey) {
          // Ctrl+Shift+Z: 重做
          redo()
        } else {
          // Ctrl+Z: 撤销
          undo()
        }
      }

      // 也支持 Ctrl+Y 重做（Windows 用户习惯）
      if (isCtrlOrCmd && event.key === 'y') {
        event.preventDefault()
        redo()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo])

  return (
    <div
      className='bg-white rounded-full shadow-lg border border-gray-200
                    px-2 py-1.5 flex items-center gap-1'
    >
      {/* 添加节点按钮 */}
      <Popover
        content={<NodeSelector onSelect={() => setSelectorOpen(false)} />}
        trigger='click'
        placement='top'
        open={selectorOpen}
        onOpenChange={setSelectorOpen}
        arrow={false}
      >
        <Button type='primary' icon={<PlusOutlined />} className='rounded-full'>
          节点
        </Button>
      </Popover>

      <Divider type='vertical' className='h-6 mx-1' />

      {/* 缩放按钮组 */}
      <Tooltip title='缩小'>
        <Button
          type='text'
          icon={<ZoomOutOutlined />}
          className='text-gray-500 hover:text-gray-700'
          onClick={handleZoomOut}
        />
      </Tooltip>

      <Tooltip title='放大'>
        <Button
          type='text'
          icon={<ZoomInOutlined />}
          className='text-gray-500 hover:text-gray-700'
          onClick={handleZoomIn}
        />
      </Tooltip>

      <Tooltip title='适应画布'>
        <Button
          type='text'
          icon={<AimOutlined />}
          className='text-gray-500 hover:text-gray-700'
          onClick={handleFitView}
        />
      </Tooltip>

      <Divider type='vertical' className='h-6 mx-1' />

      {/* 撤销重做按钮组 */}
      <Tooltip title='撤销 (Ctrl+Z)'>
        <Button
          type='text'
          icon={<UndoOutlined />}
          className={
            canUndo ? 'text-gray-500 hover:text-gray-700' : 'text-gray-300'
          }
          onClick={handleUndo}
          disabled={!canUndo}
        />
      </Tooltip>

      <Tooltip title='重做 (Ctrl+Shift+Z)'>
        <Button
          type='text'
          icon={<RedoOutlined />}
          className={
            canRedo ? 'text-gray-500 hover:text-gray-700' : 'text-gray-300'
          }
          onClick={handleRedo}
          disabled={!canRedo}
        />
      </Tooltip>
    </div>
  )
}
