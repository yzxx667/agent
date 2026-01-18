
'use client';

import React from 'react';
import { MainLayout } from '@/components/layouts/MainLayout';
import { PageHeader } from '@/components/common/PageHeader';

const AgentList = () => {
  const breadcrumbs = [
    { title: '智能体管理' },
    { title: '智能体列表' },
  ];

  return (
    <MainLayout>
      <PageHeader
        title="智能体列表"
        subtitle="管理和配置智能体"
        breadcrumbs={breadcrumbs}
      />
      <div>Agent List Content</div>
    </MainLayout>
  );
};

export default AgentList;
