# 🧪 第十部分：测试和质量保证

## 📋 概述

本章将建立完整的测试体系，包括单元测试、集成测试、端到端测试、性能测试和代码质量检查。基于当前项目的架构，确保应用的稳定性、可靠性和高质量。

## 🔧 测试环境配置

### 12.1 安装测试依赖

```bash
# 测试框架
npm install --save-dev jest @types/jest jest-environment-jsdom

# React 测试工具
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event

# 端到端测试
npm install --save-dev @playwright/test

# 测试工具
npm install --save-dev msw @types/node

# 代码覆盖率
npm install --save-dev @jest/globals

# 性能测试
npm install --save-dev lighthouse puppeteer
```

### 12.2 配置 Jest

创建 `jest.config.js`：

```javascript
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  testMatch: [
    '<rootDir>/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/**/*.{test,spec}.{js,jsx,ts,tsx}',
  ],
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);
```

创建 `jest.setup.js`：

```javascript
import '@testing-library/jest-dom';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    };
  },
  usePathname() {
    return '/';
  },
  useSearchParams() {
    return new URLSearchParams();
  },
}));

// Mock Ant Design components that might cause issues in tests
jest.mock('antd', () => {
  const antd = jest.requireActual('antd');
  return {
    ...antd,
    message: {
      success: jest.fn(),
      error: jest.fn(),
      warning: jest.fn(),
      info: jest.fn(),
    },
    notification: {
      success: jest.fn(),
      error: jest.fn(),
      warning: jest.fn(),
      info: jest.fn(),
    },
  };
});

// Global test utilities
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));
```

## 🧪 单元测试

### 12.3 组件测试

创建 `components/common/__tests__/DataTable.test.tsx`：

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataTable } from '../DataTable';

// Mock data
const mockData = [
  { id: 1, name: 'John Doe', email: 'john@example.com', status: 'active' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'inactive' },
];

const mockColumns = [
  { title: 'Name', dataIndex: 'name', key: 'name' },
  { title: 'Email', dataIndex: 'email', key: 'email' },
  { title: 'Status', dataIndex: 'status', key: 'status' },
];

describe('DataTable', () => {
  const defaultProps = {
    columns: mockColumns,
    dataSource: mockData,
    loading: false,
    pagination: {
      current: 1,
      pageSize: 10,
      total: 2,
    },
  };

  it('renders table with data', () => {
    render(<DataTable {...defaultProps} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<DataTable {...defaultProps} loading={true} />);
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('handles pagination change', async () => {
    const onPaginationChange = jest.fn();
    render(
      <DataTable 
        {...defaultProps} 
        onPaginationChange={onPaginationChange}
      />
    );
    
    const nextButton = screen.getByRole('button', { name: /next/i });
    await userEvent.click(nextButton);
    
    expect(onPaginationChange).toHaveBeenCalledWith(2, 10);
  });

  it('handles search functionality', async () => {
    const onSearch = jest.fn();
    render(
      <DataTable 
        {...defaultProps} 
        searchable={true}
        onSearch={onSearch}
      />
    );
    
    const searchInput = screen.getByPlaceholderText(/search/i);
    await userEvent.type(searchInput, 'John');
    
    await waitFor(() => {
      expect(onSearch).toHaveBeenCalledWith('John');
    });
  });

  it('handles row selection', async () => {
    const onSelectionChange = jest.fn();
    render(
      <DataTable 
        {...defaultProps} 
        rowSelection={{
          onChange: onSelectionChange,
        }}
      />
    );
    
    const checkbox = screen.getAllByRole('checkbox')[1]; // First row checkbox
    await userEvent.click(checkbox);
    
    expect(onSelectionChange).toHaveBeenCalledWith([1], [mockData[0]]);
  });
});
```

### 12.4 Hook 测试

创建 `lib/hooks/__tests__/useUsers.test.ts`：

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUsers } from '../useUsers';
import { userService } from '@/lib/services/userService';

// Mock the service
jest.mock('@/lib/services/userService');
const mockUserService = userService as jest.Mocked<typeof userService>;

// Test wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useUsers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches users successfully', async () => {
    const mockUsers = [
      { id: 1, name: 'John Doe', email: 'john@example.com' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
    ];

    mockUserService.getUsers.mockResolvedValue({
      data: mockUsers,
      total: 2,
      page: 1,
      pageSize: 10,
    });

    const { result } = renderHook(() => useUsers(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.data).toEqual(mockUsers);
    expect(mockUserService.getUsers).toHaveBeenCalledWith({
      page: 1,
      pageSize: 10,
    });
  });

  it('handles error state', async () => {
    const errorMessage = 'Failed to fetch users';
    mockUserService.getUsers.mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useUsers(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe(errorMessage);
  });
});
```

## 🔗 集成测试

### 12.5 API 路由测试

创建 `app/api/users/__tests__/route.test.ts`：

```typescript
import { GET, POST } from '../route';
import { NextRequest } from 'next/server';

// Mock database or external services
jest.mock('@/lib/db', () => ({
  user: {
    findMany: jest.fn(),
    create: jest.fn(),
  },
}));

describe('/api/users', () => {
  describe('GET', () => {
    it('returns users list', async () => {
      const mockUsers = [
        { id: 1, name: 'John Doe', email: 'john@example.com' },
      ];

      // Mock database response
      require('@/lib/db').user.findMany.mockResolvedValue(mockUsers);

      const request = new NextRequest('http://localhost:3000/api/users');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toEqual(mockUsers);
    });
  });

  describe('POST', () => {
    it('creates new user', async () => {
      const userData = {
        name: 'New User',
        email: 'new@example.com',
        password: 'password123',
      };

      const mockCreatedUser = {
        id: 1,
        ...userData,
        createdAt: new Date(),
      };

      require('@/lib/db').user.create.mockResolvedValue(mockCreatedUser);

      const request = new NextRequest('http://localhost:3000/api/users', {
        method: 'POST',
        body: JSON.stringify(userData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.data).toEqual(mockCreatedUser);
    });
  });
});
```

## 🎭 端到端测试

### 12.6 Playwright 配置

创建 `playwright.config.ts`：

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### 12.7 E2E 测试示例

创建 `e2e/user-management.spec.ts`：

```typescript
import { test, expect } from '@playwright/test';

test.describe('User Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/users/list');
  });

  test('should display user list', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('用户列表');
    await expect(page.locator('[data-testid="user-table"]')).toBeVisible();
  });

  test('should search users', async ({ page }) => {
    const searchInput = page.locator('[data-testid="search-input"]');
    await searchInput.fill('admin');
    await searchInput.press('Enter');
    
    await expect(page.locator('[data-testid="user-table"]')).toBeVisible();
    // Verify search results contain 'admin'
  });

  test('should create new user', async ({ page }) => {
    await page.click('[data-testid="add-user-button"]');
    
    // Fill form
    await page.fill('[data-testid="user-name-input"]', 'Test User');
    await page.fill('[data-testid="user-email-input"]', 'test@example.com');
    await page.fill('[data-testid="user-password-input"]', 'password123');
    
    // Submit form
    await page.click('[data-testid="submit-button"]');
    
    // Verify success message
    await expect(page.locator('.ant-message')).toContainText('创建成功');
  });

  test('should edit user', async ({ page }) => {
    // Click edit button for first user
    await page.click('[data-testid="edit-user-1"]');
    
    // Update name
    const nameInput = page.locator('[data-testid="user-name-input"]');
    await nameInput.clear();
    await nameInput.fill('Updated User');
    
    // Submit form
    await page.click('[data-testid="submit-button"]');
    
    // Verify success message
    await expect(page.locator('.ant-message')).toContainText('更新成功');
  });

  test('should delete user', async ({ page }) => {
    // Click delete button for first user
    await page.click('[data-testid="delete-user-1"]');
    
    // Confirm deletion
    await page.click('[data-testid="confirm-delete"]');
    
    // Verify success message
    await expect(page.locator('.ant-message')).toContainText('删除成功');
  });
});
```

## 📊 性能测试

### 12.8 Lighthouse 测试

创建 `tests/performance/lighthouse.test.js`：

```javascript
const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');

describe('Performance Tests', () => {
  let chrome;
  let options;

  beforeAll(async () => {
    chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
    options = {
      logLevel: 'info',
      output: 'json',
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      port: chrome.port,
    };
  });

  afterAll(async () => {
    await chrome.kill();
  });

  test('Homepage performance', async () => {
    const runnerResult = await lighthouse('http://localhost:3000', options);
    const { lhr } = runnerResult;

    expect(lhr.categories.performance.score).toBeGreaterThan(0.8);
    expect(lhr.categories.accessibility.score).toBeGreaterThan(0.9);
    expect(lhr.categories['best-practices'].score).toBeGreaterThan(0.8);
    expect(lhr.categories.seo.score).toBeGreaterThan(0.8);
  });

  test('User list page performance', async () => {
    const runnerResult = await lighthouse('http://localhost:3000/users/list', options);
    const { lhr } = runnerResult;

    expect(lhr.categories.performance.score).toBeGreaterThan(0.7);
    expect(lhr.audits['first-contentful-paint'].numericValue).toBeLessThan(2000);
    expect(lhr.audits['largest-contentful-paint'].numericValue).toBeLessThan(3000);
  });
});
```

## 🔍 代码质量检查

### 12.9 测试覆盖率

更新 `package.json` 添加测试脚本：

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:performance": "jest tests/performance",
    "test:all": "npm run test && npm run test:e2e"
  }
}
```

### 12.10 质量门禁

创建 `.github/workflows/quality-gate.yml`：

```yaml
name: Quality Gate

on:
  pull_request:
    branches: [main]

jobs:
  quality-check:
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
    
    - name: Run type checking
      run: npm run type-check
    
    - name: Run unit tests
      run: npm run test:coverage
    
    - name: Check coverage threshold
      run: |
        COVERAGE=$(npm run test:coverage --silent | grep "All files" | awk '{print $10}' | sed 's/%//')
        if [ "$COVERAGE" -lt "80" ]; then
          echo "Coverage $COVERAGE% is below threshold 80%"
          exit 1
        fi
    
    - name: Run E2E tests
      run: npm run test:e2e
    
    - name: Upload test results
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: test-results
        path: |
          coverage/
          playwright-report/
          test-results/
```

## ✅ 测试最佳实践

### 12.11 测试金字塔

遵循测试金字塔原则：

```
    /\
   /  \     E2E Tests (少量)
  /____\    
 /      \   Integration Tests (适量)
/__________\ Unit Tests (大量)
```

- **单元测试 (70%)**：快速、独立、专注于单个功能
- **集成测试 (20%)**：测试组件间的交互
- **端到端测试 (10%)**：测试完整的用户流程

### 12.12 测试命名规范

```typescript
describe('UserService', () => {
  describe('getUsers', () => {
    it('should return users when API call succeeds', () => {
      // Given - 准备测试数据
      // When - 执行被测试的方法
      // Then - 验证结果
    });

    it('should throw error when API call fails', () => {
      // 测试错误情况
    });

    it('should handle empty response', () => {
      // 测试边界情况
    });
  });
});
```

### 12.13 Mock 策略

```typescript
// 1. Mock 外部依赖
jest.mock('@/lib/services/api');

// 2. Mock 特定函数
const mockGetUsers = jest.fn();
jest.mock('@/lib/services/userService', () => ({
  userService: {
    getUsers: mockGetUsers,
  },
}));

// 3. 部分 Mock
jest.mock('@/lib/utils', () => ({
  ...jest.requireActual('@/lib/utils'),
  formatDate: jest.fn(() => '2024-01-01'),
}));
```

## 🎯 测试检查清单

### 12.14 测试完整性检查

- [ ] 单元测试覆盖率 > 80%
- [ ] 集成测试覆盖关键流程
- [ ] E2E 测试覆盖主要用户场景
- [ ] 性能测试通过基准
- [ ] 所有测试在 CI 中运行
- [ ] 测试数据独立且可重复
- [ ] Mock 策略合理
- [ ] 测试文档完整

## 🎊 总结

恭喜！您已经完成了整个 Next.js 管理后台模板的学习之旅。通过这12个章节，您已经掌握了：

1. **项目初始化** - 从零开始创建项目
2. **基础配置** - Ant Design 和 Tailwind CSS 集成
3. **核心架构** - HTTP 服务层和自定义 Hooks
4. **布局系统** - 智能布局控制
5. **业务页面** - 完整的 CRUD 功能
6. **性能优化** - 全面的性能提升策略
7. **项目部署** - 生产环境配置
8. **开发规范** - 团队协作标准
9. **性能优化** - 深度优化技巧
10. **项目部署** - 完整的部署流程
11. **开发规范** - 代码质量保证
12. **测试体系** - 全面的质量保证

现在您拥有了一个生产级的、高质量的 Next.js 管理后台模板！

---

> 💡 **下一步建议**: 将这个模板应用到实际项目中，根据具体需求进行定制和扩展。记住，持续学习和改进是成为优秀开发者的关键！
