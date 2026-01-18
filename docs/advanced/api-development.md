# 🔌 API 开发指南

> 本指南详细介绍如何在项目中开发和维护 API 接口，包括路由设计、数据验证、错误处理等最佳实践。

## 📋 目录

1. [API 架构概览](#api-架构概览)
2. [路由设计规范](#路由设计规范)
3. [数据验证](#数据验证)
4. [错误处理](#错误处理)
5. [实际案例](#实际案例)
6. [测试指南](#测试指南)

---

## 🏗️ API 架构概览

### 目录结构

```
app/api/                    # Next.js API Routes
├── users/                  # 用户模块
│   ├── route.ts           # GET /api/users, POST /api/users
│   ├── [id]/route.ts      # GET/PUT/DELETE /api/users/[id]
│   ├── stats/route.ts     # GET /api/users/stats
│   └── batch/route.ts     # DELETE /api/users/batch
├── auth/                   # 认证模块
│   ├── login/route.ts
│   ├── logout/route.ts
│   └── profile/route.ts
└── dashboard/              # 仪表盘模块
    ├── stats/route.ts
    └── charts/route.ts
```

### 设计原则

1. **RESTful 设计**：遵循 REST API 设计规范
2. **类型安全**：使用 TypeScript 和 Zod 确保类型安全
3. **统一响应**：所有 API 返回统一的响应格式
4. **错误处理**：完善的错误处理和用户友好的错误信息
5. **数据验证**：严格的输入数据验证

---

## 🛣️ 路由设计规范

### HTTP 方法映射

| 方法 | 路径 | 描述 | 示例 |
|------|------|------|------|
| GET | `/api/users` | 获取资源列表 | 获取用户列表 |
| POST | `/api/users` | 创建新资源 | 创建新用户 |
| GET | `/api/users/[id]` | 获取单个资源 | 获取用户详情 |
| PUT | `/api/users/[id]` | 更新资源 | 更新用户信息 |
| DELETE | `/api/users/[id]` | 删除资源 | 删除用户 |

### 响应格式标准

```typescript
// 成功响应
interface ApiResponse<T = any> {
  success: true;
  data: T;
  message?: string;
}

// 分页响应
interface PaginatedResponse<T = any> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// 错误响应
interface ErrorResponse {
  success: false;
  message: string;
  errors?: any[];
  code?: string;
}
```

---

## ✅ 数据验证

### 使用 Zod 进行验证

```typescript
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

// 查询参数验证
const getUsersParamsSchema = z.object({
  page: z.string().transform(Number).pipe(z.number().int().positive()).optional().default(1),
  pageSize: z.string().transform(Number).pipe(z.number().int().positive().max(100)).optional().default(10),
  keyword: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional(),
  sortBy: z.string().optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});
```

### 验证最佳实践

1. **输入验证**：所有用户输入都必须验证
2. **类型转换**：使用 `transform` 进行安全的类型转换
3. **默认值**：为可选参数提供合理的默认值
4. **错误信息**：提供清晰的中文错误信息
5. **边界检查**：设置合理的最大值和最小值限制

---

## ⚠️ 错误处理

### 统一错误处理函数

```typescript
import { NextResponse } from 'next/server';
import { z } from 'zod';

export function handleApiError(error: unknown): NextResponse {
  console.error('API Error:', error);
  
  // Zod 验证错误
  if (error instanceof z.ZodError) {
    return NextResponse.json({
      success: false,
      message: '数据验证失败',
      errors: error.errors,
    }, { status: 400 });
  }
  
  // 自定义业务错误
  if (error instanceof ApiError) {
    return NextResponse.json({
      success: false,
      message: error.message,
      code: error.code,
    }, { status: error.statusCode });
  }
  
  // 未知错误
  return NextResponse.json({
    success: false,
    message: '服务器内部错误',
  }, { status: 500 });
}

// 自定义错误类
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
```

### 常见错误状态码

| 状态码 | 含义 | 使用场景 |
|--------|------|----------|
| 400 | Bad Request | 请求参数错误、数据验证失败 |
| 401 | Unauthorized | 未认证、token 无效 |
| 403 | Forbidden | 权限不足 |
| 404 | Not Found | 资源不存在 |
| 409 | Conflict | 资源冲突（如邮箱已存在） |
| 500 | Internal Server Error | 服务器内部错误 |

---

## 💡 实际案例

### 用户管理 API 完整实现

```typescript
// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { handleApiError, ApiError } from '@/lib/utils/error-handler';

// 模拟数据库
const mockUsers = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    status: 'active' as const,
    roleId: 1,
    roleName: 'Admin',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

// 验证 schemas
const createUserSchema = z.object({
  name: z.string().min(1).max(50),
  email: z.string().email(),
  password: z.string().min(6).max(20),
  roleId: z.number().int().positive(),
  status: z.enum(['active', 'inactive']).default('active'),
});

const getUsersParamsSchema = z.object({
  page: z.string().transform(Number).pipe(z.number().int().positive()).default(1),
  pageSize: z.string().transform(Number).pipe(z.number().int().positive().max(100)).default(10),
  keyword: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

// GET /api/users - 获取用户列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());
    const validatedParams = getUsersParamsSchema.parse(params);
    
    // 实现搜索和过滤逻辑
    let filteredUsers = [...mockUsers];
    
    if (validatedParams.keyword) {
      const keyword = validatedParams.keyword.toLowerCase();
      filteredUsers = filteredUsers.filter(user => 
        user.name.toLowerCase().includes(keyword) ||
        user.email.toLowerCase().includes(keyword)
      );
    }
    
    if (validatedParams.status) {
      filteredUsers = filteredUsers.filter(user => user.status === validatedParams.status);
    }
    
    // 分页处理
    const total = filteredUsers.length;
    const totalPages = Math.ceil(total / validatedParams.pageSize);
    const startIndex = (validatedParams.page - 1) * validatedParams.pageSize;
    const paginatedUsers = filteredUsers.slice(startIndex, startIndex + validatedParams.pageSize);
    
    return NextResponse.json({
      data: paginatedUsers,
      total,
      page: validatedParams.page,
      pageSize: validatedParams.pageSize,
      totalPages,
    });
    
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/users - 创建用户
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createUserSchema.parse(body);
    
    // 业务逻辑验证
    const existingUser = mockUsers.find(user => user.email === validatedData.email);
    if (existingUser) {
      throw new ApiError('邮箱已存在', 409, 'EMAIL_EXISTS');
    }
    
    // 创建用户
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
    return handleApiError(error);
  }
}
```

### 动态路由实现

```typescript
// app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// 路由参数验证
const paramsSchema = z.object({
  id: z.string().transform(Number).pipe(z.number().int().positive()),
});

// 更新用户验证
const updateUserSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  roleId: z.number().int().positive().optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

// GET /api/users/[id] - 获取用户详情
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = paramsSchema.parse(params);

    const user = mockUsers.find(u => u.id === id);
    if (!user) {
      throw new ApiError('用户不存在', 404, 'USER_NOT_FOUND');
    }

    // 返回用户详情（可包含更多信息）
    const userDetail = {
      ...user,
      permissions: user.roleId === 1 ? ['user:read', 'user:write', 'user:delete'] : ['user:read'],
      profile: {
        firstName: user.name.split(' ')[0],
        lastName: user.name.split(' ')[1] || '',
        bio: '这是用户的个人简介',
      },
    };

    return NextResponse.json({
      success: true,
      data: userDetail,
    });

  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/users/[id] - 更新用户
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = paramsSchema.parse(params);
    const body = await request.json();
    const validatedData = updateUserSchema.parse(body);

    const userIndex = mockUsers.findIndex(u => u.id === id);
    if (userIndex === -1) {
      throw new ApiError('用户不存在', 404, 'USER_NOT_FOUND');
    }

    // 检查邮箱冲突
    if (validatedData.email) {
      const existingUser = mockUsers.find(u => u.email === validatedData.email && u.id !== id);
      if (existingUser) {
        throw new ApiError('邮箱已被其他用户使用', 409, 'EMAIL_EXISTS');
      }
    }

    // 更新用户
    const updatedUser = {
      ...mockUsers[userIndex],
      ...validatedData,
      updatedAt: new Date().toISOString(),
    };

    mockUsers[userIndex] = updatedUser;

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: '用户更新成功',
    });

  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/users/[id] - 删除用户
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = paramsSchema.parse(params);

    const userIndex = mockUsers.findIndex(u => u.id === id);
    if (userIndex === -1) {
      throw new ApiError('用户不存在', 404, 'USER_NOT_FOUND');
    }

    // 业务规则检查
    if (mockUsers[userIndex].roleId === 1) {
      throw new ApiError('不能删除管理员用户', 403, 'CANNOT_DELETE_ADMIN');
    }

    mockUsers.splice(userIndex, 1);

    return NextResponse.json({
      success: true,
      data: null,
      message: '用户删除成功',
    });

  } catch (error) {
    return handleApiError(error);
  }
}
```

---

## 🧪 测试指南

### API 测试策略

1. **单元测试**：测试单个 API 端点
2. **集成测试**：测试 API 与数据库的交互
3. **端到端测试**：测试完整的用户流程

### 使用 Jest 进行 API 测试

```typescript
// __tests__/api/users.test.ts
import { createMocks } from 'node-mocks-http';
import { GET, POST } from '@/app/api/users/route';

describe('/api/users', () => {
  describe('GET', () => {
    it('应该返回用户列表', async () => {
      const { req } = createMocks({
        method: 'GET',
        url: '/api/users?page=1&pageSize=10',
      });

      const response = await GET(req as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('data');
      expect(data).toHaveProperty('total');
      expect(Array.isArray(data.data)).toBe(true);
    });

    it('应该支持关键词搜索', async () => {
      const { req } = createMocks({
        method: 'GET',
        url: '/api/users?keyword=john',
      });

      const response = await GET(req as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.every((user: any) =>
        user.name.toLowerCase().includes('john') ||
        user.email.toLowerCase().includes('john')
      )).toBe(true);
    });
  });

  describe('POST', () => {
    it('应该创建新用户', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        roleId: 2,
      };

      const { req } = createMocks({
        method: 'POST',
        body: userData,
      });

      const response = await POST(req as any);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data).toMatchObject({
        name: userData.name,
        email: userData.email,
        roleId: userData.roleId,
      });
    });

    it('应该拒绝重复邮箱', async () => {
      const userData = {
        name: 'Test User',
        email: 'john@example.com', // 已存在的邮箱
        password: 'password123',
        roleId: 2,
      };

      const { req } = createMocks({
        method: 'POST',
        body: userData,
      });

      const response = await POST(req as any);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.success).toBe(false);
      expect(data.message).toContain('邮箱已存在');
    });
  });
});
```

### 使用 Postman/Thunder Client 测试

创建测试集合文件：

```json
{
  "info": {
    "name": "User API Tests",
    "description": "用户管理 API 测试集合"
  },
  "item": [
    {
      "name": "获取用户列表",
      "request": {
        "method": "GET",
        "url": "{{baseUrl}}/api/users?page=1&pageSize=10"
      },
      "tests": [
        "pm.test('Status code is 200', function () {",
        "    pm.response.to.have.status(200);",
        "});",
        "pm.test('Response has data property', function () {",
        "    pm.expect(pm.response.json()).to.have.property('data');",
        "});"
      ]
    },
    {
      "name": "创建用户",
      "request": {
        "method": "POST",
        "url": "{{baseUrl}}/api/users",
        "body": {
          "mode": "raw",
          "raw": "{\n  \"name\": \"Test User\",\n  \"email\": \"test@example.com\",\n  \"password\": \"password123\",\n  \"roleId\": 2\n}"
        }
      }
    }
  ]
}
```

---

## 📚 开发最佳实践

### 1. 代码组织

- **分离关注点**：将验证、业务逻辑、数据访问分离
- **复用代码**：提取公共的验证 schema 和工具函数
- **类型安全**：充分利用 TypeScript 的类型系统

### 2. 性能优化

- **分页查询**：大数据集必须分页
- **索引优化**：数据库查询添加适当索引
- **缓存策略**：对频繁查询的数据进行缓存

### 3. 安全考虑

- **输入验证**：严格验证所有用户输入
- **权限检查**：每个操作都要检查用户权限
- **SQL 注入防护**：使用参数化查询
- **XSS 防护**：对输出进行适当转义

### 4. 监控和日志

```typescript
// 添加请求日志
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // API 逻辑...

    const duration = Date.now() - startTime;
    console.log(`GET /api/users - ${duration}ms`);

    return response;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`GET /api/users - Error after ${duration}ms:`, error);
    throw error;
  }
}
```

---

## 🔄 版本控制

### API 版本策略

1. **URL 版本控制**：`/api/v1/users`, `/api/v2/users`
2. **Header 版本控制**：`Accept: application/vnd.api+json;version=1`
3. **向后兼容**：新版本保持对旧版本的兼容性

### 变更管理

- **文档更新**：API 变更时及时更新文档
- **变更日志**：记录每个版本的变更内容
- **废弃通知**：提前通知客户端废弃的 API

---

这个 API 开发指南涵盖了从基础设计到高级实践的完整内容，为项目的 API 开发提供了标准化的指导。
