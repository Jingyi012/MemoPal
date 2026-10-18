import { App, Button, Card, Table, Tag, Typography } from 'antd';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../../auth/AuthContext';
import { PortalPageContainer } from '../../../components/PortalPageContainer';
import { useClassroomMembers, useEducationRelationships } from '../hooks/useEducationRelationships';
import { QueryState } from '../components/QueryState';
import { InviteMemberForm } from '../components/RelationshipForms';
import { ClassroomAssignments } from '../components/ClassroomAssignments';
import { ClassroomObjectiveProgress } from '../components/ClassroomObjectiveProgress';

export default function ClassroomDetailPage() {
  const { classroomId = '' } = useParams();
  const { user } = useAuth();
  const { modal } = App.useApp();
  const relationships = useEducationRelationships(user?.id ?? '');
  const classroomQuery = relationships.classrooms;
  const classroom = classroomQuery.data?.find(item => item.id === classroomId);
  const members = useClassroomMembers(user?.id ?? '', classroomId, classroom?.role === 'owner' || classroom?.role === 'teacher');
  const owner = classroom?.role === 'owner';
  return <PortalPageContainer eyebrow="Learning workspace" title={classroom?.name ?? 'Classroom'} description="Review members and invitations." actions={owner ? <InviteMemberForm loading={relationships.invite.isPending} onSubmit={input => relationships.invite.mutate({ classroomId, input })} /> : undefined}>
    <Card>{classroom?.role === 'student' ? 'Member details are available to classroom owners and teachers.' : <QueryState query={members} emptyText="No members or invitations yet.">{rows => <Table rowKey="id" pagination={false} dataSource={rows} columns={[
      { title: 'Member', render: (_: unknown, row) => <div><div>{row.userDisplayName || 'MemoPal user'}</div><Typography.Text type="secondary">{row.userId}</Typography.Text></div> }, { title: 'Role', dataIndex: 'role', render: (role: string) => <Tag>{role}</Tag> }, { title: 'Status', dataIndex: 'status', render: (status: string) => <Tag color={status === 'active' ? 'green' : status === 'pending' ? 'gold' : 'default'}>{status}</Tag> }, { title: 'Expires', dataIndex: 'expiresAt', render: (date: string) => new Date(date).toLocaleString() },
      { title: '', key: 'action', render: (_: unknown, row) => owner && row.status !== 'revoked' ? <Button danger type="link" onClick={() => modal.confirm({ title: 'Revoke membership?', content: 'This member will lose classroom access.', okText: 'Revoke', okButtonProps: { danger: true }, onOk: () => relationships.revokeMembership.mutateAsync({ membershipId: row.id, classroomId }) })}>Revoke</Button> : null },
    ]} />}</QueryState>}</Card>
    {(classroom?.role === 'owner' || classroom?.role === 'teacher') && <ClassroomObjectiveProgress userId={user?.id ?? ''} classroomId={classroomId} enabled />}
    {(classroom?.role === 'owner' || classroom?.role === 'teacher') && <ClassroomAssignments userId={user?.id ?? ''} classroomId={classroomId} canManage />}
  </PortalPageContainer>;
}
