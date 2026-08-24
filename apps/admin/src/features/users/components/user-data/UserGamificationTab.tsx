import { Alert, Card, Space, Table, Tabs } from 'antd';
import { useState } from 'react';
import type { UserDataPageQueriesResult } from '../../hooks/useUserDataPageQueries';
import { formatDateTime } from './formatters';

type GamificationSubTabKey = 'xp-events' | 'badges' | 'milestones';

interface UserGamificationTabProps {
  data: Pick<
    UserDataPageQueriesResult,
    | 'xpEventsQuery'
    | 'badgesQuery'
    | 'milestonesQuery'
    | 'xpEventsPage'
    | 'xpEventsPageSize'
    | 'setXpEventsPage'
    | 'setXpEventsPageSize'
    | 'badgesPage'
    | 'badgesPageSize'
    | 'setBadgesPage'
    | 'setBadgesPageSize'
    | 'milestonesPage'
    | 'milestonesPageSize'
    | 'setMilestonesPage'
    | 'setMilestonesPageSize'
  >;
}

export function UserGamificationTab({ data }: UserGamificationTabProps) {
  const {
    xpEventsQuery,
    badgesQuery,
    milestonesQuery,
    xpEventsPage,
    xpEventsPageSize,
    setXpEventsPage,
    setXpEventsPageSize,
    badgesPage,
    badgesPageSize,
    setBadgesPage,
    setBadgesPageSize,
    milestonesPage,
    milestonesPageSize,
    setMilestonesPage,
    setMilestonesPageSize,
  } = data;
  const [activeSubTab, setActiveSubTab] = useState<GamificationSubTabKey>('xp-events');

  return (
    <Space direction='vertical' size={16} style={{ width: '100%' }}>
      {(xpEventsQuery.isError || badgesQuery.isError || milestonesQuery.isError) ? (
        <Alert type='error' showIcon message='Failed to load gamification data.' />
      ) : null}
      <Tabs
        activeKey={activeSubTab}
        onChange={(key) => setActiveSubTab(key as GamificationSubTabKey)}
        items={[
          {
            key: 'xp-events',
            label: 'XP Events',
            children: (
              <Card title='XP Events'>
                <Table
                  rowKey='id'
                  loading={xpEventsQuery.isLoading && !xpEventsQuery.data}
                  dataSource={xpEventsQuery.data?.data ?? []}
                  pagination={{
                    current: xpEventsQuery.data?.pagination.pageNumber ?? xpEventsPage,
                    pageSize: xpEventsQuery.data?.pagination.pageSize ?? xpEventsPageSize,
                    total: xpEventsQuery.data?.pagination.totalCount ?? 0,
                    showSizeChanger: true,
                  }}
                  onChange={(pagination) => {
                    setXpEventsPage(pagination.current || 1);
                    setXpEventsPageSize(pagination.pageSize || 10);
                  }}
                  columns={[
                    { title: 'Source Type', dataIndex: 'sourceType' },
                    { title: 'Source Id', dataIndex: 'sourceId' },
                    { title: 'XP', dataIndex: 'xpAmount', width: 90 },
                    { title: 'Created', dataIndex: 'createdAt', render: (v) => formatDateTime(v), width: 160 },
                  ]}
                />
              </Card>
            ),
          },
          {
            key: 'badges',
            label: 'Badges',
            children: (
              <Card title='Badges'>
                <Table
                  rowKey='userBadgeId'
                  loading={badgesQuery.isLoading && !badgesQuery.data}
                  dataSource={badgesQuery.data?.data ?? []}
                  pagination={{
                    current: badgesQuery.data?.pagination.pageNumber ?? badgesPage,
                    pageSize: badgesQuery.data?.pagination.pageSize ?? badgesPageSize,
                    total: badgesQuery.data?.pagination.totalCount ?? 0,
                    showSizeChanger: true,
                  }}
                  onChange={(pagination) => {
                    setBadgesPage(pagination.current || 1);
                    setBadgesPageSize(pagination.pageSize || 10);
                  }}
                  columns={[
                    { title: 'Name', dataIndex: 'name' },
                    { title: 'Key', dataIndex: 'key' },
                    { title: 'Rarity', dataIndex: 'rarity', width: 120 },
                    { title: 'Earned At', dataIndex: 'earnedAt', render: (v) => formatDateTime(v), width: 160 },
                  ]}
                />
              </Card>
            ),
          },
          {
            key: 'milestones',
            label: 'Milestones',
            children: (
              <Card title='Milestones'>
                <Table
                  rowKey='userMilestoneId'
                  loading={milestonesQuery.isLoading && !milestonesQuery.data}
                  dataSource={milestonesQuery.data?.data ?? []}
                  pagination={{
                    current: milestonesQuery.data?.pagination.pageNumber ?? milestonesPage,
                    pageSize: milestonesQuery.data?.pagination.pageSize ?? milestonesPageSize,
                    total: milestonesQuery.data?.pagination.totalCount ?? 0,
                    showSizeChanger: true,
                  }}
                  onChange={(pagination) => {
                    setMilestonesPage(pagination.current || 1);
                    setMilestonesPageSize(pagination.pageSize || 10);
                  }}
                  columns={[
                    { title: 'Title', dataIndex: 'title' },
                    { title: 'Key', dataIndex: 'key' },
                    { title: 'Condition', render: (_, row) => `${row.conditionType}:${row.conditionValue}` },
                    { title: 'Achieved At', dataIndex: 'achievedAt', render: (v) => formatDateTime(v), width: 160 },
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
