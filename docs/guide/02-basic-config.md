# ⚙️ 第二部分：基础配置

## 📋 概述

本章将配置项目的基础设施，包括 Ant Design 主题、Tailwind CSS 集成、TypeScript 配置优化和全局样式设置。这些配置将为后续开发提供坚实的基础。

## 🎨 配置 Ant Design

### 2.1 创建主题配置

创建 `lib/theme.ts` 文件：

```typescript
import type { ThemeConfig } from 'antd';

export const theme: ThemeConfig = {
  token: {
    // 主色调
    colorPrimary: '#1677ff',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    colorInfo: '#1677ff',
    
    // 字体
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontSize: 14,
    
    // 圆角
    borderRadius: 6,
    
    // 间距
    padding: 16,
    margin: 16,
    
    // 阴影
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)',
  },
  components: {
    Layout: {
      headerBg: '#ffffff',
      siderBg: '#ffffff',
      bodyBg: '#f5f5f5',
    },
    Menu: {
      itemBg: 'transparent',
      itemSelectedBg: '#e6f4ff',
      itemSelectedColor: '#1677ff',
      itemHoverBg: '#f5f5f5',
    },
    Button: {
      borderRadius: 6,
    },
    Card: {
      borderRadius: 8,
    },
  },
};
```

### 2.2 配置根布局

更新 `app/layout.tsx` 文件：

```typescript
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { ConfigProvider } from 'antd';
import { theme } from '@/lib/theme';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Next.js Admin Template",
  description: "A modern admin template built with Next.js, Ant Design, and Tailwind CSS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AntdRegistry>
          <ConfigProvider theme={theme}>
            {children}
          </ConfigProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
```

## 🎯 配置 Tailwind CSS

### 3.1 更新 Tailwind 配置

更新 `tailwind.config.ts` 文件：

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          50: '#e6f4ff',
          100: '#bae0ff',
          200: '#91caff',
          300: '#69b1ff',
          400: '#4096ff',
          500: '#1677ff',
          600: '#0958d9',
          700: '#003eb3',
          800: '#002c8c',
          900: '#001d66',
        },
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
  // 确保与 Ant Design 兼容
  corePlugins: {
    preflight: false,
  },
};

export default config;
```

### 3.2 创建工具函数

创建 `lib/utils.ts` 文件：

```typescript
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * 合并 CSS 类名，支持条件类名和 Tailwind CSS 冲突解决
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 格式化日期
 */
export function formatDate(date: Date | string | number): string {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

/**
 * 延迟函数
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 生成随机 ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}
```

## 📝 配置 TypeScript

### 4.1 更新 TypeScript 配置

更新 `tsconfig.json` 文件：

```json
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    },
    "target": "ES2017",
    "forceConsistentCasingInFileNames": true
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### 4.2 创建类型定义

创建 `lib/types/index.ts` 文件：

```typescript
import { ReactNode } from 'react';

/**
 * 基础 API 响应类型
 */
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
  success: boolean;
}

/**
 * 分页参数
 */
export interface PaginationParams {
  current: number;
  pageSize: number;
  total?: number;
}

/**
 * 布局配置
 */
export interface LayoutConfig {
  showSidebar?: boolean;
  showHeader?: boolean;
  showBreadcrumb?: boolean;
  containerClassName?: string;
}

/**
 * 页面布局配置
 */
export interface PageLayoutConfig extends LayoutConfig {
  title?: string;
  description?: string;
}

/**
 * 用户信息
 */
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

/**
 * 菜单项
 */
export interface MenuItem {
  key: string;
  label: string;
  icon?: ReactNode;
  children?: MenuItem[];
  path?: string;
}
```

## 🎨 全局样式配置

### 5.1 更新全局样式

更新 `app/globals.css` 文件：

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* 自定义 CSS 变量 */
:root {
  --foreground-rgb: 0, 0, 0;
  --background-start-rgb: 214, 219, 220;
  --background-end-rgb: 255, 255, 255;
}

@media (prefers-color-scheme: dark) {
  :root {
    --foreground-rgb: 255, 255, 255;
    --background-start-rgb: 0, 0, 0;
    --background-end-rgb: 0, 0, 0;
  }
}

/* 基础样式重置 */
* {
  box-sizing: border-box;
  padding: 0;
  margin: 0;
}

html,
body {
  max-width: 100vw;
  overflow-x: hidden;
  font-family: var(--font-geist-sans), system-ui, sans-serif;
}

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* Ant Design 样式覆盖 */
.ant-layout {
  background: #f5f5f5 !important;
}

.ant-layout-header {
  padding: 0 24px !important;
  background: #ffffff !important;
  border-bottom: 1px solid #f0f0f0;
}

.ant-layout-sider {
  background: #ffffff !important;
  border-right: 1px solid #f0f0f0;
}

/* 工具类 */
.page-content {
  min-height: calc(100vh - 64px);
}

.fade-in {
  animation: fadeIn 0.2s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
```

## ✅ 验证配置

### 6.1 测试主题配置

创建一个简单的测试页面来验证配置：

更新 `app/page.tsx`：

```typescript
import { Button, Card, Space } from 'antd';
import { UserOutlined, SettingOutlined } from '@ant-design/icons';

export default function Home() {
  return (
    <div className="p-8 space-y-6">
      <Card title="配置测试" className="max-w-md">
        <Space direction="vertical" className="w-full">
          <Button type="primary" icon={<UserOutlined />}>
            主要按钮
          </Button>
          <Button icon={<SettingOutlined />}>
            默认按钮
          </Button>
          <div className="text-primary-500">
            Tailwind 主色调文本
          </div>
        </Space>
      </Card>
    </div>
  );
}
```

### 6.2 启动开发服务器

```bash
npm run dev
```

访问 `http://localhost:3000`，您应该看到配置好的主题效果。

## 🎯 下一步

基础配置完成后，我们将在下一章开始构建项目的核心架构，包括工具函数、服务层和自定义 Hooks。

---

> 💡 **提示**: 如果样式没有正确应用，请检查 Tailwind CSS 的 `corePlugins.preflight` 设置，确保与 Ant Design 兼容。
