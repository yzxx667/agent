# 🚀 第八部分：生产部署

## 📋 概述

本章将介绍项目的部署策略，包括构建配置优化、环境变量管理、Docker 容器化、云平台部署和 CI/CD 流程配置。

## 🔧 构建配置

### 10.1 生产环境构建

创建生产环境构建脚本：

```json
{
  "scripts": {
    "build": "next build",
    "build:prod": "NODE_ENV=production next build",
    "start": "next start",
    "start:prod": "NODE_ENV=production next start -p 3000",
    "export": "next export",
    "analyze": "ANALYZE=true next build"
  }
}
```

### 10.2 环境变量配置

创建环境变量文件：

`.env.local` (开发环境):
```bash
# 开发环境配置
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api
NEXT_PUBLIC_APP_ENV=development
NEXT_PUBLIC_APP_VERSION=1.0.0

# 数据库配置
DATABASE_URL=postgresql://user:password@localhost:5432/dev_db

# 认证配置
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000
```

`.env.production` (生产环境):
```bash
# 生产环境配置
NEXT_PUBLIC_API_BASE_URL=https://api.yourapp.com
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_APP_VERSION=1.0.0

# 数据库配置
DATABASE_URL=postgresql://user:password@prod-db:5432/prod_db

# 认证配置
NEXTAUTH_SECRET=your-production-secret
NEXTAUTH_URL=https://yourapp.com
```

### 10.3 构建优化配置

更新 `next.config.js`：

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // 输出配置
  output: 'standalone',
  
  // 压缩配置
  compress: true,
  
  // 静态资源优化
  assetPrefix: process.env.CDN_URL || '',
  
  // 图片优化
  images: {
    domains: ['cdn.yourapp.com'],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 天
  },
  
  // 安全头部
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
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
        ],
      },
    ];
  },
  
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
};

module.exports = nextConfig;
```

## 🐳 Docker 部署

### 10.4 创建 Dockerfile

```dockerfile
# 多阶段构建
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

# 设置环境变量
ENV NEXT_TELEMETRY_DISABLED 1

# 构建应用
RUN npm run build

# 运行阶段
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 复制构建产物
COPY --from=builder /app/public ./public

# 自动利用输出跟踪来减少镜像大小
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

### 10.5 Docker Compose 配置

创建 `docker-compose.yml`：

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
      - NEXT_PUBLIC_API_BASE_URL=http://api:3001/api
    depends_on:
      - redis
      - postgres
    restart: unless-stopped
    
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped
    
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped
    
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: nextapp
      POSTGRES_USER: nextuser
      POSTGRES_PASSWORD: nextpass
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped

volumes:
  redis_data:
  postgres_data:
```

### 10.6 Nginx 配置

创建 `nginx.conf`：

```nginx
events {
    worker_connections 1024;
}

http {
    upstream app {
        server app:3000;
    }

    # 启用 gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    server {
        listen 80;
        server_name yourapp.com www.yourapp.com;
        
        # 重定向到 HTTPS
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name yourapp.com www.yourapp.com;

        # SSL 配置
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;

        # 静态资源缓存
        location /_next/static/ {
            proxy_pass http://app;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # 图片资源缓存
        location ~* \.(jpg|jpeg|png|gif|ico|svg|webp)$ {
            proxy_pass http://app;
            expires 30d;
            add_header Cache-Control "public";
        }

        # API 请求
        location /api/ {
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

## ☁️ 云平台部署

### 10.7 Vercel 部署

创建 `vercel.json`：

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/"
    }
  ],
  "env": {
    "NEXT_PUBLIC_API_BASE_URL": "@api_base_url",
    "DATABASE_URL": "@database_url"
  },
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

部署命令：
```bash
# 安装 Vercel CLI
npm install -g vercel

# 登录并部署
vercel login
vercel --prod
```

### 10.8 AWS 部署

创建 `aws-deploy.yml` (GitHub Actions):

```yaml
name: Deploy to AWS

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build application
      run: npm run build
      env:
        NEXT_PUBLIC_API_BASE_URL: ${{ secrets.API_BASE_URL }}
    
    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v2
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: us-east-1
    
    - name: Deploy to S3
      run: |
        aws s3 sync ./out s3://${{ secrets.S3_BUCKET }} --delete
    
    - name: Invalidate CloudFront
      run: |
        aws cloudfront create-invalidation --distribution-id ${{ secrets.CLOUDFRONT_ID }} --paths "/*"
```

## 🔄 CI/CD 流程

### 10.9 GitHub Actions

创建 `.github/workflows/ci.yml`：

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run linting
      run: npm run lint
    
    - name: Run tests
      run: npm run test
    
    - name: Build application
      run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Build and push Docker image
      uses: docker/build-push-action@v4
      with:
        context: .
        push: true
        tags: yourregistry/nextapp:latest
    
    - name: Deploy to production
      run: |
        # 部署脚本
        echo "Deploying to production..."
```

### 10.10 部署脚本

创建 `scripts/deploy.sh`：

```bash
#!/bin/bash

set -e

echo "🚀 开始部署..."

# 1. 检查环境
if [ -z "$NODE_ENV" ]; then
  export NODE_ENV=production
fi

# 2. 拉取最新代码
echo "📥 拉取最新代码..."
git pull origin main

# 3. 安装依赖
echo "📦 安装依赖..."
npm ci --only=production

# 4. 构建项目
echo "🔨 构建项目..."
npm run build

# 5. 停止旧服务
echo "🛑 停止旧服务..."
docker-compose down

# 6. 启动新服务
echo "▶️ 启动新服务..."
docker-compose up -d

# 7. 健康检查
echo "🔍 健康检查..."
sleep 10
curl -f http://localhost/api/health || exit 1

# 8. 清理
echo "🧹 清理旧镜像..."
docker image prune -f

echo "✅ 部署完成！"
echo "🌐 应用已启动在 http://localhost"
```

## 📊 监控和日志

### 10.11 健康检查

创建 `app/api/health/route.ts`：

```typescript
import { NextResponse } from 'next/server';

export async function GET() {
  try {
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

### 10.12 日志配置

创建 `lib/logger.ts`：

```typescript
interface LogLevel {
  ERROR: 'error';
  WARN: 'warn';
  INFO: 'info';
  DEBUG: 'debug';
}

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
      // 生产环境发送到日志服务
      this.sendToLogService(logData);
    }
  }

  private sendToLogService(logData: any) {
    // 发送到 ELK Stack, Datadog, 或其他日志服务
    // fetch('/api/logs', { method: 'POST', body: JSON.stringify(logData) });
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

### 10.13 部署前检查

- [ ] 环境变量配置正确
- [ ] 构建无错误和警告
- [ ] 所有测试通过
- [ ] 安全配置完成
- [ ] SSL 证书配置
- [ ] 数据库迁移完成
- [ ] 备份策略制定
- [ ] 监控配置完成
- [ ] 日志收集配置
- [ ] 回滚方案准备

## 🎯 下一步

部署配置完成后，我们将在下一章建立开发规范，确保团队协作的一致性和代码质量。

---

> 💡 **提示**: 在生产环境中，建议使用专业的监控服务（如 Datadog、New Relic）来跟踪应用性能和错误。
