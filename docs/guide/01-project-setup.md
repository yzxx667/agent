# 🚀 第一部分：项目初始化

## 📋 概述

本章将从零开始创建一个企业级的 Next.js 管理后台项目。我们将使用 Next.js 15.5.2、TypeScript、Tailwind CSS 和 Ant Design 来构建一个现代化、高性能的管理系统。

## 🛠️ 环境准备

### 1.1 检查开发环境

确保您的开发环境满足以下要求：

```bash
# 检查 Node.js 版本 (需要 18.17 或更高)
node --version
# 输出示例: v18.17.0

# 检查 npm 版本
npm --version
# 输出示例: 9.6.7

# 检查 Git 版本
git --version
# 输出示例: git version 2.39.0
```

### 1.2 选择包管理器

本教程支持多种包管理器，推荐使用 npm（默认）：

```bash
# 选项 1: 使用 npm (推荐，默认)
npm --version

# 选项 2: 使用 yarn
npm install -g yarn
yarn --version

# 选项 3: 使用 pnpm (更快，但可能有兼容性问题)
npm install -g pnpm
pnpm --version
```

## 🏗️ 创建项目

### 2.1 初始化 Next.js 项目

使用官方脚手架创建项目：

```bash
# 创建项目
npx create-next-app@latest next-template --typescript --tailwind --eslint --app --import-alias "@/*"

# 进入项目目录
cd next-template

# 启动开发服务器
npm run dev
```

**配置选项说明：**
- `--typescript`: 启用 TypeScript 支持
- `--tailwind`: 集成 Tailwind CSS
- `--eslint`: 配置 ESLint 代码检查
- `--app`: 使用 App Router (Next.js 13+ 推荐)
- `--import-alias "@/*"`: 配置路径别名

### 2.2 验证项目创建

访问 `http://localhost:3000`，您应该看到 Next.js 的欢迎页面。

## 📦 安装核心依赖

### 3.1 安装 Ant Design

```bash
# 安装 Ant Design 核心包
npm install antd @ant-design/icons @ant-design/nextjs-registry

# 安装日期处理库 (Ant Design 依赖)
npm install dayjs
```

### 3.2 安装工具库

```bash
# 安装 CSS 类名处理工具
npm install clsx tailwind-merge

# 安装类型定义
npm install -D @types/node
```

### 3.3 验证依赖安装

检查 `package.json` 文件，确保依赖正确安装：

```json
{
  "dependencies": {
    "next": "15.5.2",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "antd": "^5.22.2",
    "@ant-design/icons": "^5.5.1",
    "@ant-design/nextjs-registry": "^1.0.1",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.5.4",
    "dayjs": "^1.11.13"
  }
}
```

## 🏗️ 项目结构规划

### 4.1 创建目录结构

在项目根目录下创建以下目录结构：

```bash
# 创建组件目录
mkdir -p components/common components/layouts components/ui

# 创建工具库目录
mkdir -p lib/config lib/hooks lib/services lib/types lib/utils

# 创建页面目录
mkdir -p app/dashboard app/users/list app/users/roles

# 创建文档目录
mkdir -p docs/guide
```

### 4.2 最终项目结构

完成后的项目结构应该如下：

```
next-template/
├── app/                     # Next.js App Router 页面
│   ├── globals.css          # 全局样式
│   ├── layout.tsx           # 根布局组件
│   ├── page.tsx             # 首页
│   ├── dashboard/           # 仪表盘页面
│   │   └── page.tsx
│   └── users/               # 用户管理页面
│       ├── list/
│       │   └── page.tsx
│       └── roles/
│           └── page.tsx
├── components/              # 可复用组件
│   ├── common/              # 通用组件
│   ├── layouts/             # 布局组件
│   └── ui/                  # UI 组件
├── lib/                     # 工具库和配置
│   ├── config/              # 配置文件
│   ├── hooks/               # 自定义 Hooks
│   ├── services/            # API 服务
│   ├── types/               # TypeScript 类型定义
│   └── utils/               # 工具函数
├── public/                  # 静态资源
├── docs/                    # 项目文档
│   └── guide/               # 教程文档
├── .eslintrc.json          # ESLint 配置
├── .gitignore              # Git 忽略文件
├── next.config.js          # Next.js 配置
├── package.json            # 项目依赖
├── tailwind.config.ts      # Tailwind 配置
└── tsconfig.json           # TypeScript 配置
```

## ✅ 验证安装

### 5.1 启动开发服务器

```bash
npm run dev
```

### 5.2 检查构建

```bash
npm run build
```

如果没有错误，说明项目初始化成功！

## 🎯 下一步

项目初始化完成后，我们将在下一章配置 Ant Design 主题和 Tailwind CSS，为后续开发做好准备。

---

> 💡 **提示**: 如果遇到依赖安装问题，可以尝试删除 `node_modules` 和 `package-lock.json`，然后重新运行 `npm install`。
