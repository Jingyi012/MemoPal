import { Card, Col, Descriptions, Row, Space, Statistic, Tag } from 'antd';
import type { ManagedUserDataOverviewDto } from '../../../../types/user';
import { formatDateTime } from './formatters';

interface UserOverviewTabProps {
  overview: ManagedUserDataOverviewDto;
}

export function UserOverviewTab({ overview }: UserOverviewTabProps) {
  return (
    <Space direction='vertical' size={16} style={{ width: '100%' }}>
      <Card title='User Data Explorer'>
        <Descriptions column={2} size='small'>
          <Descriptions.Item label='Name'>{overview.user.displayName}</Descriptions.Item>
          <Descriptions.Item label='Email'>{overview.user.email}</Descriptions.Item>
          <Descriptions.Item label='Role'>{overview.user.role}</Descriptions.Item>
          <Descriptions.Item label='Premium'>
            <Tag color={overview.user.isPremium ? 'green' : 'default'}>{overview.user.isPremium ? 'Yes' : 'No'}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label='Created At'>{formatDateTime(overview.user.createdAt)}</Descriptions.Item>
          <Descriptions.Item label='Updated At'>{formatDateTime(overview.user.updatedAt)}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Row gutter={12}>
        <Col span={4}>
          <Card>
            <Statistic title='Palaces' value={overview.counts.palaceCount} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title='Lessons' value={overview.counts.lessonCount} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title='Words' value={overview.counts.wordCount} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title='XP Events' value={overview.counts.xpEventCount} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title='Badges' value={overview.counts.badgeCount} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title='Milestones' value={overview.counts.milestoneCount} />
          </Card>
        </Col>
      </Row>

      {overview.stats ? (
        <Card title='User Stats'>
          <Row gutter={12}>
            <Col span={6}>
              <Statistic title='Lessons Completed' value={overview.stats.lessonsCompleted} />
            </Col>
            <Col span={6}>
              <Statistic title='Words Learned' value={overview.stats.wordsLearned} />
            </Col>
            <Col span={6}>
              <Statistic title='Current Streak' value={overview.stats.currentStreak} />
            </Col>
            <Col span={6}>
              <Statistic title='Longest Streak' value={overview.stats.longestStreak} />
            </Col>
          </Row>
        </Card>
      ) : null}
    </Space>
  );
}
