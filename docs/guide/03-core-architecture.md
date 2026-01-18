# 🏗️ 第三部分：核心架构

## 📋 概述

本章将循序渐进地构建项目的核心架构。我们将从最基础的 HTTP 客户端开始，逐步添加类型定义、错误处理、自定义 Hooks 等功能。每一步都会详细说明为什么这样设计以及如何实现。

## 🎯 学习目标

完成本章后，你将掌握：
- 如何设计企业级的 HTTP 客户端
- 如何创建可复用的自定义 Hooks
- 如何组织项目的工具函数和常量
- 如何实现类型安全的 API 调用

## 🌐 HTTP 服务层

### 3.1 理解 HTTP 客户端的需求

在开始编码之前，我们先分析一下企业级应用对 HTTP 客户端的需求：

1. **类型安全**：请求和响应都应该有明确的类型定义
2. **错误处理**：统一的错误处理机制
3. **超时控制**：防止请求无限等待
4. **请求拦截**：可以在请求前后添加通用逻辑
5. **基础 URL 配置**：避免重复写完整的 API 地址

### 3.2 第一步：定义基础类型

首先，我们需要定义一些基础的类型。创建 `lib/services/http.ts` 文件：

```typescript
/**
 * HTTP 请求配置接口
 * 定义了所有请求需要的参数
 */
export interface RequestConfig {
  url: string;                                    // 请求 URL（必需）
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';  // HTTP 方法
  params?: Record<string, any>;                   // URL 查询参数
  data?: any;                                     // 请求体数据
  headers?: Record<string, string>;               // 请求头
  timeout?: number;                               // 超时时间（毫秒）
}

/**
 * 统一的 API 响应格式
 * 这是后端约定的响应结构
 */
export interface ApiResponse<T = any> {
  data: T;              // 实际数据
  message?: string;     // 响应消息
  success: boolean;     // 是否成功
  total?: number;       // 总数（分页时使用）
  page?: number;        // 当前页码
  limit?: number;       // 每页条数
}

/**
 * API 错误接口
 */
export interface ApiError {
  code: string;         // 错误代码
  message: string;      // 错误消息
  details?: any;        // 错误详情
}
```

**为什么这样设计？**
- `RequestConfig` 扩展了原生的 `RequestInit`，保持兼容性的同时添加了我们需要的配置
- `ApiResponse` 定义了统一的响应格式，使用泛型 `T` 来表示不同接口的数据类型

### 3.3 第二步：创建基础的 HTTP 客户端类

接下来，我们创建一个基础的 HTTP 客户端类：

```typescript
// 拦截器类型定义
type RequestInterceptor = (config: RequestConfig) => RequestConfig | Promise<RequestConfig>;
type ResponseInterceptor = (response: any) => any;
type ErrorInterceptor = (error: any) => any;

/**
 * HTTP 客户端类
 * 支持拦截器、自动重试、错误处理等企业级功能
 */
class HttpClient {
  private baseURL: string;
  private timeout: number;
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];
  private errorInterceptors: ErrorInterceptor[] = [];

  constructor(baseURL = API_BASE_URL, timeout = 10000) {
    this.baseURL = baseURL;
    this.timeout = timeout;
    this.setupDefaultInterceptors();  // 设置默认拦截器
  }
```

**设计亮点：**
- **拦截器系统** - 支持请求、响应、错误拦截器
- **类型安全** - 完整的 TypeScript 类型定义
- **企业级功能** - 自动添加认证头、统一错误处理
- **可扩展性** - 支持添加自定义拦截器

### 3.4 第三步：实现拦截器系统

拦截器是企业级 HTTP 客户端的核心功能，让我们先实现拦截器相关方法：

```typescript
  // 设置默认拦截器
  private setupDefaultInterceptors() {
    // 请求拦截器 - 添加认证头
    this.addRequestInterceptor((config) => {
      const token = storageUtils.get(STORAGE_KEYS.TOKEN);
      if (token) {
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${token}`,
        };
      }
      return config;
    });

    // 响应拦截器 - 处理通用响应
    this.addResponseInterceptor((response) => {
      if (response instanceof Response) {
        return response.json().then(data => {
          if (!response.ok) {
            throw new Error(data.message || ERROR_MESSAGES.SERVER_ERROR);
          }
          return data;
        });
      }
      return response;
    });

    // 错误拦截器 - 处理通用错误
    this.addErrorInterceptor((error) => {
      if (error.status === 401) {
        // 清除认证信息并跳转到登录页
        storageUtils.remove(STORAGE_KEYS.TOKEN);
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
        message.error(ERROR_MESSAGES.UNAUTHORIZED);
      } else if (error.status === 403) {
        message.error(ERROR_MESSAGES.FORBIDDEN);
      } else {
        message.error(error.message || ERROR_MESSAGES.UNKNOWN_ERROR);
      }
      throw error;
    });
  }

  // 添加请求拦截器
  addRequestInterceptor(interceptor: RequestInterceptor) {
    this.requestInterceptors.push(interceptor);
  }

  // 添加响应拦截器
  addResponseInterceptor(interceptor: ResponseInterceptor) {
    this.responseInterceptors.push(interceptor);
  }

  // 添加错误拦截器
  addErrorInterceptor(interceptor: ErrorInterceptor) {
    this.errorInterceptors.push(interceptor);
  }

  // 应用请求拦截器
  private async applyRequestInterceptors(config: RequestConfig): Promise<RequestConfig> {
    let finalConfig = config;
    for (const interceptor of this.requestInterceptors) {
      finalConfig = await interceptor(finalConfig);
    }
    return finalConfig;
  }

  // 应用响应拦截器
  private async applyResponseInterceptors(response: any): Promise<any> {
    let finalResponse = response;
    for (const interceptor of this.responseInterceptors) {
      finalResponse = await interceptor(finalResponse);
    }
    return finalResponse;
  }

  // 应用错误拦截器
  private async applyErrorInterceptors(error: any): Promise<any> {
    for (const interceptor of this.errorInterceptors) {
      try {
        await interceptor(error);
      } catch (e) {
        // 拦截器可能会抛出新的错误
      }
    }
  }
```

### 3.5 第四步：实现核心请求方法

现在我们实现最核心的 `request` 方法：

```typescript
  // 通用请求方法
  private async request<T = any>(config: RequestConfig): Promise<ApiResponse<T>> {
    try {
      // 1. 应用请求拦截器（添加认证头等）
      const finalConfig = await this.applyRequestInterceptors(config);

      // 2. 构建请求选项
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...finalConfig.headers,
      };

      const fetchOptions: RequestInit = {
        method: finalConfig.method || 'GET',
        headers,
        signal: AbortSignal.timeout(finalConfig.timeout || this.timeout),
      };

      // 3. 添加请求体（POST、PUT、PATCH 请求）
      if (finalConfig.data && ['POST', 'PUT', 'PATCH'].includes(fetchOptions.method!)) {
        if (finalConfig.data instanceof FormData) {
          // FormData 不需要设置 Content-Type（浏览器自动设置）
          delete headers['Content-Type'];
          fetchOptions.body = finalConfig.data;
        } else {
          fetchOptions.body = JSON.stringify(finalConfig.data);
        }
      }

      // 4. 构建完整 URL（包含查询参数）
      const url = this.buildURL(finalConfig.url, finalConfig.params);

      // 5. 发送请求
      const response = await fetch(url, fetchOptions);

      // 6. 应用响应拦截器（处理认证、错误等）
      const data = await this.applyResponseInterceptors(response);

      return data;
    } catch (error: any) {
      // 7. 构建标准错误对象
      const apiError: ApiError = {
        code: error.code || 'UNKNOWN_ERROR',
        message: error.message || ERROR_MESSAGES.UNKNOWN_ERROR,
        details: error,
      };

      // 8. 应用错误拦截器（统一错误处理）
      await this.applyErrorInterceptors(apiError);

      throw apiError;
    }
  }
```

**关键实现点解析：**

1. **拦截器系统**：请求前后都会经过拦截器处理
2. **超时控制**：使用现代的 `AbortSignal.timeout` API
3. **URL 构建**：支持查询参数自动拼接
4. **FormData 处理**：自动处理文件上传的 Content-Type
5. **错误标准化**：统一的错误对象格式
6. **企业级特性**：认证、重试、日志等都通过拦截器实现

### 3.6 第六步：添加便捷方法

接下来添加常用的 HTTP 方法：

```typescript
  // GET 请求：获取数据
  async get<T = any>(url: string, params?: Record<string, any>, config?: Partial<RequestConfig>): Promise<ApiResponse<T>> {
    return this.request<T>({
      url,
      method: 'GET',
      params,
      ...config,
    });
  }

  // POST 请求：创建数据
  async post<T = any>(url: string, data?: any, config?: Partial<RequestConfig>): Promise<ApiResponse<T>> {
    return this.request<T>({
      url,
      method: 'POST',
      data,
      ...config,
    });
  }

  // PUT 请求：更新数据
  async put<T = any>(url: string, data?: any, config?: Partial<RequestConfig>): Promise<ApiResponse<T>> {
    return this.request<T>({
      url,
      method: 'PUT',
      data,
      ...config,
    });
  }

  // PATCH 请求：部分更新
  async patch<T = any>(url: string, data?: any, config?: Partial<RequestConfig>): Promise<ApiResponse<T>> {
    return this.request<T>({
      url,
      method: 'PATCH',
      data,
      ...config,
    });
  }

  // DELETE 请求：删除数据
  async delete<T = any>(url: string, config?: Partial<RequestConfig>): Promise<ApiResponse<T>> {
    return this.request<T>({
      url,
      method: 'DELETE',
      ...config,
    });
  }

  // 文件上传：支持进度回调
  async upload<T = any>(url: string, file: File, onProgress?: (progress: number) => void): Promise<ApiResponse<T>> {
    // 使用 XMLHttpRequest 实现文件上传进度监听
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', file);

      const xhr = new XMLHttpRequest();

      // 监听上传进度
      if (onProgress) {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            onProgress(progress);
          }
        });
      }

      // 处理上传完成
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (error) {
            reject(new Error('Invalid JSON response'));
          }
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      // 处理上传错误
      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'));
      });

      // 添加认证头
      const token = storageUtils.get(STORAGE_KEYS.TOKEN);
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      // 发送请求
      xhr.open('POST', this.buildURL(url));
      xhr.send(formData);
    });
  }

  // 文件下载
  async download(url: string, filename?: string): Promise<void> {
    try {
      const response = await fetch(this.buildURL(url), {
        headers: {
          Authorization: `Bearer ${storageUtils.get(STORAGE_KEYS.TOKEN)}`,
        },
      });

      if (!response.ok) {
        throw new Error('Download failed');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      message.error('文件下载失败');
      throw error;
    }
  }
}

// 创建默认实例
export const http = new HttpClient();

// 导出类型和实例
export { HttpClient };
export type { RequestConfig, ApiResponse, ApiError };
```

**设计亮点：**
- **完整的拦截器系统** - 支持请求、响应、错误拦截器
- **企业级功能** - 自动认证、统一错误处理、文件上传下载
- **类型安全** - 完整的 TypeScript 类型定义和泛型支持
- **现代 API** - 使用 `AbortSignal.timeout` 等现代浏览器 API
- **灵活配置** - 支持查询参数、请求头、超时等完整配置
- **开箱即用** - 创建默认实例，无需额外配置

### 3.7 测试 HTTP 客户端

让我们创建一个简单的测试来验证 HTTP 客户端：

```typescript
// 在浏览器控制台或测试文件中
import { http } from '@/lib/services/http';

// 测试 GET 请求
const testGet = async () => {
  try {
    const response = await http.get<{ message: string }>('/test');
    console.log('GET 请求成功:', response);
  } catch (error) {
    console.error('GET 请求失败:', error);
  }
};

// 测试 POST 请求
const testPost = async () => {
  try {
    const response = await http.post<{ id: number }>('/users', {
      name: '张三',
      email: 'zhangsan@example.com'
    });
    console.log('POST 请求成功:', response);
  } catch (error) {
    console.error('POST 请求失败:', error);
  }
};
```

## 🔗 API 服务层

### 3.7 理解 API 服务层的作用

HTTP 客户端解决了网络请求的问题，但我们还需要一个 API 服务层来：
1. **组织 API 接口**：按业务模块分组管理
2. **类型安全**：为每个接口定义明确的输入输出类型
3. **复用性**：避免在组件中重复写相同的请求逻辑

### 3.8 第一步：定义数据类型

在创建 API 服务之前，我们需要先定义数据类型。更新 `lib/types.ts` 文件：

```typescript
// 用户类型定义
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'user' | 'guest';
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

// 分页参数类型
export interface PaginationParams {
  current: number;    // 当前页码
  pageSize: number;   // 每页条数
}

// 分页响应类型
export interface PaginatedResponse<T> {
  list: T[];          // 数据列表
  total: number;      // 总条数
  current: number;    // 当前页码
  pageSize: number;   // 每页条数
}
```

### 3.9 第二步：创建用户 API 服务

创建 `lib/services/api.ts` 文件，我们先实现用户相关的 API：

```typescript
import { http } from './http';
import type { User, PaginationParams, PaginatedResponse } from '@/lib/types';

/**
 * 用户相关 API 服务
 */
export const userApi = {
  // 获取用户列表（支持分页和搜索）
  getUsers: (params?: PaginationParams & { search?: string }) => {
    // 构建查询参数
    const queryParams = new URLSearchParams();
    if (params?.current) queryParams.set('current', params.current.toString());
    if (params?.pageSize) queryParams.set('pageSize', params.pageSize.toString());
    if (params?.search) queryParams.set('search', params.search);

    const queryString = queryParams.toString();
    const url = queryString ? `/users?${queryString}` : '/users';

    return http.get<PaginatedResponse<User>>(url);
  },

  // 获取单个用户详情
  getUser: (id: string) =>
    http.get<User>(`/users/${id}`),

  // 创建新用户
  createUser: (data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) =>
    http.post<User>('/users', data),

  // 更新用户信息
  updateUser: (id: string, data: Partial<User>) =>
    http.put<User>(`/users/${id}`, data),

  // 删除用户
  deleteUser: (id: string) =>
    http.delete<void>(`/users/${id}`),
};
```

**设计说明：**
- 使用 `Omit` 类型排除创建时不需要的字段
- 使用 `Partial` 类型表示更新时的可选字段
- 查询参数使用 `URLSearchParams` 构建，更加规范

### 3.10 第三步：添加认证 API 服务

继续在 `api.ts` 文件中添加认证相关的 API：

```typescript
/**
 * 认证相关 API 服务
 */
export const authApi = {
  // 用户登录
  login: (credentials: { email: string; password: string }) =>
    http.post<{ token: string; user: User }>('/auth/login', credentials),

  // 用户登出
  logout: () =>
    http.post<void>('/auth/logout'),

  // 获取当前登录用户信息
  getCurrentUser: () =>
    http.get<User>('/auth/me'),

  // 刷新访问令牌
  refreshToken: () =>
    http.post<{ token: string }>('/auth/refresh'),
};
```

## 🎣 自定义 Hooks

### 3.11 理解自定义 Hooks 的价值

自定义 Hooks 是 React 中复用状态逻辑的最佳方式。在我们的架构中，Hooks 将帮助我们：
1. **封装复杂逻辑**：将组件中的状态逻辑提取出来
2. **提高复用性**：多个组件可以共享相同的逻辑
3. **简化组件**：让组件专注于 UI 渲染

### 3.12 第一步：创建 API 请求 Hooks

创建 `lib/hooks/useApi.ts` 文件：

```typescript
import { useState, useEffect, useCallback } from 'react';
import type { ApiResponse } from '@/lib/services/http';

// API 请求状态接口
interface UseApiState<T> {
  data: T | null;      // 响应数据
  loading: boolean;    // 加载状态
  error: string | null; // 错误信息
}

// Hook 配置选项
interface UseApiOptions {
  immediate?: boolean;                    // 是否立即执行
  onSuccess?: (data: any) => void;       // 成功回调
  onError?: (error: string) => void;     // 错误回调
}

/**
 * 通用 API 请求 Hook
 * 封装了加载状态、错误处理等通用逻辑
 */
export function useApi<T>(
  apiFunction: () => Promise<ApiResponse<T>>,
  options: UseApiOptions = {}
) {
  const { immediate = true, onSuccess, onError } = options;

  // 状态管理
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  // 执行 API 请求
  const execute = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await apiFunction();

      if (response.success) {
        setState({
          data: response.data,
          loading: false,
          error: null,
        });
        onSuccess?.(response.data);
      } else {
        const errorMsg = response.message || '请求失败';
        setState({
          data: null,
          loading: false,
          error: errorMsg,
        });
        onError?.(errorMsg);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '网络错误';
      setState({
        data: null,
        loading: false,
        error: errorMsg,
      });
      onError?.(errorMsg);
    }
  }, [apiFunction, onSuccess, onError]);

  // 自动执行
  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return {
    ...state,
    execute,
    refresh: execute,  // 刷新数据的别名
  };
}
```

**设计亮点：**
- 统一的状态管理（loading、error、data）
- 支持成功和失败回调
- 可选的自动执行
- 提供刷新功能

### 3.13 第二步：创建分页数据 Hook

继续在 `useApi.ts` 文件中添加分页 Hook：

```typescript
/**
 * 分页数据 Hook
 * 专门处理带分页的列表数据
 */
export function usePaginatedApi<T>(
  apiFunction: (params: any) => Promise<ApiResponse<{ list: T[]; total: number }>>,
  initialParams = { current: 1, pageSize: 10 }
) {
  const [params, setParams] = useState(initialParams);

  // 使用基础 API Hook
  const { data, loading, error, execute } = useApi(
    () => apiFunction(params),
    { immediate: true }
  );

  // 改变页码
  const changePage = useCallback((current: number, pageSize?: number) => {
    setParams(prev => ({
      ...prev,
      current,
      pageSize: pageSize || prev.pageSize,
    }));
  }, []);

  // 改变查询参数（会重置到第一页）
  const changeParams = useCallback((newParams: Partial<typeof params>) => {
    setParams(prev => ({ ...prev, ...newParams, current: 1 }));
  }, []);

  return {
    data: data?.list || [],      // 数据列表
    total: data?.total || 0,     // 总条数
    loading,
    error,
    params,
    changePage,                  // 翻页
    changeParams,                // 改变查询条件
    refresh: execute,            // 刷新
  };
}
```

### 3.14 第三步：测试 API Hooks

让我们创建一个简单的测试来验证 Hooks 的功能：

```typescript
// 创建测试页面 app/api-test/page.tsx
'use client';

import { Button, Card, Space, Spin, Alert } from 'antd';
import { useApi, usePaginatedApi } from '@/lib/hooks/useApi';
import { userApi } from '@/lib/services/api';

export default function ApiTestPage() {
  // 测试基础 API Hook
  const { data: user, loading: userLoading, error: userError, execute: fetchUser } = useApi(
    () => userApi.getUser('1'),
    { immediate: false }  // 不自动执行
  );

  // 测试分页 API Hook
  const {
    data: users,
    total,
    loading: usersLoading,
    error: usersError,
    changePage,
    changeParams,
    refresh
  } = usePaginatedApi(userApi.getUsers);

  return (
    <div className="p-6 space-y-6">
      <Card title="API Hooks 测试">
        <Space direction="vertical" className="w-full">
          {/* 单个用户测试 */}
          <div>
            <h3>单个用户数据</h3>
            <Space>
              <Button onClick={fetchUser} loading={userLoading}>
                获取用户
              </Button>
              {userError && <Alert message={userError} type="error" />}
              {user && <span>用户名: {user.name}</span>}
            </Space>
          </div>

          {/* 用户列表测试 */}
          <div>
            <h3>用户列表数据</h3>
            <Space>
              <Button onClick={refresh} loading={usersLoading}>
                刷新列表
              </Button>
              <Button onClick={() => changePage(2)}>
                第二页
              </Button>
              <Button onClick={() => changeParams({ search: '张三' })}>
                搜索张三
              </Button>
            </Space>

            {usersLoading && <Spin />}
            {usersError && <Alert message={usersError} type="error" />}
            {users.length > 0 && (
              <div>
                <p>总数: {total}</p>
                <ul>
                  {users.map(user => (
                    <li key={user.id}>{user.name} - {user.email}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Space>
      </Card>
    </div>
  );
}
```

## 🛠️ 工具函数库

### 3.15 理解工具函数的重要性

工具函数是项目中的"瑞士军刀"，它们：
1. **提高开发效率**：避免重复编写相同的逻辑
2. **保证一致性**：统一的处理方式
3. **易于维护**：集中管理，便于修改和优化

### 3.16 第一步：基础工具函数

更新 `lib/utils.ts` 文件，添加常用的工具函数：

```typescript
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * 合并 CSS 类名
 * 结合 clsx 和 tailwind-merge 的优势
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 格式化日期
 * 支持多种输入格式，输出中文格式
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
 * 格式化相对时间
 * 例如：刚刚、5分钟前、2小时前
 */
export function formatRelativeTime(date: Date | string | number): string {
  const now = new Date();
  const target = new Date(date);
  const diff = now.getTime() - target.getTime();

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) return '刚刚';
  if (diff < hour) return `${Math.floor(diff / minute)}分钟前`;
  if (diff < day) return `${Math.floor(diff / hour)}小时前`;
  return `${Math.floor(diff / day)}天前`;
}

/**
 * 延迟函数
 * 用于模拟异步操作或添加延迟
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 生成随机 ID
 * 用于临时标识符
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15);
}
```

### 3.17 第二步：性能优化工具函数

继续添加防抖和节流函数：

```typescript
/**
 * 防抖函数
 * 在事件停止触发后延迟执行
 * 适用场景：搜索输入、窗口 resize
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * 节流函数
 * 限制函数执行频率
 * 适用场景：滚动事件、按钮点击
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}
```

### 3.18 第三步：数据处理工具函数

添加常用的数据处理函数：

```typescript
/**
 * 深拷贝
 * 创建对象的完全副本
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as T;
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as T;
  if (typeof obj === 'object') {
    const clonedObj = {} as T;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
  return obj;
}

/**
 * 格式化文件大小
 * 将字节数转换为可读格式
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 获取文件扩展名
 * 从文件名中提取扩展名
 */
export function getFileExtension(filename: string): string {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
}

/**
 * 数字格式化
 * 添加千分位分隔符
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('zh-CN');
}

/**
 * 手机号脱敏
 * 隐藏中间4位数字
 */
export function maskPhone(phone: string): string {
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
}

/**
 * 邮箱脱敏
 * 隐藏用户名部分字符
 */
export function maskEmail(email: string): string {
  const [username, domain] = email.split('@');
  if (username.length <= 2) return email;
  const masked = username.charAt(0) + '*'.repeat(username.length - 2) + username.charAt(username.length - 1);
  return `${masked}@${domain}`;
}
```

## 📋 常量管理

### 3.19 理解常量管理的重要性

良好的常量管理可以：
1. **避免魔法数字**：让代码更易读
2. **统一配置**：集中管理应用配置
3. **类型安全**：使用 TypeScript 的 const assertions
4. **易于维护**：修改配置只需要改一个地方

### 3.20 第一步：创建基础常量

创建 `lib/constants.ts` 文件：

```typescript
/**
 * 应用常量定义
 * 使用 as const 确保类型安全
 */

// API 相关配置
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || '/api',
  TIMEOUT: 10000,           // 请求超时时间（毫秒）
  RETRY_TIMES: 3,           // 重试次数
  RETRY_DELAY: 1000,        // 重试延迟（毫秒）
} as const;

// 分页配置
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,                    // 默认每页条数
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],    // 可选的每页条数
  SHOW_SIZE_CHANGER: true,                 // 显示页面大小选择器
  SHOW_QUICK_JUMPER: true,                 // 显示快速跳转
  SHOW_TOTAL: true,                        // 显示总数
} as const;

// 用户状态枚举
export const USER_STATUS = {
  ACTIVE: 'active',         // 激活
  INACTIVE: 'inactive',     // 未激活
  SUSPENDED: 'suspended',   // 暂停
  DELETED: 'deleted',       // 已删除
} as const;

// 用户角色枚举
export const USER_ROLES = {
  SUPER_ADMIN: 'super_admin',   // 超级管理员
  ADMIN: 'admin',               // 管理员
  USER: 'user',                 // 普通用户
  GUEST: 'guest',               // 访客
} as const;

// 本地存储键名
export const STORAGE_KEYS = {
  TOKEN: 'auth_token',              // 认证令牌
  REFRESH_TOKEN: 'refresh_token',   // 刷新令牌
  USER_INFO: 'user_info',           // 用户信息
  THEME: 'theme_mode',              // 主题模式
  SIDEBAR_COLLAPSED: 'sidebar_collapsed',  // 侧边栏折叠状态
  LANGUAGE: 'language',             // 语言设置
} as const;
```

### 3.21 第二步：路由和消息常量

继续添加路由和消息相关的常量：

```typescript
// 路由路径常量
export const ROUTES = {
  // 基础路由
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  NOT_FOUND: '/404',
  FORBIDDEN: '/403',

  // 业务路由
  DASHBOARD: '/dashboard',

  // 用户管理
  USERS: '/users',
  USER_LIST: '/users/list',
  USER_DETAIL: '/users/detail',
  USER_ROLES: '/users/roles',

  // 系统设置
  SETTINGS: '/settings',
  PROFILE: '/profile',
} as const;

// 消息类型
export const MESSAGE_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
} as const;

// 文件上传配置
export const UPLOAD_CONFIG = {
  MAX_SIZE: 10 * 1024 * 1024,  // 10MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif'],
  CHUNK_SIZE: 1024 * 1024,     // 1MB 分片大小
} as const;

// 表单验证规则
export const VALIDATION_RULES = {
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 20,
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 20,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_REGEX: /^1[3-9]\d{9}$/,
} as const;
```

### 3.22 第三步：创建类型定义

为了更好的类型安全，我们可以从常量中提取类型：

```typescript
// 从常量中提取类型
export type UserStatus = typeof USER_STATUS[keyof typeof USER_STATUS];
export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];
export type MessageType = typeof MESSAGE_TYPES[keyof typeof MESSAGE_TYPES];
export type RouteKey = keyof typeof ROUTES;

// 使用示例：
// const status: UserStatus = 'active';  // 类型安全
// const role: UserRole = 'admin';       // 类型安全
```

## ✅ 验证架构

### 3.23 第四步：创建综合测试页面

现在让我们创建一个综合测试页面来验证整个核心架构：

```typescript
// app/architecture-test/page.tsx
'use client';

import { Button, Card, Space, message, Divider, Tag } from 'antd';
import { useApi, usePaginatedApi } from '@/lib/hooks/useApi';
import { userApi } from '@/lib/services/api';
import {
  formatDate,
  formatRelativeTime,
  generateId,
  formatFileSize,
  maskPhone,
  maskEmail,
  debounce
} from '@/lib/utils';
import { USER_STATUS, USER_ROLES, MESSAGE_TYPES } from '@/lib/constants';
import { useState } from 'react';

export default function ArchitectureTestPage() {
  const [testResults, setTestResults] = useState<string[]>([]);

  // 测试 API Hooks
  const { data, loading, error, execute } = useApi(
    () => userApi.getUsers(),
    {
      immediate: false,
      onSuccess: (data) => {
        addTestResult('✅ API Hook 成功获取数据');
      },
      onError: (error) => {
        addTestResult(`❌ API Hook 错误: ${error}`);
      }
    }
  );

  // 测试分页 Hook
  const {
    data: users,
    total,
    loading: usersLoading,
    changePage
  } = usePaginatedApi(userApi.getUsers);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${formatDate(new Date())}: ${result}`]);
  };

  // 测试工具函数
  const testUtils = () => {
    const testData = [
      `随机ID: ${generateId()}`,
      `当前时间: ${formatDate(new Date())}`,
      `相对时间: ${formatRelativeTime(new Date(Date.now() - 3600000))}`,
      `文件大小: ${formatFileSize(1024 * 1024 * 5.5)}`,
      `手机号脱敏: ${maskPhone('13812345678')}`,
      `邮箱脱敏: ${maskEmail('zhangsan@example.com')}`,
    ];

    testData.forEach(result => addTestResult(`🔧 ${result}`));
    message.success('工具函数测试完成');
  };

  // 测试常量
  const testConstants = () => {
    const constantTests = [
      `用户状态: ${Object.values(USER_STATUS).join(', ')}`,
      `用户角色: ${Object.values(USER_ROLES).join(', ')}`,
      `消息类型: ${Object.values(MESSAGE_TYPES).join(', ')}`,
    ];

    constantTests.forEach(result => addTestResult(`📋 ${result}`));
    message.success('常量测试完成');
  };

  // 测试防抖函数
  const debouncedTest = debounce(() => {
    addTestResult('🚀 防抖函数执行');
    message.info('防抖测试完成');
  }, 1000);

  return (
    <div className="p-6 space-y-6">
      <Card title="🏗️ 核心架构测试" className="w-full">
        <Space direction="vertical" className="w-full" size="large">

          {/* HTTP 服务测试 */}
          <div>
            <h3 className="text-lg font-semibold mb-3">🌐 HTTP 服务层测试</h3>
            <Space wrap>
              <Button
                type="primary"
                onClick={execute}
                loading={loading}
              >
                测试 API 调用
              </Button>
              <Button onClick={() => changePage(2)} loading={usersLoading}>
                测试分页 (第2页)
              </Button>
              {error && <Tag color="red">错误: {error}</Tag>}
              {data && <Tag color="green">数据加载成功</Tag>}
            </Space>
          </div>

          <Divider />

          {/* 工具函数测试 */}
          <div>
            <h3 className="text-lg font-semibold mb-3">🛠️ 工具函数测试</h3>
            <Space wrap>
              <Button onClick={testUtils}>测试工具函数</Button>
              <Button onClick={debouncedTest}>测试防抖函数</Button>
            </Space>
          </div>

          <Divider />

          {/* 常量管理测试 */}
          <div>
            <h3 className="text-lg font-semibold mb-3">📋 常量管理测试</h3>
            <Button onClick={testConstants}>测试常量定义</Button>
          </div>

          <Divider />

          {/* 测试结果显示 */}
          <div>
            <h3 className="text-lg font-semibold mb-3">📊 测试结果</h3>
            <div className="bg-gray-50 p-4 rounded-lg max-h-60 overflow-y-auto">
              {testResults.length === 0 ? (
                <p className="text-gray-500">暂无测试结果</p>
              ) : (
                testResults.map((result, index) => (
                  <div key={index} className="text-sm mb-1 font-mono">
                    {result}
                  </div>
                ))
              )}
            </div>
            <Button
              size="small"
              className="mt-2"
              onClick={() => setTestResults([])}
            >
              清空结果
            </Button>
          </div>

        </Space>
      </Card>
    </div>
  );
}
```

### 3.24 架构总结

通过本章的学习，我们构建了一个完整的核心架构：

**🌐 HTTP 服务层**
- 类型安全的 HTTP 客户端
- 统一的错误处理
- 超时控制和请求拦截

**🎣 自定义 Hooks**
- `useApi`: 通用 API 请求 Hook
- `usePaginatedApi`: 分页数据 Hook
- 统一的加载状态和错误处理

**🛠️ 工具函数库**
- 日期格式化、文件处理
- 性能优化（防抖、节流）
- 数据脱敏和安全处理

**📋 常量管理**
- 类型安全的常量定义
- 集中化配置管理
- 易于维护和扩展

## 🎯 下一步

核心架构搭建完成后，我们将在下一章开始构建布局系统，包括：
- 智能的布局控制系统
- 响应式侧边栏导航
- 可配置的页面布局
- 面包屑导航组件

---

> 💡 **学习要点**:
> - 核心架构是整个应用的基础，需要考虑可扩展性和可维护性
> - 使用 TypeScript 确保类型安全，减少运行时错误
> - 自定义 Hooks 是复用逻辑的最佳方式
> - 工具函数和常量管理让代码更加规范和易读
