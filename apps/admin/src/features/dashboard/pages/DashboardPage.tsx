import { AlertOutlined, CrownOutlined, FileTextOutlined, PlusOutlined, TeamOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { Alert, Button, Card, Col, Row, Skeleton, Statistic, Typography } from 'antd';
import { Link } from 'react-router-dom';
import { adminDashboardApi } from '../../../api/adminDashboardApi';
import { PortalPageContainer } from '../../../components/PortalPageContainer';
import { adminPaths } from '../../../navigation/adminPaths';

const dashboardQueryKey = ['admin-dashboard'] as const;

export default function DashboardPage() {
  const dashboard = useQuery({ queryKey: dashboardQueryKey, queryFn: adminDashboardApi.get });

  return (
    <PortalPageContainer
      title="Operations overview"
      eyebrow="Workspace overview"
      description="A snapshot of your community, membership and content pipeline."
      actions={<Link to={adminPaths.predefinedMemoryLessons}><Button type="primary" icon={<PlusOutlined />}>Create lesson</Button></Link>}
    >

      {dashboard.isError ? (
        <Alert type="error" showIcon message="Could not load the operations overview."
          action={<Button onClick={() => void dashboard.refetch()}>Retry</Button>} />
      ) : dashboard.isLoading || !dashboard.data ? (
        <Card><Skeleton active /></Card>
      ) : (
        <div className="portal-dashboard">
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} xl={6}><Card><Statistic title="Users" value={dashboard.data.totalUsers} prefix={<TeamOutlined />} suffix={<Typography.Text type="secondary">+{dashboard.data.newUsersLast7Days} / 7d</Typography.Text>} /></Card></Col>
            <Col xs={24} sm={12} xl={6}><Card><Statistic title="Premium users" value={dashboard.data.activePremiumUsers} prefix={<CrownOutlined />} /></Card></Col>
            <Col xs={24} sm={12} xl={6}><Link to={adminPaths.communityMemorySets}><Card hoverable><Statistic title="Reported sets awaiting action" value={dashboard.data.reportedCommunityMemorySets} prefix={<AlertOutlined />} valueStyle={dashboard.data.reportedCommunityMemorySets ? { color: '#cf1322' } : undefined} /></Card></Link></Col>
            <Col xs={24} sm={12} xl={6}><Link to={adminPaths.subscriptions}><Card hoverable><Statistic title="Past-due subscriptions" value={dashboard.data.pastDueSubscriptions} valueStyle={dashboard.data.pastDueSubscriptions ? { color: '#d46b08' } : undefined} /></Card></Link></Col>
          </Row>
          <div className="portal-dashboard-section">
            <Typography.Title level={4}>Content pipeline</Typography.Title>
            <Typography.Text type="secondary">Continue preparing the next learning experience.</Typography.Text>
          </div>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}><Link to={adminPaths.predefinedMemoryLessons}><Card hoverable><Statistic title="Draft predefined lessons" value={dashboard.data.draftPredefinedLessons} prefix={<FileTextOutlined />} /><div style={{ marginTop: 16, color: "#0f766e" }}>Open studio &rarr;</div></Card></Link></Col>
            <Col xs={24} md={12}><Link to={adminPaths.palaceScenes}><Card hoverable><Statistic title="Draft Palace scenes" value={dashboard.data.draftPalaceScenes} prefix={<FileTextOutlined />} /><div style={{ marginTop: 16, color: "#0f766e" }}>Open studio &rarr;</div></Card></Link></Col>
          </Row>
        </div>
      )}
    </PortalPageContainer>
  );
}
