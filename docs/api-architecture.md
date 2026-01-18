# 🏗️ API 架构设计指南

## 📋 概述

本文档详细说明了项目中 API 的架构设计，包括目录结构、命名规范、最佳实践等。

## 🎯 设计原则

### 1. **分层架构**
- **`app/api/`** - Next.js 后端 API 路由（服务端）
- **`lib/services/`** - 前端服务层（客户端调用 API）
- **`lib/types/`** - 类型定义（前后端共享）
- **`lib/config/`** - 配置文件

### 2. **职责分离**
- **API 路由**：处理 HTTP 请求，数据验证，业务逻辑
- **服务层**：封装 API 调用，错误处理，数据转换
- **类型定义**：确保类型安全，前后端一致性

### 3. **模块化设计**
- 按业务模块组织代码
- 每个模块独立，便于维护
- 统一的接口规范

## 📁 目录结构

```
project/
├── app/api/                    # Next.js API Routes (后端)
│   ├── auth/                   # 认证模块
│   │   ├── login/route.ts
│   │   ├── logout/route.ts
│   │   └── profile/route.ts
│   ├── users/                  # 用户模块
│   │   ├── route.ts           # GET /api/users, POST /api/users
│   │   ├── [id]/route.ts      # GET/PUT/DELETE /api/users/[id]
│   │   ├── stats/route.ts     # GET /api/users/stats
│   │   └── batch/route.ts     # DELETE /api/users/batch
│   ├── roles/                  # 角色模块
│   │   ├── route.ts
│   │   ├── [id]/route.ts
│   │   └── [id]/permissions/route.ts
│   └── dashboard/              # 仪表盘模块
│       ├── stats/route.ts
│       └── charts/route.ts
├── lib/
│   ├── services/               # 前端服务层
│   │   ├── http.ts            # HTTP 客户端基础封装
│   │   ├── index.ts           # 服务层统一导出
│   │   ├── user.service.ts    # 用户服务
│   │   ├── role.service.ts    # 角色服务
│   │   └── auth.service.ts    # 认证服务
│   ├── types/                  # TypeScript 类型定义
│   │   ├── api.ts             # API 通用类型
│   │   ├── user.ts            # 用户相关类型
│   │   ├── role.ts            # 角色相关类型
│   │   └── auth.ts            # 认证相关类型
│   └── config/                 # 配置文件
│       └── api.config.ts      # API 配置和常量
```

## 🔧 实现示例

### 1. **类型定义** (`lib/types/`)

```typescript
// lib/types/api.ts - 通用 API 类型
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  code?: number;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// lib/types/user.ts - 用户相关类型
export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  status: 'active' | 'inactive';
  roleId: number;
  roleName: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  phone?: string;
  roleId: number;
  status?: 'active' | 'inactive';
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  phone?: string;
  roleId?: number;
  status?: 'active' | 'inactive';
  avatar?: string;
}

export interface GetUsersParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  status?: 'active' | 'inactive';
  roleId?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
```

### 2. **服务层** (`lib/services/`)

```typescript
// lib/services/user.service.ts
export class UserService {
  private readonly baseUrl = '/api/users';

  async getUsers(params?: GetUsersParams): Promise<PaginatedResponse<User>> {
    return await httpClient.get<PaginatedResponse<User>>(this.baseUrl, { params });
  }

  async createUser(data: CreateUserRequest): Promise<User> {
    const response = await httpClient.post<ApiResponse<User>>(this.baseUrl, data);
    return response.data;
  }

  async updateUser(id: number, data: UpdateUserRequest): Promise<User> {
    const response = await httpClient.put<ApiResponse<User>>(`${this.baseUrl}/${id}`, data);
    return response.data;
  }

  async deleteUser(id: number): Promise<void> {
    await httpClient.delete(`${this.baseUrl}/${id}`);
  }
}

export const userService = new UserService();
```

### 3. **API 路由** (`app/api/`)

```typescript
// app/api/users/route.ts - 用户列表和创建
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// 创建用户验证 schema
const createUserSchema = z.object({
  name: z.string().min(1, '姓名不能为空').max(50, '姓名不能超过50个字符'),
  email: z.string().email('邮箱格式不正确'),
  password: z.string().min(6, '密码至少6位').max(20, '密码不能超过20位'),
  phone: z.string().optional(),
  roleId: z.number().int().positive('角色ID必须是正整数'),
  status: z.enum(['active', 'inactive']).optional().default('active'),
});

// 查询参数验证 schema
const getUsersParamsSchema = z.object({
  page: z.string().transform(Number).pipe(z.number().int().positive()).optional().default(1),
  pageSize: z.string().transform(Number).pipe(z.number().int().positive().max(100)).optional().default(10),
  keyword: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional(),
  roleId: z.string().transform(Number).pipe(z.number().int().positive()).optional(),
  sortBy: z.string().optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());
    const validatedParams = getUsersParamsSchema.parse(params);

    // 实现搜索、过滤、排序、分页逻辑
    let filteredUsers = [...mockUsers];

    if (validatedParams.keyword) {
      const keyword = validatedParams.keyword.toLowerCase();
      filteredUsers = filteredUsers.filter(user =>
        user.name.toLowerCase().includes(keyword) ||
        user.email.toLowerCase().includes(keyword)
      );
    }

    // 分页处理
    const total = filteredUsers.length;
    const totalPages = Math.ceil(total / validatedParams.pageSize);
    const startIndex = (validatedParams.page - 1) * validatedParams.pageSize;
    const paginatedUsers = filteredUsers.slice(startIndex, startIndex + validatedParams.pageSize);

    const response: PaginatedResponse = {
      data: paginatedUsers,
      total,
      page: validatedParams.page,
      pageSize: validatedParams.pageSize,
      totalPages,
    };

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: '参数验证失败',
        errors: error.errors,
      }, { status: 400 });
    }
    return NextResponse.json({
      success: false,
      message: '获取用户列表失败',
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createUserSchema.parse(body);

    // 检查邮箱是否已存在
    const existingUser = mockUsers.find(user => user.email === validatedData.email);
    if (existingUser) {
      return NextResponse.json({
        success: false,
        message: '邮箱已存在',
      }, { status: 409 });
    }

    // 创建新用户
    const newUser = {
      id: mockUsers.length + 1,
      ...validatedData,
      roleName: validatedData.roleId === 1 ? 'Admin' : 'User',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockUsers.push(newUser);

    return NextResponse.json({
      success: true,
      data: newUser,
      message: '用户创建成功',
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: '数据验证失败',
        errors: error.errors,
      }, { status: 400 });
    }
    return NextResponse.json({
      success: false,
      message: '创建用户失败',
    }, { status: 500 });
  }
}
```

## 📝 命名规范

### 1. **文件命名**
- API 路由：`route.ts`
- 服务文件：`*.service.ts`
- 类型文件：`*.ts`（按模块命名）
- 配置文件：`*.config.ts`

### 2. **接口命名**
- 实体类型：`User`, `Role`, `Permission`
- 请求类型：`CreateUserRequest`, `UpdateUserRequest`
- 响应类型：`ApiResponse<T>`, `PaginatedResponse<T>`
- 参数类型：`GetUsersParams`, `PaginationParams`

### 3. **服务类命名**
- 服务类：`UserService`, `RoleService`
- 服务实例：`userService`, `roleService`
- 方法命名：`getUsers`, `createUser`, `updateUser`, `deleteUser`

## 🎯 最佳实践

### 1. **错误处理**
```typescript
// 统一的错误处理
export function handleApiError(error: unknown): NextResponse {
  if (error instanceof z.ZodError) {
    return NextResponse.json({
      success: false,
      message: '数据验证失败',
      errors: error.errors,
    }, { status: 400 });
  }
  
  console.error('API Error:', error);
  return NextResponse.json({
    success: false,
    message: '服务器内部错误',
  }, { status: 500 });
}
```

### 2. **数据验证**
```typescript
// 使用 Zod 进行数据验证
const createUserSchema = z.object({
  name: z.string().min(1, '姓名不能为空'),
  email: z.string().email('邮箱格式不正确'),
  password: z.string().min(6, '密码至少6位'),
});
```

### 3. **类型安全**
```typescript
// 确保前后端类型一致
export async function createUser(data: CreateUserRequest): Promise<User> {
  // TypeScript 会确保类型安全
}
```

### 4. **模块化导出**
```typescript
// lib/services/index.ts
export { userService } from './user.service';
export { roleService } from './role.service';
export { authService } from './auth.service';

// 使用时
import { userService, roleService } from '@/lib/services';
```

## 🚀 扩展新模块

### 添加新模块的步骤：

1. **创建类型定义**
```typescript
// lib/types/product.ts
export interface Product {
  id: number;
  name: string;
  price: number;
  // ...
}
```

2. **创建服务层**
```typescript
// lib/services/product.service.ts
export class ProductService {
  // 实现 CRUD 方法
}
```

3. **创建 API 路由**
```typescript
// app/api/products/route.ts
// app/api/products/[id]/route.ts
```

4. **更新导出文件**
```typescript
// lib/services/index.ts
export { productService } from './product.service';
```

## ✅ 优势总结

1. **类型安全**：TypeScript 确保前后端类型一致
2. **模块化**：按业务模块组织，便于维护
3. **可扩展**：新增模块遵循统一规范
4. **错误处理**：统一的错误处理机制
5. **代码复用**：服务层可在多个组件中复用
6. **测试友好**：每个模块可独立测试

这种架构设计确保了代码的可维护性、可扩展性和类型安全性，是大型项目的最佳实践。
