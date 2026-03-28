import { Alert, Card, Space, Table, Tabs, Tag } from 'antd';
import { useState } from 'react';
import type { UserDataPageQueriesResult } from '../../hooks/useUserDataPageQueries';
import { formatDateTime } from './formatters';

type LearningSubTabKey = 'lesson-progress' | 'review-schedules';

interface UserLearningTabProps {
  data: Pick<
    UserDataPageQueriesResult,
    'progressesQuery' | 'reviewSchedules' | 'progressesPage' | 'progressesPageSize' | 'setProgressesPage' | 'setProgressesPageSize'
  >;
}

export function UserLearningTab({ data }: UserLearningTabProps) {
  const {
    progressesQuery,
    reviewSchedules,
    progressesPage,
    progressesPageSize,
    setProgressesPage,
    setProgressesPageSize,
  } = data;
  const [activeSubTab, setActiveSubTab] = useState<LearningSubTabKey>('lesson-progress');

  return (
    <Space direction='vertical' size={16} style={{ width: '100%' }}>
      {progressesQuery.isError ? <Alert type='error' showIcon message='Failed to load learning data.' /> : null}
      <Tabs
        activeKey={activeSubTab}
        onChange={(key) => setActiveSubTab(key as LearningSubTabKey)}
        items={[
          {
            key: 'lesson-progress',
            label: 'Lesson Progress',
            children: (
              <Card title='Lesson Progress'>
                <Table
                  rowKey='id'
                  loading={progressesQuery.isLoading && !progressesQuery.data}
                  dataSource={progressesQuery.data?.data ?? []}
                  pagination={{
                    current: progressesQuery.data?.pagination.pageNumber ?? progressesPage,
                    pageSize: progressesQuery.data?.pagination.pageSize ?? progressesPageSize,
                    total: progressesQuery.data?.pagination.totalCount ?? 0,
                    showSizeChanger: true,
                  }}
                  onChange={(pagination) => {
                    setProgressesPage(pagination.current || 1);
                    setProgressesPageSize(pagination.pageSize || 10);
                  }}
                  columns={[
                    { title: 'Lesson', dataIndex: 'lessonTitle' },
                    { title: 'Mastery', dataIndex: 'masteryLevel', width: 110 },
                    { title: 'Reviews', dataIndex: 'totalReviews', width: 90 },
                    { title: 'XP Earned', dataIndex: 'xpEarned', width: 100 },
                    { title: 'Last Review', dataIndex: 'lastReviewDate', render: (v) => formatDateTime(v), width: 160 },
                  ]}
                />
              </Card>
            ),
          },
          {
            key: 'review-schedules',
            label: 'Review Schedules',
            children: (
              <Card title='Review Schedules'>
                <Table
                  rowKey='id'
                  pagination={{ pageSize: 10 }}
                  dataSource={reviewSchedules}
                  columns={[
                    { title: 'Lesson', dataIndex: 'lessonTitle' },
                    { title: 'Round', dataIndex: 'reviewRound', width: 80 },
                    { title: 'Due', dataIndex: 'dueDate', render: (v) => formatDateTime(v), width: 160 },
                    {
                      title: 'Status',
                      render: (_, row) => (
                        <Tag color={row.completed ? 'green' : 'orange'}>{row.completed ? 'Completed' : 'Pending'}</Tag>
                      ),
                      width: 110,
                    },
                  ]}
                />
              </Card>
            ),
          },
        ]}
      />
    </Space>
  );
}
