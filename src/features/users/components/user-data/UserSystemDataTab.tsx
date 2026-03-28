import { Alert, Card, Space, Table, Tabs, Typography } from 'antd';
import { useState } from 'react';
import type { UserDataPageQueriesResult } from '../../hooks/useUserDataPageQueries';
import { formatDateTime } from './formatters';

type SystemSubTabKey = 'subscriptions' | 'notifications';

interface UserSystemDataTabProps {
  data: Pick<
    UserDataPageQueriesResult,
    | 'subscriptionsQuery'
    | 'notificationsQuery'
    | 'subscriptionsPage'
    | 'subscriptionsPageSize'
    | 'setSubscriptionsPage'
    | 'setSubscriptionsPageSize'
    | 'notificationsPage'
    | 'notificationsPageSize'
    | 'setNotificationsPage'
    | 'setNotificationsPageSize'
  >;
}

export function UserSystemDataTab({ data }: UserSystemDataTabProps) {
  const {
    subscriptionsQuery,
    notificationsQuery,
    subscriptionsPage,
    subscriptionsPageSize,
    setSubscriptionsPage,
    setSubscriptionsPageSize,
    notificationsPage,
    notificationsPageSize,
    setNotificationsPage,
    setNotificationsPageSize,
  } = data;
  const [activeSubTab, setActiveSubTab] = useState<SystemSubTabKey>('subscriptions');

  return (
    <Space direction='vertical' size={16} style={{ width: '100%' }}>
      {(notificationsQuery.isError || subscriptionsQuery.isError) ? (
        <Alert type='error' showIcon message='Failed to load system data.' />
      ) : null}
      <Tabs
        activeKey={activeSubTab}
        onChange={(key) => setActiveSubTab(key as SystemSubTabKey)}
        items={[
          {
            key: 'subscriptions',
            label: 'Subscriptions',
            children: (
              <Card title='Subscriptions'>
                <Table
                  rowKey='id'
                  loading={subscriptionsQuery.isLoading && !subscriptionsQuery.data}
                  dataSource={subscriptionsQuery.data?.data ?? []}
                  locale={{ emptyText: 'No subscriptions' }}
                  pagination={{
                    current: subscriptionsQuery.data?.pagination.pageNumber ?? subscriptionsPage,
                    pageSize: subscriptionsQuery.data?.pagination.pageSize ?? subscriptionsPageSize,
                    total: subscriptionsQuery.data?.pagination.totalCount ?? 0,
                    showSizeChanger: true,
                  }}
                  onChange={(pagination) => {
                    setSubscriptionsPage(pagination.current || 1);
                    setSubscriptionsPageSize(pagination.pageSize || 10);
                  }}
                  columns={[
                    { title: 'Provider', dataIndex: 'provider' },
                    { title: 'Plan', dataIndex: 'planId' },
                    { title: 'Status', dataIndex: 'status' },
                    { title: 'Started', dataIndex: 'startedAt', render: (v) => formatDateTime(v), width: 160 },
                    { title: 'Expires', dataIndex: 'expiresAt', render: (v) => formatDateTime(v), width: 160 },
                  ]}
                />
              </Card>
            ),
          },
          {
            key: 'notifications',
            label: 'Notifications',
            children: (
              <Card title='Notifications'>
                <Table
                  rowKey='id'
                  loading={notificationsQuery.isLoading && !notificationsQuery.data}
                  dataSource={notificationsQuery.data?.data ?? []}
                  locale={{ emptyText: 'No notifications' }}
                  pagination={{
                    current: notificationsQuery.data?.pagination.pageNumber ?? notificationsPage,
                    pageSize: notificationsQuery.data?.pagination.pageSize ?? notificationsPageSize,
                    total: notificationsQuery.data?.pagination.totalCount ?? 0,
                    showSizeChanger: true,
                  }}
                  onChange={(pagination) => {
                    setNotificationsPage(pagination.current || 1);
                    setNotificationsPageSize(pagination.pageSize || 10);
                  }}
                  columns={[
                    { title: 'Type', dataIndex: 'type', width: 140 },
                    { title: 'Title', dataIndex: 'title' },
                    {
                      title: 'Flags',
                      render: (_, row) => (
                        <Typography.Text type='secondary'>
                          {row.isRead ? 'Read' : 'Unread'} / {row.isDismissed ? 'Dismissed' : 'Active'}
                        </Typography.Text>
                      ),
                      width: 170,
                    },
                    { title: 'Created', dataIndex: 'createdAt', render: (v) => formatDateTime(v), width: 160 },
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
