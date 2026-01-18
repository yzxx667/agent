'use client';

import React, { useMemo } from 'react';
import { Layout, Menu } from 'antd';
import { usePathname, useRouter } from 'next/navigation';
import {
  DashboardOutlined,
  UserOutlined,
  RobotOutlined,
  ApartmentOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import SimpleMenu from './SimpleMenu';

const { Sider } = Layout;

interface SidebarProps {
  collapsed: boolean;
}

type MenuItem = Required<MenuProps>['items'][number];

const Sidebar: React.FC<SidebarProps> = ({ collapsed }) => {
  const pathname = usePathname();
  const router = useRouter();

  // 暂时移除预加载，专注解决点击问题

  const menuItems: MenuItem[] = useMemo(() => [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '仪表盘',
    },
    {
      key: '/agent/list',
      icon: <RobotOutlined />,
      label: '智能体',
    },
     {
      key: '/workflow/list',
      icon: <ApartmentOutlined />,
      label: '工作流',
    },
    {
      key: 'users-group', // 改为非路径的 key，避免冲突
      icon: <UserOutlined />,
      label: '用户管理',
      children: [
        {
          key: '/users/list',
          label: '用户列表',
        },
        {
          key: '/users/roles',
          label: '角色管理',
        },
      ],
    },
  ], []);

  const handleMenuClick: MenuProps['onClick'] = (e) => {
    const { key } = e;
    router.push(key);
  };

  // 使用状态管理展开的菜单
  const [openKeys, setOpenKeys] = React.useState<string[]>(['users-group']);

  const handleOpenChange = (keys: string[]) => {
    setOpenKeys(keys);
  };



  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      className="fixed left-0 top-0 bottom-0 z-20"
      width={256}
      collapsedWidth={80}
    >
      {/* Logo 区域 */}
      <div className="h-16 flex items-center justify-center border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">A</span>
          </div>
          {!collapsed && (
            <div className="text-gray-800 font-semibold text-lg tracking-wide">
              Admin Pro
            </div>
          )}
        </div>
      </div>

      {/* 菜单区域 */}
      <div className="py-2">
        {/* 可以选择使用简单菜单或 Antd 菜单 */}
        {false ? (
          <SimpleMenu collapsed={collapsed} />
        ) : (
          <Menu
            mode="inline"
            selectedKeys={[pathname]}
            openKeys={openKeys}
            onOpenChange={handleOpenChange}
            items={menuItems}
            onClick={handleMenuClick}
            className="border-r-0"
            inlineIndent={20}
          />
        )}
      </div>
    </Sider>
  );
};

export default Sidebar;
