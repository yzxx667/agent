# 🎛️ 第四部分：布局系统

## 📋 概述

本章将循序渐进地构建一个智能的布局控制系统。我们将从最简单的布局开始，逐步添加侧边栏、头部、面包屑等功能。每一步都会详细说明设计思路和实现方法。

## 🎯 学习目标

完成本章后，你将掌握：
- 如何设计灵活的布局系统
- 如何实现响应式侧边栏导航
- 如何创建可配置的页面布局
- 如何处理布局状态管理

## 🧠 布局系统设计思路

### 4.1 分析布局需求

在开始编码之前，我们先分析一下企业级应用的布局需求：

1. **灵活性**：不同页面可能需要不同的布局（有些页面不需要侧边栏）
2. **响应式**：在不同屏幕尺寸下都能正常显示
3. **性能**：避免复杂的动画，确保流畅的用户体验
4. **可维护性**：布局逻辑要清晰，易于修改和扩展

### 4.2 布局组件架构

我们的布局系统将包含以下组件：
- `MainLayout`：主布局容器，负责整体布局逻辑
- `Sidebar`：侧边栏导航
- `Header`：顶部导航栏
- `Breadcrumb`：面包屑导航

### 4.3 第一步：创建布局 Hooks

在创建布局组件之前，我们先创建用于控制布局的 Hooks。创建 `lib/hooks/useLayout.ts` 文件：

```typescript
import React, { createContext, useContext } from 'react';

// 定义页面布局配置的类型
export interface PageLayoutConfig {
  showSidebar?: boolean;      // 是否显示侧边栏
  showHeader?: boolean;       // 是否显示头部
  showBreadcrumb?: boolean;   // 是否显示面包屑
  containerClassName?: string; // 容器样式类名
  title?: string;             // 页面标题
}

// 创建布局上下文
const PageLayoutContext = createContext<PageLayoutConfig | undefined>(undefined);

// 获取布局配置的 Hook
export function usePageLayout() {
  const context = useContext(PageLayoutContext);
  return context;
}

// 布局提供者组件
interface PageLayoutProviderProps {
  children: React.ReactNode;
  config?: PageLayoutConfig;
}

export function PageLayoutProvider({ children, config }: PageLayoutProviderProps) {
  return (
    <PageLayoutContext.Provider value={config}>
      {children}
    </PageLayoutContext.Provider>
  );
}

// 侧边栏可见性 Hook
export function useSidebarVisibility() {
  const layout = usePageLayout();
  return layout?.showSidebar ?? true; // 默认显示
}

// 头部可见性 Hook
export function useHeaderVisibility() {
  const layout = usePageLayout();
  return layout?.showHeader ?? true; // 默认显示
}

// 面包屑可见性 Hook
export function useBreadcrumbVisibility() {
  const layout = usePageLayout();
  return layout?.showBreadcrumb ?? true; // 默认显示
}

// 容器类名 Hook
export function useContainerClassName() {
  const layout = usePageLayout();
  return layout?.containerClassName ?? 'p-6'; // 默认内边距
}
```

**设计亮点：**
- 使用 React Context 实现布局配置的全局共享
- 每个布局元素都有对应的 Hook，使用简单
- 提供合理的默认值，减少配置负担
- 类型安全，避免配置错误

### 4.4 第二步：创建简单的主布局组件

现在我们创建主布局组件。创建 `components/layouts/MainLayout.tsx` 文件：

```typescript
'use client';

import React, { useState, useCallback } from 'react';
import { Layout } from 'antd';
import {
  useSidebarVisibility,
  useHeaderVisibility,
  useContainerClassName,
  useBreadcrumbVisibility
} from '@/lib/hooks/useLayout';

const { Content } = Layout;

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  // 侧边栏折叠状态
  const [collapsed, setCollapsed] = useState(false);

  // 使用布局控制 Hooks
  const showSidebar = useSidebarVisibility();
  const showHeader = useHeaderVisibility();
  const showBreadcrumb = useBreadcrumbVisibility();
  const containerClassName = useContainerClassName();

  // 切换侧边栏状态
  const toggleSidebar = useCallback(() => {
    setCollapsed(prev => !prev);
  }, []);

  // 场景1：最简布局 - 不显示侧边栏和头部
  if (!showSidebar && !showHeader) {
    return (
      <div className={containerClassName}>
        {children}
      </div>
    );
  }

  // 场景2：仅头部布局 - 只显示头部，不显示侧边栏
  if (!showSidebar && showHeader) {
    return (
      <Layout className="min-h-screen">
        {/* 这里我们先用占位符，后面会实现真正的 Header 组件 */}
        <div className="h-16 bg-white border-b border-gray-200 flex items-center px-6">
          <span className="font-semibold">应用头部</span>
        </div>
        <Content className="bg-white min-h-[calc(100vh-64px)] overflow-auto">
          <div className={containerClassName}>
            {showBreadcrumb && <div className="mb-4 text-gray-500">面包屑导航</div>}
            {children}
          </div>
        </Content>
      </Layout>
    );
  }

  // 场景3：完整布局 - 显示侧边栏和头部
  return (
    <Layout className="min-h-screen">
      {/* 侧边栏占位符 */}
      <div className={`fixed left-0 top-0 bottom-0 z-20 bg-white border-r border-gray-200 ${
        collapsed ? 'w-20' : 'w-64'
      }`}>
        <div className="p-4">
          <div className="font-semibold">侧边栏</div>
          <div className="text-sm text-gray-500">
            {collapsed ? '收起' : '展开'}
          </div>
        </div>
      </div>

      {/* 主内容区域 */}
      <Layout className={`${collapsed ? 'ml-20' : 'ml-64'}`}>
        {/* 头部占位符 */}
        <div className="h-16 bg-white border-b border-gray-200 flex items-center px-6">
          <button
            onClick={toggleSidebar}
            className="mr-4 px-2 py-1 border rounded hover:bg-gray-50"
          >
            {collapsed ? '展开' : '收起'}
          </button>
          <span className="font-semibold">应用头部</span>
        </div>

        <Content className="bg-white min-h-[calc(100vh-64px)] overflow-auto">
          <div className={containerClassName}>
            {showBreadcrumb && <div className="mb-4 text-gray-500">面包屑导航</div>}
            {children}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};
```

**实现说明：**
1. **渐进式开发**：先用占位符实现基本布局，后面再替换成真正的组件
2. **三种布局模式**：最简、仅头部、完整布局，满足不同页面需求
3. **响应式设计**：使用 Tailwind CSS 的响应式类名
4. **状态管理**：侧边栏折叠状态使用本地 state 管理

### 4.5 第三步：创建测试页面

在继续开发复杂组件之前，让我们先创建一个测试页面来验证布局系统：

```typescript
// app/layout-test/page.tsx
'use client';

import { MainLayout } from '@/components/layouts/MainLayout';
import { PageLayoutProvider } from '@/lib/hooks/useLayout';
import { Card, Button, Space } from 'antd';

export default function LayoutTestPage() {
  return (
    <PageLayoutProvider config={{
      showSidebar: true,
      showHeader: true,
      showBreadcrumb: true
    }}>
      <MainLayout>
        <div className="space-y-6">
          <Card title="布局测试页面">
            <p>这是一个测试页面，用于验证布局系统是否正常工作。</p>
            <Space>
              <Button type="primary">主要按钮</Button>
              <Button>次要按钮</Button>
            </Space>
          </Card>
        </div>
      </MainLayout>
    </PageLayoutProvider>
  );
}
```

现在你可以访问 `/layout-test` 页面来查看布局效果。

## 🎨 创建真正的侧边栏组件

### 4.6 第四步：实现侧边栏导航

现在我们来实现真正的侧边栏组件。创建 `components/layouts/Sidebar.tsx` 文件：

```typescript
'use client';

import React, { useState } from 'react';
import { Layout, Menu } from 'antd';
import { usePathname, useRouter } from 'next/navigation';
import {
  DashboardOutlined,
  UserOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';

const { Sider } = Layout;

// 定义侧边栏组件的属性
interface SidebarProps {
  collapsed: boolean;  // 是否折叠
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed }) => {
  const pathname = usePathname();  // 获取当前路径
  const router = useRouter();      // 路由对象

  // 管理菜单展开状态
  const [openKeys, setOpenKeys] = useState<string[]>(['users-group']);

  // 定义菜单项配置
  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '仪表盘',
    },
    {
      key: 'users-group', // 注意：这里用非路径的 key，避免和路由冲突
      icon: <UserOutlined />,
      label: '用户管理',
      children: [
        {
          key: '/users/list',
          label: '用户列表',
        },
        {
          key: '/users/roles',
          label: '角色管理',
        },
      ],
    },
  ];

  // 处理菜单点击事件
  const handleMenuClick: MenuProps['onClick'] = (e) => {
    // 只有叶子节点（实际页面）才进行路由跳转
    if (e.key.startsWith('/')) {
      router.push(e.key);
    }
  };

  // 处理菜单展开/收起
  const handleOpenChange = (keys: string[]) => {
    setOpenKeys(keys);
  };

  return (
    <Sider
      trigger={null}           // 不显示默认的折叠按钮
      collapsible             // 支持折叠
      collapsed={collapsed}   // 折叠状态
      className="fixed left-0 top-0 bottom-0 z-20 bg-white border-r border-gray-200"
      width={256}             // 展开时的宽度
      collapsedWidth={80}     // 折叠时的宽度
    >
      {/* Logo 区域 */}
      <div className="h-16 flex items-center justify-center border-b border-gray-200">
        <div className="flex items-center space-x-3">
          {/* 应用图标 */}
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">A</span>
          </div>
          {/* 应用名称 - 只在展开时显示 */}
          {!collapsed && (
            <div className="text-gray-800 font-semibold text-lg tracking-wide">
              Admin Pro
            </div>
          )}
        </div>
      </div>

      {/* 菜单区域 */}
      <div className="py-2">
        <Menu
          mode="inline"                    // 内联模式
          selectedKeys={[pathname]}        // 当前选中的菜单项
          openKeys={openKeys}              // 当前展开的菜单组
          onOpenChange={handleOpenChange}  // 展开状态变化回调
          items={menuItems}                // 菜单项配置
          onClick={handleMenuClick}        // 点击回调
          className="border-r-0"           // 移除右边框
          inlineIndent={20}                // 子菜单缩进
        />
      </div>
    </Sider>
  );
};

export default Sidebar;
```

**关键实现点：**

1. **状态管理**：使用 `useState` 管理菜单展开状态
2. **路由集成**：使用 Next.js 的 `usePathname` 和 `useRouter`
3. **菜单配置**：清晰的数据结构，易于维护
4. **响应式设计**：折叠时隐藏文字，只显示图标
5. **样式优化**：使用 Tailwind CSS 实现美观的界面

### 4.7 第五步：更新主布局组件

现在我们有了真正的侧边栏组件，让我们更新主布局组件来使用它：

```typescript
// 更新 components/layouts/MainLayout.tsx
'use client';

import React, { useState, useCallback } from 'react';
import { Layout } from 'antd';
import Sidebar from './Sidebar';  // 导入真正的侧边栏组件
import {
  useSidebarVisibility,
  useHeaderVisibility,
  useContainerClassName,
  useBreadcrumbVisibility
} from '@/lib/hooks/useLayout';

const { Content } = Layout;

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);

  const showSidebar = useSidebarVisibility();
  const showHeader = useHeaderVisibility();
  const showBreadcrumb = useBreadcrumbVisibility();
  const containerClassName = useContainerClassName();

  const toggleSidebar = useCallback(() => {
    setCollapsed(prev => !prev);
  }, []);

  // 场景3：完整布局 - 使用真正的侧边栏组件
  if (showSidebar) {
    return (
      <Layout className="min-h-screen">
        <Sidebar collapsed={collapsed} />

        <Layout className={`${collapsed ? 'ml-20' : 'ml-64'} transition-all duration-200`}>
          {showHeader && (
            <div className="h-16 bg-white border-b border-gray-200 flex items-center px-6">
              <button
                onClick={toggleSidebar}
                className="mr-4 px-3 py-1 border rounded hover:bg-gray-50 transition-colors"
              >
                {collapsed ? '展开' : '收起'}
              </button>
              <span className="font-semibold">应用头部</span>
            </div>
          )}

          <Content className="bg-gray-50 min-h-[calc(100vh-64px)] overflow-auto">
            <div className={containerClassName}>
              {showBreadcrumb && <div className="mb-4 text-gray-500">面包屑导航</div>}
              {children}
            </div>
          </Content>
        </Layout>
      </Layout>
    );
  }

  // 其他布局场景保持不变...
  return (
    <div className={containerClassName}>
      {children}
    </div>
  );
};
```

## 🎨 创建头部组件

### 4.8 第六步：实现头部导航栏

创建 `components/layouts/Header.tsx` 文件：

```typescript
'use client';

import React from 'react';
import { Layout, Button, Space, Avatar, Dropdown } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BellOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';

const { Header: AntHeader } = Layout;

// 定义头部组件的属性
interface HeaderProps {
  showMenuButton?: boolean;  // 是否显示菜单按钮
  onMenuClick?: () => void;  // 菜单按钮点击回调
  collapsed?: boolean;       // 侧边栏是否折叠
}

export const Header: React.FC<HeaderProps> = ({
  showMenuButton = true,
  onMenuClick,
  collapsed = false,
}) => {
  // 用户下拉菜单配置
  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人资料',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '设置',
    },
    {
      type: 'divider',  // 分割线
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      danger: true,     // 危险操作样式
    },
  ];

  // 处理用户菜单点击
  const handleUserMenuClick: MenuProps['onClick'] = (e) => {
    switch (e.key) {
      case 'logout':
        // TODO: 实现退出登录逻辑
        console.log('退出登录');
        break;
      case 'profile':
        // TODO: 跳转到个人资料页面
        console.log('个人资料');
        break;
      case 'settings':
        // TODO: 跳转到设置页面
        console.log('设置');
        break;
    }
  };

  return (
    <AntHeader className="flex items-center justify-between px-6 bg-white border-b border-gray-200 h-16">
      {/* 左侧区域：菜单控制按钮 */}
      <div className="flex items-center">
        {showMenuButton && (
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={onMenuClick}
            className="text-lg hover:bg-gray-100"
            title={collapsed ? '展开菜单' : '收起菜单'}
          />
        )}
      </div>

      {/* 右侧区域：用户操作 */}
      <div className="flex items-center">
        <Space size="middle">
          {/* 通知按钮 */}
          <Button
            type="text"
            icon={<BellOutlined />}
            className="text-lg hover:bg-gray-100"
            title="通知"
          />

          {/* 用户下拉菜单 */}
          <Dropdown
            menu={{
              items: userMenuItems,
              onClick: handleUserMenuClick,
            }}
            placement="bottomRight"
            arrow
          >
            <div className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors">
              <Avatar size="small" icon={<UserOutlined />} />
              <span className="text-sm font-medium text-gray-700">管理员</span>
            </div>
          </Dropdown>
        </Space>
      </div>
    </AntHeader>
  );
};
```

**设计特点：**

1. **灵活配置**：通过 props 控制是否显示菜单按钮
2. **用户体验**：添加 hover 效果和 title 提示
3. **功能完整**：包含通知、用户菜单等常见功能
4. **样式统一**：使用一致的颜色和间距

## 🧭 面包屑导航

### 4.9 第七步：创建面包屑组件

面包屑导航帮助用户了解当前位置，并提供快速导航功能。创建 `components/common/Breadcrumb.tsx` 文件：

```typescript
'use client';

import React from 'react';
import { Breadcrumb as AntBreadcrumb } from 'antd';
import { usePathname } from 'next/navigation';
import { HomeOutlined, UserOutlined, DashboardOutlined } from '@ant-design/icons';

const Breadcrumb: React.FC = () => {
  const pathname = usePathname();

  // 路径到标题的映射配置
  // 这里可以根据实际项目需求进行扩展
  const pathMap: Record<string, { title: string; icon?: React.ReactNode }> = {
    '/': { title: '首页', icon: <HomeOutlined /> },
    '/dashboard': { title: '仪表盘', icon: <DashboardOutlined /> },
    '/users': { title: '用户管理', icon: <UserOutlined /> },
    '/users/list': { title: '用户列表' },
    '/users/roles': { title: '角色管理' },
  };

  // 生成面包屑项目
  const generateBreadcrumbItems = () => {
    // 分割路径，过滤空字符串
    const pathSegments = pathname.split('/').filter(Boolean);

    // 始终包含首页
    const items = [
      {
        title: (
          <span className="flex items-center">
            <HomeOutlined className="mr-1" />
            首页
          </span>
        ),
        href: '/',
      },
    ];

    // 逐级构建路径
    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const config = pathMap[currentPath];

      if (config) {
        const isLast = index === pathSegments.length - 1;
        items.push({
          title: (
            <span className="flex items-center">
              {config.icon && <span className="mr-1">{config.icon}</span>}
              {config.title}
            </span>
          ),
          // 最后一项不设置链接（当前页面）
          href: isLast ? undefined : currentPath,
        });
      }
    });

    return items;
  };

  const items = generateBreadcrumbItems();

  return (
    <div className="mb-6">
      <AntBreadcrumb items={items} />
    </div>
  );
};

export default Breadcrumb;
```

**实现要点：**

1. **动态生成**：根据当前路径自动生成面包屑
2. **图标支持**：为不同层级添加对应图标
3. **可点击导航**：除当前页面外，其他层级都可点击跳转
4. **易于扩展**：通过 `pathMap` 配置新的路径映射

### 4.10 第八步：完整的主布局组件

现在我们把所有组件整合到一起，创建完整的主布局：

```typescript
// 更新 components/layouts/MainLayout.tsx
'use client';

import React, { useState, useCallback } from 'react';
import { Layout } from 'antd';
import Sidebar from './Sidebar';
import { Header } from './Header';
import Breadcrumb from '../common/Breadcrumb';
import {
  useSidebarVisibility,
  useHeaderVisibility,
  useContainerClassName,
  useBreadcrumbVisibility
} from '@/lib/hooks/useLayout';

const { Content } = Layout;

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);

  const showSidebar = useSidebarVisibility();
  const showHeader = useHeaderVisibility();
  const showBreadcrumb = useBreadcrumbVisibility();
  const containerClassName = useContainerClassName();

  const toggleSidebar = useCallback(() => {
    setCollapsed(prev => !prev);
  }, []);

  // 场景1：最简布局
  if (!showSidebar && !showHeader) {
    return (
      <div className={containerClassName}>
        {children}
      </div>
    );
  }

  // 场景2：仅头部布局
  if (!showSidebar && showHeader) {
    return (
      <Layout className="min-h-screen">
        <Header showMenuButton={false} />
        <Content className="bg-gray-50 min-h-[calc(100vh-64px)] overflow-auto">
          <div className={containerClassName}>
            {showBreadcrumb && <Breadcrumb />}
            {children}
          </div>
        </Content>
      </Layout>
    );
  }

  // 场景3：完整布局
  return (
    <Layout className="min-h-screen">
      <Sidebar collapsed={collapsed} />

      <Layout className={`${collapsed ? 'ml-20' : 'ml-64'} transition-all duration-200`}>
        {showHeader && (
          <Header
            showMenuButton={true}
            onMenuClick={toggleSidebar}
            collapsed={collapsed}
          />
        )}

        <Content className="bg-gray-50 min-h-[calc(100vh-64px)] overflow-auto">
          <div className={containerClassName}>
            {showBreadcrumb && <Breadcrumb />}
            {children}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};
```

## 📱 响应式设计

### 4.11 第九步：添加响应式支持

为了在移动设备上提供更好的体验，我们需要添加响应式支持：

```typescript
// 更新 components/layouts/Sidebar.tsx，添加响应式逻辑
import { useEffect } from 'react';

const Sidebar: React.FC<SidebarProps> = ({ collapsed }) => {
  // ... 现有代码

  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      className="fixed left-0 top-0 bottom-0 z-20 bg-white border-r border-gray-200"
      width={256}
      collapsedWidth={80}
      breakpoint="lg"        // 在 lg 断点以下自动折叠
      onBreakpoint={(broken) => {
        // 可以在这里处理断点变化
        console.log('断点变化:', broken);
      }}
    >
      {/* ... 现有内容 */}
    </Sider>
  );
};
```

## 🎨 页面布局配置

### 4.12 第十步：创建布局配置系统

为了让不同页面能够使用不同的布局，我们创建一个配置系统。创建 `lib/config/layout.ts` 文件：

```typescript
import type { PageLayoutConfig } from '@/lib/hooks/useLayout';

/**
 * 默认布局配置
 * 大多数页面都会使用这个配置
 */
export const DEFAULT_LAYOUT: PageLayoutConfig = {
  showSidebar: true,
  showHeader: true,
  showBreadcrumb: true,
  containerClassName: 'p-6',
};

/**
 * 特殊页面的布局配置
 * 根据路径匹配对应的布局
 */
export const PAGE_LAYOUTS: Record<string, PageLayoutConfig> = {
  // 登录页面 - 最简布局
  '/login': {
    showSidebar: false,
    showHeader: false,
    showBreadcrumb: false,
    containerClassName: 'min-h-screen flex items-center justify-center bg-gray-50',
  },

  // 全屏展示页面 - 无任何布局元素
  '/fullscreen': {
    showSidebar: false,
    showHeader: false,
    showBreadcrumb: false,
    containerClassName: 'h-screen w-screen',
  },

  // 内容展示页面 - 仅头部
  '/content-only': {
    showSidebar: false,
    showHeader: true,
    showBreadcrumb: true,
    containerClassName: 'p-6 max-w-4xl mx-auto',
  },
};

/**
 * 根据路径获取布局配置
 * @param pathname 当前页面路径
 * @returns 对应的布局配置
 */
export function getPageLayout(pathname: string): PageLayoutConfig {
  return PAGE_LAYOUTS[pathname] || DEFAULT_LAYOUT;
}

/**
 * 检查路径是否需要特殊布局
 * @param pathname 当前页面路径
 * @returns 是否有特殊布局配置
 */
export function hasCustomLayout(pathname: string): boolean {
  return pathname in PAGE_LAYOUTS;
}
```

**配置说明：**
- `DEFAULT_LAYOUT`：标准的管理后台布局
- `PAGE_LAYOUTS`：特殊页面的布局配置
- `getPageLayout`：根据路径获取对应配置的工具函数

## ✅ 使用布局系统

### 4.13 第十一步：创建完整的示例页面

现在让我们创建一个完整的示例页面来展示布局系统的使用。创建 `app/dashboard/page.tsx`：

```typescript
'use client';

import { Card, Row, Col, Statistic } from 'antd';
import { UserOutlined, ShoppingCartOutlined, DollarOutlined } from '@ant-design/icons';
import { MainLayout } from '@/components/layouts/MainLayout';
import { PageLayoutProvider } from '@/lib/hooks/useLayout';

export default function Dashboard() {
  return (
    <PageLayoutProvider config={{
      showSidebar: true,
      showHeader: true,
      showBreadcrumb: true,
      title: '仪表盘'
    }}>
      <MainLayout>
        <div className="space-y-6">
          {/* 页面标题 */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">仪表盘</h1>
            <p className="text-gray-600">欢迎回来，这里是您的数据概览</p>
          </div>

          {/* 统计卡片 */}
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="总用户数"
                  value={1128}
                  prefix={<UserOutlined />}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="订单数"
                  value={93}
                  prefix={<ShoppingCartOutlined />}
                  valueStyle={{ color: '#cf1322' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="收入"
                  value={112893}
                  prefix={<DollarOutlined />}
                  precision={2}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
          </Row>

          {/* 其他内容区域 */}
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={16}>
              <Card title="数据趋势" className="h-96">
                <div className="flex items-center justify-center h-full text-gray-500">
                  图表区域（可以集成 ECharts 等图表库）
                </div>
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Card title="快速操作" className="h-96">
                <div className="space-y-4">
                  <button className="w-full p-3 text-left border rounded hover:bg-gray-50">
                    添加新用户
                  </button>
                  <button className="w-full p-3 text-left border rounded hover:bg-gray-50">
                    查看报告
                  </button>
                  <button className="w-full p-3 text-left border rounded hover:bg-gray-50">
                    系统设置
                  </button>
                </div>
              </Card>
            </Col>
          </Row>
        </div>
      </MainLayout>
    </PageLayoutProvider>
  );
}
```

### 4.14 创建不同布局的示例页面

让我们再创建一个登录页面来展示最简布局：

```typescript
// app/login/page.tsx
'use client';

import { Card, Form, Input, Button } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { MainLayout } from '@/components/layouts/MainLayout';
import { PageLayoutProvider } from '@/lib/hooks/useLayout';

export default function LoginPage() {
  const onFinish = (values: any) => {
    console.log('登录信息:', values);
  };

  return (
    <PageLayoutProvider config={{
      showSidebar: false,
      showHeader: false,
      showBreadcrumb: false,
      containerClassName: 'min-h-screen flex items-center justify-center bg-gray-50'
    }}>
      <MainLayout>
        <Card className="w-full max-w-md">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">登录</h1>
            <p className="text-gray-600 mt-2">请输入您的账号信息</p>
          </div>

          <Form onFinish={onFinish} layout="vertical">
            <Form.Item
              name="username"
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="用户名"
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="密码"
                size="large"
              />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" size="large" block>
                登录
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </MainLayout>
    </PageLayoutProvider>
  );
}
```

## 🎯 总结与下一步

### 布局系统的优势

1. **灵活性**：通过配置轻松控制不同页面的布局
2. **可维护性**：组件化设计，易于修改和扩展
3. **类型安全**：完整的 TypeScript 支持
4. **用户体验**：响应式设计，适配不同设备

### 下一步计划

布局系统构建完成后，我们将在下一章开始创建具体的业务页面：
- 用户列表页面
- 用户详情页面
- 角色管理页面
- 表单组件封装

---

> 💡 **学习要点**:
> - 布局系统是前端应用的基础架构，需要在项目初期就设计好
> - 使用 Context 和 Hooks 可以实现灵活的布局控制
> - 渐进式开发：先实现基本功能，再逐步完善细节
> - 响应式设计要从一开始就考虑，而不是后期添加
