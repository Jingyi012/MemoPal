import { Button, Card, Col, Row, Space, Table, Tag, Typography } from 'antd';
import { useAuth } from '../../../auth/AuthContext';
import { PortalPageContainer } from '../../../components/PortalPageContainer';
import { useEducationRelationships } from '../hooks/useEducationRelationships';
import { QueryState } from '../components/QueryState';
import { CreateClassroomButton } from '../components/RelationshipForms';
import { Link } from 'react-router-dom';
import { adminPaths } from '../../../navigation/adminPaths';
import { getEducationWorkspaceCapabilities } from '../utils/educationWorkspaceCapabilities';

export default function EducationHomePage() {
  const { user } = useAuth();
  const data = useEducationRelationships(user?.id ?? '');
  const capabilities = getEducationWorkspaceCapabilities({
    userId: user?.id ?? '',
    classrooms: data.classrooms.data ?? [],
    memberships: data.memberships.data ?? [],
    guardianLinks: data.guardianLinks.data ?? [],
  });
  return <PortalPageContainer className="education-overview-page" eyebrow="Learning workspace" title="Your learning roles" description="Learn independently, create public practice, teach a class, or support family learners. These roles can overlap on one account." actions={<CreateClassroomButton loading={data.createClassroom.isPending} onSubmit={input => data.createClassroom.mutate(input)} />}>
    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
      <Col xs={24} md={24} lg={12}>
        <Card className="education-role-card" title="Independent learner" extra={<Tag color="purple">Open to everyone</Tag>}>
          <Typography.Paragraph>Discover public courses and practice at your own pace. You do not need a student account, classroom, or teacher invitation.</Typography.Paragraph>
          <Button type="primary" href="memopal://community/education">Explore public learning</Button>
        </Card>
      </Col>
      <Col xs={24} md={24} lg={12}>
        <Card className="education-role-card" title="Course author" extra={<Tag color="blue">Available to everyone</Tag>}>
          <Typography.Paragraph>Create learning material and optionally publish it for independent practice in Community. Classroom assessments remain separate and private by default.</Typography.Paragraph>
          <Link to={adminPaths.educationCourses}>Manage courses</Link>
        </Card>
      </Col>
      {capabilities.classroomEducator && <Col xs={24} md={24} lg={12}>
        <Card className="education-role-card" title="Classroom educator" extra={<Tag color="green">Active role</Tag>}>
          <Typography.Paragraph>Manage classrooms, invite learners, assign assessments, and review work within your authorized classes.</Typography.Paragraph>
          <Link to={adminPaths.educationClassrooms}>Open classrooms</Link>
        </Card>
      </Col>}
      {capabilities.learner && <Col xs={24} md={24} lg={12}>
        <Card className="education-role-card" title="Learner" extra={<Tag color="purple">Active role</Tag>}>
          <Typography.Paragraph>Your account has an active learner membership. Assigned activities and submissions are available in the MemoPal mobile app.</Typography.Paragraph>
          <Button type="primary" href="memopal://education/assignments">Open learner assignments in MemoPal</Button>
        </Card>
      </Col>}
      {capabilities.guardian && <Col xs={24} md={24} lg={12}>
        <Card className="education-role-card" title="Guardian" extra={<Tag color="gold">Verified relationship</Tag>}>
          <Typography.Paragraph>Support a linked learner with family practice and privacy-scoped progress reports.</Typography.Paragraph>
          <Link to={adminPaths.educationFamilyAssignments}>Open family practice</Link>
        </Card>
      </Col>}
    </Row>
    <Card title="Classrooms" extra={<Link to={adminPaths.educationClassrooms}>Open classroom list</Link>}>
      <Typography.Text type="secondary">Your classes are organized in one place. Open the classroom list to choose a class or create a new one.</Typography.Text>
    </Card>
    <header className="portal-header" style={{ marginTop: 36 }}><div><Typography.Title level={3}>Pending invitations</Typography.Title><Typography.Text type="secondary">Invitations sent to your account.</Typography.Text></div></header>
    <Card><QueryState query={data.memberships} emptyText="You have no pending invitations.">{memberships => {
      const pending = memberships.filter(item => item.status === 'pending' && new Date(item.expiresAt).getTime() > Date.now());
      if (pending.length === 0) return <Typography.Text type="secondary">You have no pending invitations.</Typography.Text>;
      const classrooms = data.classrooms.data ?? [];
      return <Table rowKey="id" scroll={{ x: 'max-content' }} pagination={false} dataSource={pending} columns={[
        { title: 'Classroom', render: (_: unknown, row) => classrooms.find(item => item.id === row.classroomId)?.name ?? row.classroomName ?? row.classroomId },
        { title: 'Role', dataIndex: 'role', render: (role: string) => <Tag>{role}</Tag> },
        { title: 'Expires', dataIndex: 'expiresAt', render: (date: string) => new Date(date).toLocaleString() },
        { title: '', render: (_: unknown, row) => <Space><Button type="primary" loading={data.acceptMembership.isPending} onClick={() => data.acceptMembership.mutate(row.id)}>Accept</Button><Button danger onClick={() => data.revokeMembership.mutate({ membershipId: row.id, classroomId: row.classroomId })}>Decline</Button></Space> },
      ]} />;
    }}</QueryState></Card>
  </PortalPageContainer>;
}
