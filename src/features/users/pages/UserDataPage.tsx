import { ArrowLeftOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { Alert, Button, Card, Col, Descriptions, Row, Space, Spin, Statistic, Table, Tabs, Tag, Typography } from 'antd';
import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { adminUsersApi } from '../../../api/adminUsersApi';
import { PortalPageContainer } from '../../../components/PortalPageContainer';
import { adminPaths } from '../../../navigation/adminPaths';

function formatDateTime(value?: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

export default function UserDataPage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  const query = useQuery({
    queryKey: ['admin-user-data', userId],
    queryFn: () => adminUsersApi.getUserData(userId!),
    enabled: !!userId,
  });

  const data = query.data;

  const locations = useMemo(
    () =>
      (data?.palaces ?? []).flatMap((palace) =>
        palace.locations.map((location) => ({
          ...location,
          palaceName: palace.name,
        }))
      ),
    [data?.palaces]
  );

  const words = useMemo(
    () =>
      (data?.lessons ?? []).flatMap((lesson) =>
        lesson.words.map((word) => ({
          ...word,
          lessonTitle: lesson.title,
        }))
      ),
    [data?.lessons]
  );

  const reviewSchedules = useMemo(
    () =>
      (data?.progresses ?? []).flatMap((progress) =>
        progress.reviewSchedules.map((schedule) => ({
          ...schedule,
          lessonTitle: progress.lessonTitle,
        }))
      ),
    [data?.progresses]
  );

  if (!userId) {
    return <Alert type='error' message='Missing user id.' />;
  }

  if (query.isLoading) {
    return (
      <Card>
        <Spin />
      </Card>
    );
  }

  if (query.isError || !data) {
    return <Alert type='error' message='Failed to load user data.' />;
  }

  return (
    <PortalPageContainer>
      <Space direction='vertical' size={16} style={{ width: '100%' }}>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate(adminPaths.users)}
        style={{ width: 'fit-content' }}
      >
        Back to Users
      </Button>

      <Card title='User Data Explorer'>
        <Descriptions column={2} size='small'>
          <Descriptions.Item label='Name'>{data.user.displayName}</Descriptions.Item>
          <Descriptions.Item label='Email'>{data.user.email}</Descriptions.Item>
          <Descriptions.Item label='Role'>{data.user.role}</Descriptions.Item>
          <Descriptions.Item label='Premium'>
            <Tag color={data.user.isPremium ? 'green' : 'default'}>{data.user.isPremium ? 'Yes' : 'No'}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label='Created At'>{formatDateTime(data.user.createdAt)}</Descriptions.Item>
          <Descriptions.Item label='Updated At'>{formatDateTime(data.user.updatedAt)}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Row gutter={12}>
        <Col span={4}>
          <Card>
            <Statistic title='Palaces' value={data.palaces.length} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title='Lessons' value={data.lessons.length} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title='Words' value={words.length} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title='XP Events' value={data.xpEvents.length} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title='Badges' value={data.badges.length} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title='Milestones' value={data.milestones.length} />
          </Card>
        </Col>
      </Row>

      {data.stats ? (
        <Card title='User Stats'>
          <Row gutter={12}>
            <Col span={6}>
              <Statistic title='Lessons Completed' value={data.stats.lessonsCompleted} />
            </Col>
            <Col span={6}>
              <Statistic title='Words Learned' value={data.stats.wordsLearned} />
            </Col>
            <Col span={6}>
              <Statistic title='Current Streak' value={data.stats.currentStreak} />
            </Col>
            <Col span={6}>
              <Statistic title='Longest Streak' value={data.stats.longestStreak} />
            </Col>
          </Row>
        </Card>
      ) : null}

      <Tabs
        defaultActiveKey='content'
        items={[
          {
            key: 'content',
            label: 'Content',
            children: (
              <Space direction='vertical' size={16} style={{ width: '100%' }}>
                <Card title='Palaces'>
                  <Table
                    rowKey='id'
                    pagination={false}
                    dataSource={data.palaces}
                    columns={[
                      { title: 'Name', dataIndex: 'name' },
                      { title: 'Required XP', dataIndex: 'requiredXp', width: 110 },
                      { title: 'Locations', render: (_, row) => row.locations.length, width: 100 },
                      { title: 'Updated', dataIndex: 'updatedAt', render: (v) => formatDateTime(v), width: 160 },
                    ]}
                  />
                </Card>
                <Card title='Locations'>
                  <Table
                    rowKey='id'
                    pagination={{ pageSize: 10 }}
                    dataSource={locations}
                    columns={[
                      { title: 'Palace', dataIndex: 'palaceName' },
                      { title: 'Position', dataIndex: 'position', width: 90 },
                      { title: 'Name', dataIndex: 'name' },
                      { title: 'Updated', dataIndex: 'updatedAt', render: (v) => formatDateTime(v), width: 160 },
                    ]}
                  />
                </Card>
                <Card title='Lessons'>
                  <Table
                    rowKey='id'
                    pagination={false}
                    dataSource={data.lessons}
                    columns={[
                      { title: 'Title', dataIndex: 'title' },
                      { title: 'Word Count', dataIndex: 'wordCount', width: 120 },
                      { title: 'Category', dataIndex: 'category', width: 120 },
                      { title: 'Updated', dataIndex: 'updatedAt', render: (v) => formatDateTime(v), width: 160 },
                    ]}
                  />
                </Card>
                <Card title='Words'>
                  <Table
                    rowKey='id'
                    pagination={{ pageSize: 10 }}
                    dataSource={words}
                    columns={[
                      { title: 'Lesson', dataIndex: 'lessonTitle' },
                      { title: 'Word', dataIndex: 'text' },
                      { title: 'Meaning', dataIndex: 'meaning' },
                      { title: 'Updated', dataIndex: 'updatedAt', render: (v) => formatDateTime(v), width: 160 },
                    ]}
                  />
                </Card>
              </Space>
            ),
          },
          {
            key: 'learning',
            label: 'Learning Progress',
            children: (
              <Space direction='vertical' size={16} style={{ width: '100%' }}>
                <Card title='Lesson Progress'>
                  <Table
                    rowKey='id'
                    pagination={false}
                    dataSource={data.progresses}
                    columns={[
                      { title: 'Lesson', dataIndex: 'lessonTitle' },
                      { title: 'Mastery', dataIndex: 'masteryLevel', width: 110 },
                      { title: 'Reviews', dataIndex: 'totalReviews', width: 90 },
                      { title: 'XP Earned', dataIndex: 'xpEarned', width: 100 },
                      { title: 'Last Review', dataIndex: 'lastReviewDate', render: (v) => formatDateTime(v), width: 160 },
                    ]}
                  />
                </Card>
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
              </Space>
            ),
          },
          {
            key: 'gamification',
            label: 'Gamification',
            children: (
              <Space direction='vertical' size={16} style={{ width: '100%' }}>
                <Card title='XP Events'>
                  <Table
                    rowKey='id'
                    pagination={{ pageSize: 10 }}
                    dataSource={data.xpEvents}
                    columns={[
                      { title: 'Source Type', dataIndex: 'sourceType' },
                      { title: 'Source Id', dataIndex: 'sourceId' },
                      { title: 'XP', dataIndex: 'xpAmount', width: 90 },
                      { title: 'Created', dataIndex: 'createdAt', render: (v) => formatDateTime(v), width: 160 },
                    ]}
                  />
                </Card>
                <Card title='Badges'>
                  <Table
                    rowKey='userBadgeId'
                    pagination={false}
                    dataSource={data.badges}
                    columns={[
                      { title: 'Name', dataIndex: 'name' },
                      { title: 'Key', dataIndex: 'key' },
                      { title: 'Rarity', dataIndex: 'rarity', width: 120 },
                      { title: 'Earned At', dataIndex: 'earnedAt', render: (v) => formatDateTime(v), width: 160 },
                    ]}
                  />
                </Card>
                <Card title='Milestones'>
                  <Table
                    rowKey='userMilestoneId'
                    pagination={false}
                    dataSource={data.milestones}
                    columns={[
                      { title: 'Title', dataIndex: 'title' },
                      { title: 'Key', dataIndex: 'key' },
                      { title: 'Condition', render: (_, row) => `${row.conditionType}:${row.conditionValue}` },
                      { title: 'Achieved At', dataIndex: 'achievedAt', render: (v) => formatDateTime(v), width: 160 },
                    ]}
                  />
                </Card>
              </Space>
            ),
          },
          {
            key: 'system',
            label: 'System Data',
            children: (
              <Space direction='vertical' size={16} style={{ width: '100%' }}>
                <Card title='Subscriptions'>
                  <Table
                    rowKey='id'
                    pagination={false}
                    dataSource={data.subscriptions}
                    locale={{ emptyText: 'No subscriptions' }}
                    columns={[
                      { title: 'Provider', dataIndex: 'provider' },
                      { title: 'Plan', dataIndex: 'planId' },
                      { title: 'Status', dataIndex: 'status' },
                      { title: 'Started', dataIndex: 'startedAt', render: (v) => formatDateTime(v), width: 160 },
                      { title: 'Expires', dataIndex: 'expiresAt', render: (v) => formatDateTime(v), width: 160 },
                    ]}
                  />
                </Card>
                <Card title='Notifications'>
                  <Table
                    rowKey='id'
                    pagination={{ pageSize: 10 }}
                    dataSource={data.notifications}
                    locale={{ emptyText: 'No notifications' }}
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
              </Space>
            ),
          },
        ]}
      />
      </Space>
    </PortalPageContainer>
  );
}

