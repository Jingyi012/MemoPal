import { Alert, Button, Card, Empty, Space, Table, Tag } from 'antd';
import { useNavigate } from 'react-router-dom';
import { adminPaths } from '../../../../navigation/adminPaths';
import type { ManagedUserLessonProgressDataDto } from '../../../../types/user';
import type { UserDataPageQueriesResult } from '../../hooks/useUserDataPageQueries';
import type { ContentSubTabKey } from '../../hooks/useUserContentTabData';
import { formatDateTime } from './formatters';

interface UserLearningTabProps {
  onOpenContentPalace: (payload: { palaceId: string; subTab: ContentSubTabKey }) => void;
  data: Pick<
    UserDataPageQueriesResult,
    'progressesQuery' | 'progressesPage' | 'progressesPageSize' | 'setProgressesPage' | 'setProgressesPageSize'
  >;
}

function resolveNextDueDate(progress: ManagedUserLessonProgressDataDto): string | null {
  const nextPending = [...progress.reviewSchedules]
    .filter((schedule) => !schedule.completed)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];
  return nextPending?.dueDate ?? null;
}

function shouldOpenInsideUserContent(progress: ManagedUserLessonProgressDataDto): boolean {
  return progress.palaceIsCustom || progress.lessonIsCustom;
}

function resolveUserContentSubTab(progress: ManagedUserLessonProgressDataDto): ContentSubTabKey {
  return progress.palaceIsCustom ? 'custom-palaces' : 'predefined-palaces';
}

export function UserLearningTab({ onOpenContentPalace, data }: UserLearningTabProps) {
  const navigate = useNavigate();
  const { progressesQuery, progressesPage, progressesPageSize, setProgressesPage, setProgressesPageSize } = data;

  return (
    <Space direction='vertical' size={16} style={{ width: '100%' }}>
      {progressesQuery.isError ? <Alert type='error' showIcon message='Failed to load learning data.' /> : null}

      <Card title='Lesson Progress (expand row to view review schedules)'>
        <Table<ManagedUserLessonProgressDataDto>
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
          expandable={{
            rowExpandable: (record) => (record.reviewSchedules?.length ?? 0) > 0,
            expandedRowRender: (record) => {
              if (!record.reviewSchedules.length) {
                return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description='No review schedules.' />;
              }

              const scheduleRows = [...record.reviewSchedules].sort(
                (a, b) => a.reviewRound - b.reviewRound || new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
              );

              return (
                <Table
                  size='small'
                  rowKey='id'
                  pagination={false}
                  dataSource={scheduleRows}
                  columns={[
                    { title: 'Round', dataIndex: 'reviewRound', width: 90 },
                    { title: 'Due Date', dataIndex: 'dueDate', render: (value) => formatDateTime(value), width: 170 },
                    {
                      title: 'Status',
                      width: 120,
                      render: (_, row) => (
                        <Tag color={row.completed ? 'green' : 'orange'}>{row.completed ? 'Completed' : 'Pending'}</Tag>
                      ),
                    },
                    {
                      title: 'Completed At',
                      dataIndex: 'completedDate',
                      render: (value) => formatDateTime(value),
                      width: 170,
                    },
                  ]}
                />
              );
            },
          }}
          columns={[
            {
              title: 'Palace',
              dataIndex: 'palaceName',
              render: (_, row) =>
                row.palaceId ? (
                  <Button
                    type='link'
                    style={{ paddingInline: 0 }}
                    onClick={() => {
                      if (shouldOpenInsideUserContent(row)) {
                        onOpenContentPalace({ palaceId: row.palaceId, subTab: resolveUserContentSubTab(row) });
                        return;
                      }

                      navigate(adminPaths.palaceDetails(row.palaceId));
                    }}
                  >
                    {row.palaceName}
                  </Button>
                ) : (
                  row.palaceName || '-'
                ),
            },
            {
              title: 'Lesson',
              dataIndex: 'lessonTitle',
              render: (_, row) =>
                row.lessonId && row.palaceId ? (
                  <Button
                    type='link'
                    style={{ paddingInline: 0 }}
                    onClick={() => {
                      if (shouldOpenInsideUserContent(row)) {
                        onOpenContentPalace({ palaceId: row.palaceId, subTab: resolveUserContentSubTab(row) });
                        return;
                      }

                      navigate(adminPaths.lessonWords(row.palaceId, row.lessonId));
                    }}
                  >
                    {row.lessonTitle}
                  </Button>
                ) : (
                  row.lessonTitle
                ),
            },
            { title: 'Mastery', dataIndex: 'masteryLevel', width: 120 },
            { title: 'Reviews', dataIndex: 'totalReviews', width: 90 },
            { title: 'XP Earned', dataIndex: 'xpEarned', width: 100 },
            {
              title: 'Next Due',
              width: 170,
              render: (_, row) => formatDateTime(resolveNextDueDate(row)),
            },
            {
              title: 'Last Review',
              dataIndex: 'lastReviewDate',
              render: (value) => formatDateTime(value),
              width: 170,
            },
          ]}
        />
      </Card>
    </Space>
  );
}
