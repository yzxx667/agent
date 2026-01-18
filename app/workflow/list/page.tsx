
'use client';

import React from 'react';
import { MainLayout } from '@/components/layouts/MainLayout';
import { PageHeader } from '@/components/common/PageHeader';

const WorkflowList = () => {
  const breadcrumbs = [
    { title: '工作流管理' },
    { title: '工作流列表' },
  ];

  return (
    <MainLayout>
      <PageHeader
        title="工作流列表"
        subtitle="管理和配置工作流"
        breadcrumbs={breadcrumbs}
      />
      <div>Workflow List Content</div>
    </MainLayout>
  );
};

export default WorkflowList;
