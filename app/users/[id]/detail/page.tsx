'use client';

import React from 'react';
import { Card, Descriptions, Avatar, Tag, Button, Space, Divider } from 'antd';
import { ArrowLeftOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useRouter, useParams } from 'next/navigation';
import { MainLayout } from '@/components/layouts/MainLayout';

const UserDetailPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  // 模拟用户数据
  const userData = {
    id: userId,
    name: '张三',
    email: 'zhangsan@example.com',
    phone: '13800138000',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Zhang',
    role: '管理员',
    status: 'active',
    department: '技术部',
    position: '高级工程师',
    joinDate: '2023-01-15',
    lastLogin: '2024-01-15 14:30:00',
    description: '负责系统架构设计和技术团队管理，具有丰富的项目经验。',
  };

  const handleBack = () => {
    router.back();
  };

  const handleEdit = () => {
    router.push(`/users/${userId}/edit`);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* 页面头部 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={handleBack}
              type="text"
            >
              返回
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">用户详情</h1>
          </div>
          
          <Space>
            <Button 
              type="primary" 
              icon={<EditOutlined />}
              onClick={handleEdit}
            >
              编辑用户
            </Button>
            <Button 
              danger 
              icon={<DeleteOutlined />}
            >
              删除用户
            </Button>
          </Space>
        </div>

        {/* 用户基本信息卡片 */}
        <Card>
          <div className="flex items-start space-x-6">
            <Avatar 
              size={120} 
              src={userData.avatar}
              className="flex-shrink-0"
            />
            
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-4">
                <h2 className="text-xl font-semibold">{userData.name}</h2>
                <Tag color={userData.status === 'active' ? 'green' : 'red'}>
                  {userData.status === 'active' ? '活跃' : '禁用'}
                </Tag>
                <Tag color="blue">{userData.role}</Tag>
              </div>
              
              <p className="text-gray-600 mb-4">{userData.description}</p>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">邮箱：</span>
                  <span>{userData.email}</span>
                </div>
                <div>
                  <span className="text-gray-500">手机：</span>
                  <span>{userData.phone}</span>
                </div>
                <div>
                  <span className="text-gray-500">部门：</span>
                  <span>{userData.department}</span>
                </div>
                <div>
                  <span className="text-gray-500">职位：</span>
                  <span>{userData.position}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* 详细信息 */}
        <Card title="详细信息">
          <Descriptions column={2} bordered>
            <Descriptions.Item label="用户ID">{userData.id}</Descriptions.Item>
            <Descriptions.Item label="用户名">{userData.name}</Descriptions.Item>
            <Descriptions.Item label="邮箱地址">{userData.email}</Descriptions.Item>
            <Descriptions.Item label="手机号码">{userData.phone}</Descriptions.Item>
            <Descriptions.Item label="用户角色">{userData.role}</Descriptions.Item>
            <Descriptions.Item label="账户状态">
              <Tag color={userData.status === 'active' ? 'green' : 'red'}>
                {userData.status === 'active' ? '活跃' : '禁用'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="所属部门">{userData.department}</Descriptions.Item>
            <Descriptions.Item label="职位">{userData.position}</Descriptions.Item>
            <Descriptions.Item label="入职日期">{userData.joinDate}</Descriptions.Item>
            <Descriptions.Item label="最后登录">{userData.lastLogin}</Descriptions.Item>
            <Descriptions.Item label="个人简介" span={2}>
              {userData.description}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* 操作历史 */}
        <Card title="最近操作">
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b">
              <div>
                <div className="font-medium">登录系统</div>
                <div className="text-sm text-gray-500">2024-01-15 14:30:00</div>
              </div>
              <Tag color="green">成功</Tag>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <div>
                <div className="font-medium">修改个人信息</div>
                <div className="text-sm text-gray-500">2024-01-14 10:20:00</div>
              </div>
              <Tag color="blue">完成</Tag>
            </div>
            <div className="flex justify-between items-center py-2">
              <div>
                <div className="font-medium">创建用户账户</div>
                <div className="text-sm text-gray-500">2023-01-15 09:00:00</div>
              </div>
              <Tag color="green">成功</Tag>
            </div>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
};

export default UserDetailPage;
