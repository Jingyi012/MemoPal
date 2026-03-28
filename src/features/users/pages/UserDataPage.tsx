import { ArrowLeftOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Space, Spin, Tabs } from 'antd';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PortalPageContainer } from '../../../components/PortalPageContainer';
import { adminPaths } from '../../../navigation/adminPaths';
import { UserContentTab } from '../components/user-data/UserContentTab';
import { UserGamificationTab } from '../components/user-data/UserGamificationTab';
import { UserLearningTab } from '../components/user-data/UserLearningTab';
import { UserOverviewTab } from '../components/user-data/UserOverviewTab';
import { UserSystemDataTab } from '../components/user-data/UserSystemDataTab';
import { useUserDataPageQueries } from '../hooks/useUserDataPageQueries';
import type { UserDataTabKey } from '../hooks/useUserDataPageQueries';

export default function UserDataPage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<UserDataTabKey>('overview');
  const {
    overviewQuery,
    progressesQuery,
    xpEventsQuery,
    badgesQuery,
    milestonesQuery,
    subscriptionsQuery,
    notificationsQuery,
    reviewSchedules,
    progressesPage,
    progressesPageSize,
    setProgressesPage,
    setProgressesPageSize,
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
    subscriptionsPage,
    subscriptionsPageSize,
    setSubscriptionsPage,
    setSubscriptionsPageSize,
    notificationsPage,
    notificationsPageSize,
    setNotificationsPage,
    setNotificationsPageSize,
  } = useUserDataPageQueries(userId, activeTab);

  const overview = overviewQuery.data;

  if (!userId) {
    return <Alert type='error' message='Missing user id.' />;
  }

  if (overviewQuery.isLoading) {
    return (
      <Card>
        <Spin />
      </Card>
    );
  }

  if (overviewQuery.isError || !overview) {
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

        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key as UserDataTabKey)}
          items={[
            {
              key: 'overview',
              label: 'Overview',
              children: <UserOverviewTab overview={overview} />,
            },
            {
              key: 'content',
              label: 'Content',
              children: <UserContentTab userId={userId} active={activeTab === 'content'} />,
            },
            {
              key: 'learning',
              label: 'Learning Progress',
              children: (
                <UserLearningTab
                  data={{
                    progressesQuery,
                    reviewSchedules,
                    progressesPage,
                    progressesPageSize,
                    setProgressesPage,
                    setProgressesPageSize,
                  }}
                />
              ),
            },
            {
              key: 'gamification',
              label: 'Gamification',
              children: (
                <UserGamificationTab
                  data={{
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
                  }}
                />
              ),
            },
            {
              key: 'system',
              label: 'System Data',
              children: (
                <UserSystemDataTab
                  data={{
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
                  }}
                />
              ),
            },
          ]}
        />
      </Space>
    </PortalPageContainer>
  );
}
