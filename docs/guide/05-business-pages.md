# 📄 第五部分：业务页面开发

## 📋 概述

这是核心搭建指南的最后一章！我们将基于前面构建的架构和布局系统，创建完整的业务功能页面。通过本章学习，您将掌握如何快速开发企业级的管理后台功能。

## 🎯 学习目标

完成本章后，您将掌握：
- 如何创建可复用的数据表格组件
- 如何实现完整的 CRUD 功能
- 如何处理表单验证和数据提交
- 如何优化用户体验和交互

## 🏗️ 开发思路

在开始编码之前，我们先分析一下企业级管理后台的常见功能模式：

1. **数据展示** - 表格、卡片、统计图表
2. **数据操作** - 增删改查 (CRUD)
3. **数据筛选** - 搜索、过滤、排序
4. **用户交互** - 弹窗、确认、提示

我们将按照这个思路，循序渐进地实现一个完整的用户管理功能。

## 📊 第一步：创建基础数据表格

### 5.1 理解表格组件的需求

企业级的数据表格需要具备：
- **搜索功能** - 快速查找数据
- **刷新功能** - 重新加载数据
- **分页功能** - 处理大量数据
- **操作按钮** - 编辑、删除等操作
- **响应式设计** - 适配不同屏幕

### 5.2 创建简单的数据表格

我们先创建一个简单版本的数据表格，然后逐步完善。创建 `components/common/DataTable.tsx` 文件：

```typescript
'use client';

import React, { useState } from 'react';
import { Table, Card, Input, Button, Space, Tooltip } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import type { TableProps } from 'antd/es/table';

// 定义表格组件的属性接口
interface DataTableProps<T = any> extends Omit<TableProps<T>, 'title'> {
  title?: string;                    // 表格标题
  extra?: React.ReactNode;          // 额外的操作按钮
  showSearch?: boolean;             // 是否显示搜索框
  showRefresh?: boolean;            // 是否显示刷新按钮
  searchPlaceholder?: string;       // 搜索框占位符
  onSearch?: (value: string) => void;  // 搜索回调
  onRefresh?: () => void;           // 刷新回调
}

export function DataTable<T extends Record<string, any>>({
  title,
  extra,
  showSearch = true,
  showRefresh = true,
  searchPlaceholder = '请输入搜索关键词',
  onSearch,
  onRefresh,
  className,
  ...tableProps
}: DataTableProps<T>) {
  // 搜索框的值
  const [searchValue, setSearchValue] = useState('');

  // 处理搜索
  const handleSearch = (value: string) => {
    setSearchValue(value);
    onSearch?.(value);
  };

  // 处理刷新
  const handleRefresh = () => {
    onRefresh?.();
  };

  // 表格头部内容
  const cardTitle = (
    <div className="flex items-center justify-between">
      <span className="text-lg font-semibold">{title}</span>
      <Space>
        {/* 搜索框 */}
        {showSearch && (
          <Input.Search
            placeholder={searchPlaceholder}
            allowClear
            style={{ width: 250 }}
            onSearch={handleSearch}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
        )}
        {/* 刷新按钮 */}
        {showRefresh && (
          <Tooltip title="刷新">
            <Button icon={<ReloadOutlined />} onClick={handleRefresh} />
          </Tooltip>
        )}
        {/* 额外的操作按钮 */}
        {extra}
      </Space>
    </div>
  );

  return (
    <Card title={cardTitle}>
      <Table
        {...tableProps}
        pagination={{
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) =>
            `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
          ...tableProps.pagination,
        }}
      />
    </Card>
  );
}
```

**设计亮点：**
- 使用泛型确保类型安全
- 灵活的配置选项（搜索、刷新、额外按钮）
- 统一的分页配置
- 清晰的代码结构和注释

### 5.3 测试数据表格组件

让我们创建一个简单的测试页面来验证表格组件：

```typescript
// app/table-test/page.tsx
'use client';

import { DataTable } from '@/components/common/DataTable';
import { Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

// 模拟数据
const mockData = [
  { id: 1, name: '张三', email: 'zhangsan@example.com', role: '管理员' },
  { id: 2, name: '李四', email: 'lisi@example.com', role: '用户' },
  { id: 3, name: '王五', email: 'wangwu@example.com', role: '用户' },
];

// 表格列配置
const columns = [
  { title: 'ID', dataIndex: 'id', key: 'id' },
  { title: '姓名', dataIndex: 'name', key: 'name' },
  { title: '邮箱', dataIndex: 'email', key: 'email' },
  { title: '角色', dataIndex: 'role', key: 'role' },
];

export default function TableTestPage() {
  const handleSearch = (value: string) => {
    console.log('搜索:', value);
  };

  const handleRefresh = () => {
    console.log('刷新数据');
  };

  return (
    <div className="p-6">
      <DataTable
        title="用户列表"
        dataSource={mockData}
        columns={columns}
        onSearch={handleSearch}
        onRefresh={handleRefresh}
        extra={
          <Button type="primary" icon={<PlusOutlined />}>
            添加用户
          </Button>
        }
      />
    </div>
  );
}
```

## 👥 第二步：创建用户管理页面

### 5.4 理解用户管理的功能需求

一个完整的用户管理页面通常包含：
- **数据展示** - 用户列表、状态、角色等信息
- **数据操作** - 添加、编辑、删除用户
- **数据筛选** - 按状态、角色搜索用户
- **状态管理** - 启用/禁用用户账户

### 5.5 第一步：定义数据类型

首先，我们需要定义用户数据的类型。更新 `lib/types.ts` 文件：

```typescript
// 用户状态枚举
export type UserStatus = 'active' | 'inactive' | 'suspended';

// 用户角色枚举
export type UserRole = 'admin' | 'user' | 'guest';

// 用户数据接口
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}
```

### 5.6 第二步：创建用户列表页面

创建 `app/users/list/page.tsx` 文件：

```typescript
'use client';

import React, { useState } from 'react';
import { Button, Tag, Space, Modal, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { MainLayout } from '@/components/layouts/MainLayout';
import { PageLayoutProvider } from '@/lib/hooks/useLayout';
import { DataTable } from '@/components/common/DataTable';
import { formatDate } from '@/lib/utils';
import type { User, UserStatus, UserRole } from '@/lib/types';

export default function UserListPage() {
  const [loading, setLoading] = useState(false);

  // 模拟用户数据
  const [users, setUsers] = useState<User[]>([
    {
      id: '1',
      name: '张三',
      email: 'zhangsan@example.com',
      role: 'admin',
      status: 'active',
      createdAt: '2024-01-15T10:30:00Z',
      updatedAt: '2024-01-15T10:30:00Z',
    },
    {
      id: '2',
      name: '李四',
      email: 'lisi@example.com',
      role: 'user',
      status: 'active',
      createdAt: '2024-01-16T14:20:00Z',
      updatedAt: '2024-01-16T14:20:00Z',
    },
    {
      id: '3',
      name: '王五',
      email: 'wangwu@example.com',
      role: 'user',
      status: 'inactive',
      createdAt: '2024-01-17T09:15:00Z',
      updatedAt: '2024-01-17T09:15:00Z',
    },
  ]);

  // 处理用户操作
  const handleView = (record: User) => {
    message.info(`查看用户: ${record.name}`);
  };

  const handleEdit = (record: User) => {
    message.info(`编辑用户: ${record.name}`);
  };

  const handleDelete = (record: User) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除用户 "${record.name}" 吗？`,
      okText: '确认',
      cancelText: '取消',
      onOk() {
        setUsers(prev => prev.filter(user => user.id !== record.id));
        message.success('删除成功');
      },
    });
  };

  const handleAdd = () => {
    message.info('跳转到新增用户页面');
  };

  const handleSearch = (value: string) => {
    console.log('搜索:', value);
    // TODO: 调用 API 进行搜索
  };

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      message.success('刷新成功');
    }, 1000);
  };

  // 表格列配置
  const columns: ColumnsType<User> = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role: UserRole) => (
        <Tag color={role === 'admin' ? 'red' : 'blue'}>
          {role === 'admin' ? '管理员' : '普通用户'}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: UserStatus) => (
        <Tag color={status === 'active' ? 'green' : 'default'}>
          {status === 'active' ? '激活' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => formatDate(date),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
          >
            查看
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <PageLayoutProvider config={{ title: '用户列表' }}>
      <MainLayout>
        <DataTable
          title="用户列表"
          dataSource={users}
          columns={columns}
          loading={loading}
          rowKey="id"
          onSearch={handleSearch}
          onRefresh={handleRefresh}
          extra={
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAdd}
            >
              新增用户
            </Button>
          }
        />
      </MainLayout>
    </PageLayoutProvider>
  );
}
```

**关键实现点：**
- 使用我们之前创建的 `DataTable` 组件
- 完整的 CRUD 操作（查看、编辑、删除）
- 状态和角色的可视化显示
- 搜索和刷新功能
- 响应式的操作按钮

## 🔐 角色管理页面

### 5.3 创建角色管理页面

创建 `app/users/roles/page.tsx` 文件：

```typescript
'use client';

import React, { useState } from 'react';
import { Button, Tag, Space, Modal, message, Descriptions, Badge } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  SettingOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { MainLayout } from '@/components/layouts/MainLayout';
import { PageLayoutProvider } from '@/lib/hooks/useLayout';
import { DataTable } from '@/components/common/DataTable';
import { formatDate } from '@/lib/utils';

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  userCount: number;
  status: 'active' | 'inactive';
  createdAt: string;
}

export default function RoleManagement() {
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<Role[]>([
    {
      id: '1',
      name: '超级管理员',
      description: '拥有系统所有权限',
      permissions: ['user:read', 'user:write', 'role:read', 'role:write', 'system:admin'],
      userCount: 2,
      status: 'active',
      createdAt: '2024-01-01T00:00:00Z',
    },
    {
      id: '2',
      name: '普通管理员',
      description: '拥有用户管理权限',
      permissions: ['user:read', 'user:write'],
      userCount: 5,
      status: 'active',
      createdAt: '2024-01-02T00:00:00Z',
    },
    {
      id: '3',
      name: '访客',
      description: '只读权限',
      permissions: ['user:read'],
      userCount: 10,
      status: 'active',
      createdAt: '2024-01-03T00:00:00Z',
    },
  ]);

  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  const handleView = (record: Role) => {
    setSelectedRole(record);
    setDetailModalVisible(true);
  };

  const handleEdit = (record: Role) => {
    message.info(`编辑角色: ${record.name}`);
  };

  const handleDelete = (record: Role) => {
    if (record.userCount > 0) {
      message.warning('该角色下还有用户，无法删除');
      return;
    }

    Modal.confirm({
      title: '确认删除',
      icon: <ExclamationCircleOutlined />,
      content: `确定要删除角色 "${record.name}" 吗？`,
      okText: '确认',
      cancelText: '取消',
      onOk() {
        setRoles(prev => prev.filter(role => role.id !== record.id));
        message.success('删除成功');
      },
    });
  };

  const handlePermissions = (record: Role) => {
    message.info(`配置权限: ${record.name}`);
  };

  const handleAdd = () => {
    message.info('跳转到新增角色页面');
  };

  const handleSearch = (value: string) => {
    console.log('搜索角色:', value);
  };

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      message.success('刷新成功');
    }, 1000);
  };

  const columns: ColumnsType<Role> = [
    {
      title: '角色名称',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '权限数量',
      dataIndex: 'permissions',
      key: 'permissions',
      render: (permissions: string[]) => (
        <Badge count={permissions.length} color="blue" />
      ),
      sorter: (a, b) => a.permissions.length - b.permissions.length,
    },
    {
      title: '用户数量',
      dataIndex: 'userCount',
      key: 'userCount',
      render: (count: number) => (
        <Badge count={count} color={count > 0 ? 'green' : 'default'} />
      ),
      sorter: (a, b) => a.userCount - b.userCount,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'default'}>
          {status === 'active' ? '启用' : '禁用'}
        </Tag>
      ),
      filters: [
        { text: '启用', value: 'active' },
        { text: '禁用', value: 'inactive' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => formatDate(date),
      sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: '操作',
      key: 'action',
      width: 250,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
          >
            查看
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            icon={<SettingOutlined />}
            onClick={() => handlePermissions(record)}
          >
            权限
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
            disabled={record.userCount > 0}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <PageLayoutProvider config={{ title: '角色管理' }}>
      <MainLayout>
        <DataTable
          title="角色管理"
          dataSource={roles}
          columns={columns}
          loading={loading}
          rowKey="id"
          onSearch={handleSearch}
          onRefresh={handleRefresh}
          searchPlaceholder="搜索角色名称或描述"
          extra={
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAdd}
            >
              新增角色
            </Button>
          }
        />

        {/* 角色详情弹窗 */}
        <Modal
          title="角色详情"
          open={detailModalVisible}
          onCancel={() => setDetailModalVisible(false)}
          footer={null}
          width={600}
        >
          {selectedRole && (
            <Descriptions column={1} bordered>
              <Descriptions.Item label="角色名称">
                {selectedRole.name}
              </Descriptions.Item>
              <Descriptions.Item label="描述">
                {selectedRole.description}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={selectedRole.status === 'active' ? 'green' : 'default'}>
                  {selectedRole.status === 'active' ? '启用' : '禁用'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="用户数量">
                <Badge count={selectedRole.userCount} color="blue" />
              </Descriptions.Item>
              <Descriptions.Item label="权限列表">
                <Space wrap>
                  {selectedRole.permissions.map(permission => (
                    <Tag key={permission} color="blue">
                      {permission}
                    </Tag>
                  ))}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {formatDate(selectedRole.createdAt)}
              </Descriptions.Item>
            </Descriptions>
          )}
        </Modal>
      </MainLayout>
    </PageLayoutProvider>
  );
}
```

## 📊 仪表盘页面

### 5.4 创建仪表盘页面

更新 `app/dashboard/page.tsx` 文件：

```typescript
'use client';

import React from 'react';
import { Card, Row, Col, Statistic, Progress, List, Avatar, Tag } from 'antd';
import {
  UserOutlined,
  TeamOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons';
import { MainLayout } from '@/components/layouts/MainLayout';
import { PageLayoutProvider } from '@/lib/hooks/useLayout';

export default function Dashboard() {
  const recentActivities = [
    {
      id: 1,
      user: '张三',
      action: '创建了新用户',
      time: '2 分钟前',
      type: 'create',
    },
    {
      id: 2,
      user: '李四',
      action: '更新了角色权限',
      time: '5 分钟前',
      type: 'update',
    },
    {
      id: 3,
      user: '王五',
      action: '删除了过期数据',
      time: '10 分钟前',
      type: 'delete',
    },
  ];

  return (
    <PageLayoutProvider config={{ title: '仪表盘' }}>
      <MainLayout>
        <div className="space-y-6">
          {/* 统计卡片 */}
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="总用户数"
                  value={1128}
                  prefix={<UserOutlined />}
                  suffix={
                    <span className="text-green-500 text-sm">
                      <ArrowUpOutlined /> 12%
                    </span>
                  }
                  valueStyle={{ color: '#3f8600' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="活跃用户"
                  value={856}
                  prefix={<TeamOutlined />}
                  suffix={
                    <span className="text-green-500 text-sm">
                      <ArrowUpOutlined /> 8%
                    </span>
                  }
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="今日订单"
                  value={93}
                  prefix={<ShoppingCartOutlined />}
                  suffix={
                    <span className="text-red-500 text-sm">
                      <ArrowDownOutlined /> 3%
                    </span>
                  }
                  valueStyle={{ color: '#cf1322' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="总收入"
                  value={112893}
                  prefix={<DollarOutlined />}
                  precision={2}
                  suffix={
                    <span className="text-green-500 text-sm">
                      <ArrowUpOutlined /> 15%
                    </span>
                  }
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
          </Row>

          {/* 图表和活动 */}
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={16}>
              <Card title="系统性能" extra={<a href="#">查看详情</a>}>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span>CPU 使用率</span>
                      <span>65%</span>
                    </div>
                    <Progress percent={65} status="active" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span>内存使用率</span>
                      <span>78%</span>
                    </div>
                    <Progress percent={78} status="active" strokeColor="#52c41a" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span>磁盘使用率</span>
                      <span>45%</span>
                    </div>
                    <Progress percent={45} strokeColor="#1890ff" />
                  </div>
                </div>
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Card title="最近活动" extra={<a href="#">查看全部</a>}>
                <List
                  itemLayout="horizontal"
                  dataSource={recentActivities}
                  renderItem={(item) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={<Avatar icon={<UserOutlined />} />}
                        title={
                          <div className="flex items-center space-x-2">
                            <span>{item.user}</span>
                            <Tag
                              color={
                                item.type === 'create'
                                  ? 'green'
                                  : item.type === 'update'
                                  ? 'blue'
                                  : 'red'
                              }
                            >
                              {item.type === 'create'
                                ? '新增'
                                : item.type === 'update'
                                ? '更新'
                                : '删除'}
                            </Tag>
                          </div>
                        }
                        description={
                          <div>
                            <div>{item.action}</div>
                            <div className="text-gray-500 text-xs">{item.time}</div>
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              </Card>
            </Col>
          </Row>
        </div>
      </MainLayout>
    </PageLayoutProvider>
  );
}
```

## ✅ 测试页面功能

### 5.5 启动开发服务器

```bash
npm run dev
```

访问以下页面测试功能：
- 仪表盘: `http://localhost:3000/dashboard`
- 用户列表: `http://localhost:3000/users/list`
- 角色管理: `http://localhost:3000/users/roles`

## 🎯 下一步

业务页面开发完成后，我们将在下一章添加性能优化和错误处理机制，确保应用的稳定性和用户体验。

---

> 💡 **提示**: 这些页面展示了完整的 CRUD 操作模式，可以作为其他业务页面的开发模板。注意数据表格组件的复用性设计。
