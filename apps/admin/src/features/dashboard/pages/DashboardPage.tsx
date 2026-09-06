import { AlertOutlined, CrownOutlined, FileTextOutlined, PlusOutlined, TeamOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { Alert, Button, Card, Col, Flex, Row, Skeleton, Statistic, Typography } from 'antd';
import { Link } from 'react-router-dom';
import { adminDashboardApi } from '../../../api/adminDashboardApi';
import { PortalPageContainer } from '../../../components/PortalPageContainer';
import { adminPaths } from '../../../navigation/adminPaths';

const dashboardQueryKey = ['admin-dashboard'] as const;

export default function DashboardPage() {
  const dashboard = useQuery({ queryKey: dashboardQueryKey, queryFn: adminDashboardApi.get });

  return (
    <PortalPageContainer>
      <Flex justify="space-between" align="center" wrap="wrap" gap={12} style={{ marginBottom: 20 }}>
        <div>
          <Typography.Title level={2} style={{ margin: 0 }}>Operations overview</Typography.Title>
          <Typography.Text type="secondary">Items that need attention across MemoPal.</Typography.Text>
        </div>
        <Link to={adminPaths.predefinedMemoryLessons}>
          <Button type="primary" icon={<PlusOutlined />}>Create lesson</Button>
        </Link>
      </Flex>

      {dashboard.isError ? (
        <Alert type="error" showIcon message="Could not load the operations overview."
          action={<Button onClick={() => void dashboard.refetch()}>Retry</Button>} />
      ) : dashboard.isLoading || !dashboard.data ? (
        <Card><Skeleton active /></Card>
      ) : (
        <>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} xl={6}><Card><Statistic title="Users" value={dashboard.data.totalUsers} prefix={<TeamOutlined />} suffix={<Typography.Text type="secondary">+{dashboard.data.newUsersLast7Days} / 7d</Typography.Text>} /></Card></Col>
            <Col xs={24} sm={12} xl={6}><Card><Statistic title="Premium users" value={dashboard.data.activePremiumUsers} prefix={<CrownOutlined />} /></Card></Col>
            <Col xs={24} sm={12} xl={6}><Link to={adminPaths.communityMemorySets}><Card hoverable><Statistic title="Reported sets awaiting action" value={dashboard.data.reportedCommunityMemorySets} prefix={<AlertOutlined />} valueStyle={dashboard.data.reportedCommunityMemorySets ? { color: '#cf1322' } : undefined} /></Card></Link></Col>
            <Col xs={24} sm={12} xl={6}><Link to={adminPaths.subscriptions}><Card hoverable><Statistic title="Past-due subscriptions" value={dashboard.data.pastDueSubscriptions} valueStyle={dashboard.data.pastDueSubscriptions ? { color: '#d46b08' } : undefined} /></Card></Link></Col>
          </Row>
          <Typography.Title level={4} style={{ marginTop: 24 }}>Content pipeline</Typography.Title>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}><Link to={adminPaths.predefinedMemoryLessons}><Card hoverable><Statistic title="Draft predefined lessons" value={dashboard.data.draftPredefinedLessons} prefix={<FileTextOutlined />} /></Card></Link></Col>
            <Col xs={24} md={12}><Link to={adminPaths.palaceScenes}><Card hoverable><Statistic title="Draft Palace scenes" value={dashboard.data.draftPalaceScenes} prefix={<FileTextOutlined />} /></Card></Link></Col>
          </Row>
        </>
      )}
    </PortalPageContainer>
  );
}
