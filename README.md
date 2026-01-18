# Next.js Admin Template

一个基于 Next.js 15、Ant Design 5 和 Tailwind CSS 4 构建的现代化管理后台模板。

## 🚀 快速开始

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build
```

## 🏗️ 项目结构

```
next-template/
├── app/                    # 页面路由 (Next.js App Router)
│   ├── api/               # API 路由
│   │   └── users/         # 用户相关 API
│   ├── dashboard/         # 仪表盘页面
│   ├── users/            # 用户管理模块
│   │   ├── list/         # 用户列表页
│   │   └── roles/        # 角色管理页
│   ├── agent/            # 智能体模块
│   └── workflow/         # 工作流模块
├── components/            # 可复用组件
│   ├── layouts/          # 布局组件
│   │   ├── MainLayout.tsx # 主布局
│   │   ├── Header.tsx    # 顶部导航
│   │   └── Sidebar.tsx   # 侧边栏菜单
│   └── common/           # 通用组件
│       ├── PageHeader.tsx # 页面头部
│       ├── StatsCard.tsx # 统计卡片
│       └── DataTable.tsx # 数据表格
├── lib/                  # 工具库和配置
│   ├── services/         # API 服务层
│   ├── types/           # TypeScript 类型定义
│   ├── hooks/           # 自定义 Hooks
│   ├── utils/           # 工具函数
│   └── constants/       # 常量配置
└── public/              # 静态资源
```

## � 开发指南

### 如何开发一个完整的模块

以创建"商品管理"模块为例，展示完整的开发流程：

#### 1. 创建页面路由

```bash
# 创建商品管理目录结构
mkdir -p app/products/list
mkdir -p app/products/[id]
```

创建页面文件：

```tsx
// app/products/list/page.tsx
'use client';

import React from 'react';
import { MainLayout } from '@/components/layouts/MainLayout';
import { PageHeader } from '@/components/common/PageHeader';

export default function ProductList() {
  const breadcrumbs = [
    { title: '商品管理' },
    { title: '商品列表' },
  ];

  return (
    <MainLayout>
      <PageHeader
        title="商品列表"
        subtitle="管理系统中的所有商品"
        breadcrumbs={breadcrumbs}
      />
      {/* 页面内容 */}
    </MainLayout>
  );
}
```

#### 2. 定义 TypeScript 类型

```tsx
// lib/types/product.ts
export interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductRequest {
  name: string;
  price: number;
  category: string;
  description?: string;
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {}

export interface GetProductsParams {
  page?: number;
  pageSize?: number;
  category?: string;
  status?: string;
  keyword?: string;
}
```

#### 3. 创建 API 服务层

```tsx
// lib/services/product.service.ts
import { http } from './http';
import type { Product, CreateProductRequest, UpdateProductRequest, GetProductsParams } from '@/lib/types/product';
import type { PaginatedResponse } from '@/lib/types/api';

export class ProductService {
  private readonly baseUrl = '/api/products';

  async getProducts(params?: GetProductsParams): Promise<PaginatedResponse<Product>> {
    const response = await http.get<PaginatedResponse<Product>>(this.baseUrl, params);
    return response.data;
  }

  async getProductById(id: number): Promise<Product> {
    const response = await http.get<Product>(`${this.baseUrl}/${id}`);
    return response.data;
  }

  async createProduct(data: CreateProductRequest): Promise<Product> {
    const response = await http.post<Product>(this.baseUrl, data);
    return response.data;
  }

  async updateProduct(id: number, data: UpdateProductRequest): Promise<Product> {
    const response = await http.put<Product>(`${this.baseUrl}/${id}`, data);
    return response.data;
  }

  async deleteProduct(id: number): Promise<void> {
    await http.delete(`${this.baseUrl}/${id}`);
  }
}

export const productService = new ProductService();
```

#### 4. 创建 API 路由

```tsx
// app/api/products/route.ts
import { NextRequest, NextResponse } from 'next/server';

// Mock 数据
const mockProducts = [
  {
    id: 1,
    name: 'iPhone 15',
    price: 5999,
    category: '手机',
    status: 'active',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  // 更多 mock 数据...
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '10');

  // 模拟分页
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const data = mockProducts.slice(start, end);

  return NextResponse.json({
    success: true,
    data: {
      list: data,
      total: mockProducts.length,
      page,
      pageSize,
      totalPages: Math.ceil(mockProducts.length / pageSize),
    },
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const newProduct = {
    id: mockProducts.length + 1,
    ...body,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  mockProducts.push(newProduct);

  return NextResponse.json({
    success: true,
    data: newProduct,
  });
}
```

#### 5. 添加到侧边栏菜单

```tsx
// components/layouts/Sidebar.tsx
const menuItems: MenuItem[] = useMemo(() => [
  // ... 其他菜单项
  {
    key: '/products/list',
    icon: <ShoppingOutlined />,
    label: '商品管理',
  },
], []);
```

#### 6. 在页面中使用服务

```tsx
// app/products/list/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { Table, Button, Space } from 'antd';
import { MainLayout } from '@/components/layouts/MainLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { productService } from '@/lib/services/product.service';
import type { Product } from '@/lib/types/product';

export default function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const response = await productService.getProducts();
      setProducts(response.list);
    } catch (error) {
      console.error('加载商品失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { title: '商品名称', dataIndex: 'name', key: 'name' },
    { title: '价格', dataIndex: 'price', key: 'price' },
    { title: '分类', dataIndex: 'category', key: 'category' },
    { title: '状态', dataIndex: 'status', key: 'status' },
    {
      title: '操作',
      key: 'action',
      render: (_, record: Product) => (
        <Space>
          <Button type="link">编辑</Button>
          <Button type="link" danger>删除</Button>
        </Space>
      ),
    },
  ];

  return (
    <MainLayout>
      <PageHeader
        title="商品列表"
        subtitle="管理系统中的所有商品"
        breadcrumbs={[
          { title: '商品管理' },
          { title: '商品列表' },
        ]}
        extra={<Button type="primary">添加商品</Button>}
      />
      <Table
        columns={columns}
        dataSource={products}
        loading={loading}
        rowKey="id"
      />
    </MainLayout>
  );
}
```

## 🛠️ 开发规范

### 文件命名规范
- 页面文件：`page.tsx`
- 组件文件：`PascalCase.tsx`
- 服务文件：`kebab-case.service.ts`
- 类型文件：`kebab-case.ts`

### 目录结构规范
- 每个模块在 `app/` 下创建独立目录
- API 路由放在 `app/api/` 下
- 类型定义放在 `lib/types/` 下
- 服务层放在 `lib/services/` 下

### 代码规范
- 使用 TypeScript 严格模式
- 组件必须定义 Props 类型
- API 响应必须定义类型
- 使用 ESLint 和 Prettier 格式化代码

## 📦 技术栈

- **框架**: Next.js 15 (App Router)
- **语言**: TypeScript
- **UI 库**: Ant Design 5
- **样式**: Tailwind CSS 4
- **图标**: Ant Design Icons
- **包管理**: pnpm

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License
