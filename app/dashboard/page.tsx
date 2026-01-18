'use client';

import React from 'react';
import { Row, Col, Card, Progress } from 'antd';
import { 
  UserOutlined, 
  ShoppingCartOutlined, 
  DollarOutlined,
  EyeOutlined 
} from '@ant-design/icons';
import { MainLayout } from '@/components/layouts/MainLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { StatsCard } from '@/components/common/StatsCard';

export default function Dashboard() {
  const statsData = [
    {
      title: '总用户数',
      value: 12580,
      prefix: <UserOutlined />,
      trend: { value: 12.5, isPositive: true }
    },
    {
      title: '总订单数',
      value: 3456,
      prefix: <ShoppingCartOutlined />,
      trend: { value: 8.2, isPositive: true }
    },
    {
      title: '总收入',
      value: 125680,
      prefix: <DollarOutlined />,
      suffix: '元',
      trend: { value: 15.3, isPositive: true }
    },
    {
      title: '页面浏览量',
      value: 89234,
      prefix: <EyeOutlined />,
      trend: { value: 3.1, isPositive: false }
    }
  ];

  const recentActivities = [
    { id: 1, action: '用户注册', user: '张三', time: '2分钟前' },
    { id: 2, action: '新订单', user: '李四', time: '5分钟前' },
    { id: 3, action: '商品上架', user: '王五', time: '10分钟前' },
    { id: 4, action: '用户登录', user: '赵六', time: '15分钟前' },
  ];

  return (
    <MainLayout>
      <PageHeader 
        title="仪表盘" 
        subtitle="欢迎回来，这里是您的数据概览"
      />
      
      {/* 统计卡片 */}
      <Row gutter={[24, 24]} className="mb-8">
        {statsData.map((stat, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <StatsCard {...stat} />
          </Col>
        ))}
      </Row>

      <Row gutter={[24, 24]}>
        {/* 销售趋势 */}
        <Col xs={24} lg={16}>
          <Card
            title={
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="font-semibold">销售趋势</span>
              </div>
            }
            className="h-96"
            extra={
              <div className="flex space-x-2">
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">本月</span>
                <span className="text-xs text-slate-500 px-2 py-1 rounded">上月</span>
              </div>
            }
          >
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <p className="text-slate-600 text-sm">这里可以放置图表组件</p>
                <p className="text-slate-400 text-xs">(如 Chart.js, ECharts 等)</p>
              </div>
            </div>
          </Card>
        </Col>

        {/* 最近活动 */}
        <Col xs={24} lg={8}>
          <Card
            title={
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="font-semibold">最近活动</span>
              </div>
            }
            className="h-96"
            extra={
              <span className="text-xs text-blue-600 cursor-pointer hover:text-blue-700">查看全部</span>
            }
          >
            <div className="space-y-4 max-h-80 overflow-y-auto">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="w-8 h-8 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center flex-shrink-0">
                    <div className="w-2 h-2 bg-slate-500 rounded-full"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-800 text-sm">{activity.action}</div>
                    <div className="text-sm text-slate-500">{activity.user}</div>
                    <div className="text-xs text-slate-400 mt-1">{activity.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]} className="mt-8">
        {/* 系统状态 */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span className="font-semibold">系统状态</span>
              </div>
            }
            extra={
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            }
          >
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm font-medium text-slate-700">CPU 使用率</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-800">45%</span>
                </div>
                <Progress
                  percent={45}
                  status="active"
                  strokeColor={{
                    '0%': '#3b82f6',
                    '100%': '#1d4ed8',
                  }}
                  trailColor="#f1f5f9"
                  size={8}
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-slate-700">内存使用率</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-800">67%</span>
                </div>
                <Progress
                  percent={67}
                  status="active"
                  strokeColor={{
                    '0%': '#10b981',
                    '100%': '#059669',
                  }}
                  trailColor="#f1f5f9"
                  size={8}
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    <span className="text-sm font-medium text-slate-700">磁盘使用率</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-800">23%</span>
                </div>
                <Progress
                  percent={23}
                  status="active"
                  strokeColor={{
                    '0%': '#8b5cf6',
                    '100%': '#7c3aed',
                  }}
                  trailColor="#f1f5f9"
                  size={8}
                />
              </div>
            </div>
          </Card>
        </Col>

        {/* 快速操作 */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="font-semibold">快速操作</span>
              </div>
            }
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="group p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105">
                <div className="text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                    <UserOutlined className="text-xl text-white" />
                  </div>
                  <div className="text-sm font-medium text-slate-700">添加用户</div>
                </div>
              </div>
              <div className="group p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105">
                <div className="text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                    <ShoppingCartOutlined className="text-xl text-white" />
                  </div>
                  <div className="text-sm font-medium text-slate-700">新建订单</div>
                </div>
              </div>
              <div className="group p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105">
                <div className="text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                    <DollarOutlined className="text-xl text-white" />
                  </div>
                  <div className="text-sm font-medium text-slate-700">财务报表</div>
                </div>
              </div>
              <div className="group p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105">
                <div className="text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                    <EyeOutlined className="text-xl text-white" />
                  </div>
                  <div className="text-sm font-medium text-slate-700">数据分析</div>
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </MainLayout>
  );
}
