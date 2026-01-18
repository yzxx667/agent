# ⚡ 第六部分：性能优化和部署

## 📋 概述

本章将介绍项目的性能优化策略和部署配置，确保应用在生产环境中的稳定性和高性能表现。

## 🚀 性能优化

### 6.1 创建性能监控组件

创建 `components/common/PerformanceMonitor.tsx` 文件：

```typescript
'use client';

import { useEffect } from 'react';

interface PerformanceMonitorProps {
  children: React.ReactNode;
}

const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({ children }) => {
  useEffect(() => {
    // 监控页面加载性能
    if (typeof window !== 'undefined' && 'performance' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          // 监控 LCP (Largest Contentful Paint)
          if (entry.entryType === 'largest-contentful-paint') {
            console.log('LCP:', entry.startTime);
          }
          
          // 监控 FID (First Input Delay)
          if (entry.entryType === 'first-input') {
            console.log('FID:', entry.processingStart - entry.startTime);
          }
          
          // 监控 CLS (Cumulative Layout Shift)
          if (entry.entryType === 'layout-shift' && !entry.hadRecentInput) {
            console.log('CLS:', entry.value);
          }
        });
      });

      // 开始观察
      observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });

      return () => observer.disconnect();
    }
  }, []);

  return <>{children}</>;
};

export default PerformanceMonitor;
```

### 6.2 优化 Next.js 配置

更新 `next.config.js` 文件：

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // 启用实验性功能
  experimental: {
    // 优化包导入
    optimizePackageImports: ['antd', '@ant-design/icons'],
  },
  
  // 编译器优化
  compiler: {
    // 移除 console.log (生产环境)
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // 图片优化
  images: {
    domains: ['example.com'], // 添加外部图片域名
    formats: ['image/webp', 'image/avif'],
  },
  
  // 压缩配置
  compress: true,
  
  // 静态资源优化
  assetPrefix: process.env.NODE_ENV === 'production' ? '/static' : '',
  
  // 输出配置
  output: 'standalone', // 用于 Docker 部署
  
  // 重定向配置
  async redirects() {
    return [
      {
        source: '/',
        destination: '/dashboard',
        permanent: false,
      },
    ];
  },
  
  // 头部配置
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

### 6.3 创建错误边界组件

创建 `components/common/ErrorBoundary.tsx` 文件：

```typescript
'use client';

import React from 'react';
import { Result, Button } from 'antd';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; reset: () => void }>;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    
    // 这里可以发送错误报告到监控服务
    if (process.env.NODE_ENV === 'production') {
      // 发送到错误监控服务
      // reportError(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      const { fallback: Fallback } = this.props;
      
      if (Fallback) {
        return (
          <Fallback
            error={this.state.error}
            reset={() => this.setState({ hasError: false, error: undefined })}
          />
        );
      }

      return (
        <div className="min-h-screen flex items-center justify-center">
          <Result
            status="500"
            title="500"
            subTitle="抱歉，页面出现了错误。"
            extra={
              <Button
                type="primary"
                onClick={() => {
                  this.setState({ hasError: false, error: undefined });
                  window.location.reload();
                }}
              >
                刷新页面
              </Button>
            }
          />
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

### 6.4 优化根布局

更新 `app/layout.tsx` 文件，添加性能监控和错误边界：

```typescript
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { ConfigProvider } from 'antd';
import { theme } from '@/lib/theme';
import PerformanceMonitor from '@/components/common/PerformanceMonitor';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: 'swap', // 优化字体加载
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Next.js Admin Template",
  description: "A modern admin template built with Next.js, Ant Design, and Tailwind CSS",
  keywords: ["Next.js", "React", "Admin", "Dashboard", "Ant Design"],
  authors: [{ name: "Your Name" }],
  viewport: "width=device-width, initial-scale=1",
  robots: "index, follow",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ErrorBoundary>
          <AntdRegistry>
            <ConfigProvider theme={theme}>
              <PerformanceMonitor>
                {children}
              </PerformanceMonitor>
            </ConfigProvider>
          </AntdRegistry>
        </ErrorBoundary>
      </body>
    </html>
  );
}
```

## 🔧 构建优化

### 6.5 创建构建分析脚本

在 `package.json` 中添加构建分析脚本：

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "analyze": "ANALYZE=true next build",
    "build:prod": "NODE_ENV=production next build",
    "export": "next export"
  },
  "devDependencies": {
    "@next/bundle-analyzer": "^15.0.0"
  }
}
```

### 6.6 环境变量配置

创建 `.env.local` 文件：

```bash
# 开发环境配置
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api
NEXT_PUBLIC_APP_ENV=development

# 生产环境配置 (在 .env.production 中)
# NEXT_PUBLIC_API_BASE_URL=https://your-api.com/api
# NEXT_PUBLIC_APP_ENV=production
```

创建 `.env.production` 文件：

```bash
# 生产环境配置
NEXT_PUBLIC_API_BASE_URL=https://your-api.com/api
NEXT_PUBLIC_APP_ENV=production
```

## 🐳 Docker 部署

### 6.7 创建 Dockerfile

创建 `Dockerfile` 文件：

```dockerfile
# 使用官方 Node.js 镜像
FROM node:18-alpine AS base

# 安装依赖阶段
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# 复制依赖文件
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# 构建阶段
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 构建应用
RUN npm run build

# 运行阶段
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 复制构建产物
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

### 6.8 创建 Docker Compose 配置

创建 `docker-compose.yml` 文件：

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api
    restart: unless-stopped
    
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - app
    restart: unless-stopped
```

### 6.9 创建 Nginx 配置

创建 `nginx.conf` 文件：

```nginx
events {
    worker_connections 1024;
}

http {
    upstream app {
        server app:3000;
    }

    server {
        listen 80;
        server_name localhost;

        # 静态资源缓存
        location /_next/static/ {
            proxy_pass http://app;
            proxy_cache_valid 200 1y;
            add_header Cache-Control "public, immutable";
        }

        # 图片资源缓存
        location ~* \.(jpg|jpeg|png|gif|ico|svg)$ {
            proxy_pass http://app;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # 其他请求
        location / {
            proxy_pass http://app;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }
    }
}
```

## 🚀 部署脚本

### 6.10 创建部署脚本

创建 `scripts/deploy.sh` 文件：

```bash
#!/bin/bash

# 部署脚本
set -e

echo "🚀 开始部署..."

# 1. 拉取最新代码
echo "📥 拉取最新代码..."
git pull origin main

# 2. 安装依赖
echo "📦 安装依赖..."
npm ci

# 3. 构建项目
echo "🔨 构建项目..."
npm run build

# 4. 停止旧容器
echo "🛑 停止旧容器..."
docker-compose down

# 5. 构建新镜像
echo "🏗️ 构建新镜像..."
docker-compose build

# 6. 启动新容器
echo "▶️ 启动新容器..."
docker-compose up -d

# 7. 清理旧镜像
echo "🧹 清理旧镜像..."
docker image prune -f

echo "✅ 部署完成！"
echo "🌐 应用已启动在 http://localhost"
```

### 6.11 创建健康检查

创建 `app/api/health/route.ts` 文件：

```typescript
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // 这里可以添加数据库连接检查等
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0',
    };

    return NextResponse.json(health);
  } catch (error) {
    return NextResponse.json(
      { status: 'error', message: 'Health check failed' },
      { status: 500 }
    );
  }
}
```

## 📊 监控和日志

### 6.12 添加日志配置

创建 `lib/logger.ts` 文件：

```typescript
interface LogLevel {
  ERROR: 'error';
  WARN: 'warn';
  INFO: 'info';
  DEBUG: 'debug';
}

const LOG_LEVELS: LogLevel = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug',
};

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private log(level: keyof LogLevel, message: string, data?: any) {
    const timestamp = new Date().toISOString();
    const logData = {
      timestamp,
      level,
      message,
      ...(data && { data }),
    };

    if (this.isDevelopment) {
      console[level](logData);
    } else {
      // 生产环境可以发送到日志服务
      // sendToLogService(logData);
    }
  }

  error(message: string, data?: any) {
    this.log('error', message, data);
  }

  warn(message: string, data?: any) {
    this.log('warn', message, data);
  }

  info(message: string, data?: any) {
    this.log('info', message, data);
  }

  debug(message: string, data?: any) {
    if (this.isDevelopment) {
      this.log('debug', message, data);
    }
  }
}

export const logger = new Logger();
```

## ✅ 部署检查清单

### 6.13 部署前检查

在部署前，请确保完成以下检查：

- [ ] 环境变量配置正确
- [ ] 构建无错误和警告
- [ ] 所有测试通过
- [ ] 性能指标达标
- [ ] 安全配置完成
- [ ] 错误监控配置
- [ ] 备份策略制定
- [ ] 回滚方案准备

### 6.14 部署命令

```bash
# 开发环境
npm run dev

# 生产构建
npm run build:prod

# 启动生产服务
npm start

# Docker 部署
docker-compose up -d

# 健康检查
curl http://localhost/api/health
```

## 🎯 总结

恭喜！您已经完成了整个 Next.js Admin Pro 项目的搭建。这个项目包含了：

1. ✅ 现代化的技术栈和架构
2. ✅ 完整的布局控制系统
3. ✅ 企业级的组件库
4. ✅ 高性能的优化配置
5. ✅ 完善的部署方案

这个模板可以作为您后续项目的基础，根据具体需求进行扩展和定制。

---

> 💡 **提示**: 在生产环境中，建议配置专业的监控服务（如 Sentry、DataDog）来跟踪应用性能和错误。
