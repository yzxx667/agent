# 📋 第九部分：开发规范

## 📋 概述

本章将建立完整的开发规范体系，包括代码规范、Git 工作流、代码审查标准、文档规范和团队协作最佳实践。这些规范将确保团队开发的一致性和代码质量。

## 📝 代码规范

### 11.1 创建 ESLint 配置

创建 `.eslintrc.js`：

```javascript
module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    'next/core-web-vitals',
    'prettier',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: [
    '@typescript-eslint',
    'react',
    'react-hooks',
    'import',
    'jsx-a11y',
  ],
  rules: {
    // TypeScript 规则
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-non-null-assertion': 'warn',
    '@typescript-eslint/prefer-const': 'error',
    '@typescript-eslint/no-var-requires': 'error',

    // React 规则
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    'react/display-name': 'off',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',

    // 导入规则
    'import/order': [
      'error',
      {
        groups: [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index',
        ],
        'newlines-between': 'always',
        alphabetize: {
          order: 'asc',
          caseInsensitive: true,
        },
      },
    ],
    'import/no-duplicates': 'error',
    'import/no-unresolved': 'error',

    // 通用规则
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    'prefer-const': 'error',
    'no-var': 'error',
    'object-shorthand': 'error',
    'prefer-template': 'error',
  },
  settings: {
    react: {
      version: 'detect',
    },
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: './tsconfig.json',
      },
    },
  },
};
```

### 11.2 Prettier 配置

创建 `.prettierrc.js`：

```javascript
module.exports = {
  semi: true,
  trailingComma: 'es5',
  singleQuote: true,
  printWidth: 80,
  tabWidth: 2,
  useTabs: false,
  bracketSpacing: true,
  bracketSameLine: false,
  arrowParens: 'avoid',
  endOfLine: 'lf',
  jsxSingleQuote: true,
  quoteProps: 'as-needed',
  proseWrap: 'preserve',
  htmlWhitespaceSensitivity: 'css',
  embeddedLanguageFormatting: 'auto',
};
```

创建 `.prettierignore`：

```
# 构建产物
.next
out
dist
build

# 依赖
node_modules

# 日志
*.log

# 环境变量
.env*

# 其他
.DS_Store
*.tsbuildinfo
```

### 11.3 TypeScript 配置优化

更新 `tsconfig.json`：

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "ES2022"],
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
      "@/*": ["./*"],
      "@/components/*": ["./components/*"],
      "@/lib/*": ["./lib/*"],
      "@/app/*": ["./app/*"],
      "@/types/*": ["./types/*"]
    },
    // 严格类型检查
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noImplicitThis": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts"
  ],
  "exclude": [
    "node_modules",
    ".next",
    "out"
  ]
}
```

## 🔧 开发工具配置

### 11.4 VS Code 配置

创建 `.vscode/settings.json`：

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "typescript.suggest.autoImports": true,
  "emmet.includeLanguages": {
    "typescript": "html",
    "typescriptreact": "html"
  },
  "files.associations": {
    "*.css": "tailwindcss"
  },
  "tailwindCSS.includeLanguages": {
    "typescript": "html",
    "typescriptreact": "html"
  }
}
```

创建 `.vscode/extensions.json`：

```json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-json"
  ]
}
```

### 11.5 Git Hooks 配置

安装 Husky 和 lint-staged：

```bash
npm install --save-dev husky lint-staged
npx husky install
```

创建 `.husky/pre-commit`：

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
```

创建 `.husky/commit-msg`：

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx commitlint --edit $1
```

更新 `package.json`：

```json
{
  "scripts": {
    "prepare": "husky install"
  },
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md,yml,yaml}": [
      "prettier --write"
    ]
  }
}
```

## 📋 Git 工作流

### 11.6 分支策略

采用 Git Flow 分支模型：

```
main (生产分支)
├── develop (开发分支)
│   ├── feature/user-management (功能分支)
│   ├── feature/dashboard-charts (功能分支)
│   └── feature/role-permissions (功能分支)
├── release/v1.0.0 (发布分支)
└── hotfix/critical-bug (热修复分支)
```

### 11.7 提交信息规范

使用 Conventional Commits 规范：

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

类型说明：
- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

示例：
```
feat(auth): add user login functionality

- Implement JWT authentication
- Add login form validation
- Create user session management

Closes #123
```

### 11.8 Commitlint 配置

安装 commitlint：

```bash
npm install --save-dev @commitlint/config-conventional @commitlint/cli
```

创建 `commitlint.config.js`：

```javascript
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'perf',
        'test',
        'chore',
        'revert',
      ],
    ],
    'subject-case': [2, 'never', ['sentence-case', 'start-case', 'pascal-case', 'upper-case']],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'header-max-length': [2, 'always', 72],
  },
};
```

## 📖 文档规范

### 11.9 代码注释规范

TypeScript 注释规范：

```typescript
/**
 * 用户服务类
 * 提供用户相关的 CRUD 操作
 * 
 * @example
 * ```typescript
 * const userService = new UserService();
 * const users = await userService.getUsers();
 * ```
 */
export class UserService {
  /**
   * 获取用户列表
   * 
   * @param params - 查询参数
   * @param params.page - 页码，从 1 开始
   * @param params.pageSize - 每页数量，默认 10
   * @param params.keyword - 搜索关键词
   * @returns Promise<PaginatedResponse<User>> 分页用户数据
   * 
   * @throws {ApiError} 当请求失败时抛出
   * 
   * @example
   * ```typescript
   * const result = await userService.getUsers({
   *   page: 1,
   *   pageSize: 20,
   *   keyword: 'admin'
   * });
   * ```
   */
  async getUsers(params: GetUsersParams): Promise<PaginatedResponse<User>> {
    // 实现逻辑
  }
}
```

### 11.10 README 模板

项目 README 结构：

```markdown
# 项目名称

简短的项目描述

## 🚀 快速开始

### 环境要求

- Node.js >= 18
- npm >= 8

### 安装

\`\`\`bash
npm install
\`\`\`

### 开发

\`\`\`bash
npm run dev
\`\`\`

## 📁 项目结构

\`\`\`
src/
├── app/          # Next.js App Router
├── components/   # React 组件
├── lib/          # 工具函数和服务
└── types/        # TypeScript 类型定义
\`\`\`

## 🛠️ 技术栈

- Next.js 15
- TypeScript
- Ant Design
- Tailwind CSS

## 📝 开发规范

请参考 [开发规范文档](./docs/development-standards.md)

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 📄 许可证

MIT License
```

## 🔍 代码审查

### 11.11 Pull Request 模板

创建 `.github/pull_request_template.md`：

```markdown
## 📋 变更描述

简要描述此 PR 的变更内容

## 🎯 变更类型

- [ ] 新功能 (feature)
- [ ] 修复 bug (fix)
- [ ] 文档更新 (docs)
- [ ] 代码重构 (refactor)
- [ ] 性能优化 (perf)
- [ ] 测试相关 (test)
- [ ] 其他 (chore)

## 🧪 测试

- [ ] 单元测试通过
- [ ] 集成测试通过
- [ ] 手动测试完成
- [ ] 无回归问题

## 📸 截图 (如适用)

<!-- 添加相关截图 -->

## 📝 检查清单

- [ ] 代码符合项目规范
- [ ] 已添加必要的测试
- [ ] 文档已更新
- [ ] 无 TypeScript 错误
- [ ] 无 ESLint 警告
- [ ] 已自测功能

## 🔗 相关 Issue

Closes #(issue number)
```

### 11.12 代码审查清单

审查要点：

**功能性**
- [ ] 功能是否按预期工作
- [ ] 边界情况是否处理
- [ ] 错误处理是否完善

**代码质量**
- [ ] 代码逻辑清晰
- [ ] 命名规范一致
- [ ] 无重复代码
- [ ] 性能考虑合理

**安全性**
- [ ] 输入验证完善
- [ ] 无安全漏洞
- [ ] 敏感信息保护

**可维护性**
- [ ] 代码结构合理
- [ ] 注释充分
- [ ] 易于扩展

## 📊 质量监控

### 11.13 代码质量指标

使用 SonarQube 或类似工具监控：

- 代码覆盖率 > 80%
- 重复代码率 < 3%
- 技术债务比率 < 5%
- 代码异味数量 < 10

### 11.14 性能指标

监控关键性能指标：

- 首次内容绘制 (FCP) < 1.8s
- 最大内容绘制 (LCP) < 2.5s
- 首次输入延迟 (FID) < 100ms
- 累积布局偏移 (CLS) < 0.1

## ✅ 规范检查清单

### 11.15 开发前检查

- [ ] 开发环境配置完成
- [ ] Git hooks 配置正确
- [ ] IDE 插件安装完成
- [ ] 代码规范文档已阅读

### 11.16 提交前检查

- [ ] 代码格式化完成
- [ ] ESLint 检查通过
- [ ] TypeScript 编译无错误
- [ ] 测试用例通过
- [ ] 提交信息符合规范

## 🎯 下一步

开发规范建立完成后，我们将在下一章配置完整的测试体系，确保代码质量和应用稳定性。

---

> 💡 **提示**: 规范的执行需要团队的共同努力，建议定期回顾和更新规范内容，确保其适应项目发展需要。
