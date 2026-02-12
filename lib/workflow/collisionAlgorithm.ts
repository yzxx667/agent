import { Node, XYPosition } from "@xyflow/react";

const NODE_WIDTH = 220;
const NODE_HEIGHT = 100;
const BUFFER = 4; // 只有 4px 的超窄缝隙，视觉极度紧凑

// 获取节点的边界框
const getBounds = (
  node:
    | Node
    | { position: XYPosition; measured?: { width: number; height: number } },
) => {
  const x = node.position.x;
  const y = node.position.y;
  // 优先使用真实测量尺寸
  const w =
    "measured" in node ? node.measured?.width || NODE_WIDTH : NODE_WIDTH;
  const h =
    "measured" in node ? node.measured?.height || NODE_HEIGHT : NODE_HEIGHT;
  return { left: x, right: x + w, top: y, bottom: y + h, width: w, height: h };
};

// 简单的矩形碰撞检测
const checkCollision = (
  r1: ReturnType<typeof getBounds>,
  r2: ReturnType<typeof getBounds>,
) => {
  // 内部逻辑为非碰撞条件，取反即为碰撞
  return !(
    r2.left >= r1.right + BUFFER ||
    r2.right <= r1.left - BUFFER ||
    r2.top >= r1.bottom + BUFFER ||
    r2.bottom <= r1.top - BUFFER
  );
};

/**
 * 刚体位置修正算法
 */
export const getValidPosition = (
  draggedNode: Node,
  originalNode: Node, // 关键：传入上一帧的位置作为参考
  otherNodes: Node[],
): XYPosition => {
  let currentBounds = getBounds(draggedNode);

  let newX = draggedNode.position.x;
  let newY = draggedNode.position.y;

  // 获取"碰撞前"的边界，作为方位判断基准
  const originalBounds = getBounds(originalNode);

  for (const otherNode of otherNodes) {
    const otherBounds = getBounds(otherNode);

    if (checkCollision(currentBounds, otherBounds)) {
      // 发生碰撞，依据原始位置判断方位并调整
      if (originalBounds.right <= otherBounds.left) {
        // 从左侧碰撞，向左推
        newX = otherBounds.left - currentBounds.width - BUFFER;
      } else if (originalBounds.left >= otherBounds.right) {
        // 从右侧碰撞，向右推
        newX = otherBounds.right + BUFFER;
      } else if (originalBounds.bottom <= otherBounds.top) {
        // 从上方碰撞，向上推
        newY = otherBounds.top - currentBounds.height - BUFFER;
      } else if (originalBounds.top >= otherBounds.bottom) {
        // 从下方碰撞，向下推
        newY = otherBounds.bottom + BUFFER;
      } else {
        // 处理瞬移（计算逃离距离）
        const disLeft = currentBounds.right + BUFFER - otherBounds.left;
        const disRight = otherBounds.right - (currentBounds.left - BUFFER);
        const disTop = currentBounds.bottom + BUFFER - otherBounds.top;
        const disBottom = otherBounds.bottom - (currentBounds.top - BUFFER);

        const minDis = Math.min(disLeft, disRight, disTop, disBottom);

        switch (minDis) {
          case disLeft:
            newX -= disLeft;
            break;
          case disRight:
            newX += disRight;
            break;
          case disTop:
            newY -= disTop;
            break;
          case disBottom:
            newY += disBottom;
            break;
        }
      }

      // 更新当前边界以继续检测
      currentBounds = {
        left: newX,
        right: newX + currentBounds.width,
        top: newY,
        bottom: newY + currentBounds.height,
        width: currentBounds.width,
        height: currentBounds.height,
      };
    }
  }

  return { x: newX, y: newY };
};
