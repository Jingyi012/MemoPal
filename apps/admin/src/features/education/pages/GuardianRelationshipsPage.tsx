import { App, Button, Card, Table, Tag } from 'antd';
import { useAuth } from '../../../auth/AuthContext';
import { PortalPageContainer } from '../../../components/PortalPageContainer';
import { QueryState } from '../components/QueryState';
import { CreateGuardianLinkForm } from '../components/RelationshipForms';
import { useEducationRelationships } from '../hooks/useEducationRelationships';

export default function GuardianRelationshipsPage() {
  const { user, isAdmin } = useAuth();
  const { modal } = App.useApp();
  const relationships = useEducationRelationships(user?.id ?? '', isAdmin);
  return <PortalPageContainer eyebrow="Learning workspace" title="Guardian relationships" description="Create a guardian link, confirm learner consent, and review verification status." actions={<CreateGuardianLinkForm loading={relationships.createGuardianLink.isPending} onSubmit={input => relationships.createGuardianLink.mutate(input)} />}>
    <Card><QueryState query={relationships.guardianLinks} emptyText="No guardian relationships yet.">{links => <Table rowKey="id" pagination={false} dataSource={links} columns={[
      { title: 'Guardian user', dataIndex: 'guardianUserId' }, { title: 'Student user', dataIndex: 'studentUserId' }, { title: 'Status', dataIndex: 'status', render: (status: string) => <Tag color={status === 'active' ? 'green' : status === 'pending' ? 'gold' : 'default'}>{status}</Tag> }, { title: 'Student confirmed', dataIndex: 'studentConfirmed', render: (value: boolean) => value ? 'Yes' : 'No' }, { title: 'Admin verified', dataIndex: 'adminVerified', render: (value: boolean) => value ? 'Yes' : 'No' },
      { title: 'Actions', key: 'actions', render: (_: unknown, link) => <>{link.studentUserId === user?.id && !link.studentConfirmed && <Button type="link" onClick={() => relationships.confirmGuardianLink.mutate(link.id)}>Confirm</Button>}{isAdmin && !link.adminVerified && link.status !== 'revoked' && <Button type="link" onClick={() => relationships.verifyGuardianLink.mutate(link.id)}>Verify</Button>}{link.status !== 'revoked' && <Button danger type="link" onClick={() => modal.confirm({ title: 'Revoke guardian relationship?', content: 'This relationship will no longer be active.', okText: 'Revoke', okButtonProps: { danger: true }, onOk: () => relationships.revokeGuardianLink.mutateAsync(link.id) })}>Revoke</Button>}</> },
    ]} />}</QueryState></Card>
    {isAdmin && <Card title="Pending verification" style={{ marginTop: 20 }}>
      <QueryState query={relationships.guardianVerifications} emptyText="There are no guardian links waiting for verification.">{links => <Table rowKey="id" pagination={{ pageSize: 10 }} dataSource={links} columns={[
        { title: 'Guardian user', dataIndex: 'guardianUserId' },
        { title: 'Student user', dataIndex: 'studentUserId' },
        { title: 'Student confirmed', dataIndex: 'studentConfirmed', render: (value: boolean) => value ? 'Yes' : 'No' },
        { title: 'Requested', dataIndex: 'createdAt', render: (date: string) => new Date(date).toLocaleString() },
        { title: '', key: 'action', render: (_: unknown, link) => <Button type="primary" loading={relationships.verifyGuardianLink.isPending} onClick={() => relationships.verifyGuardianLink.mutate(link.id)}>Verify relationship</Button> },
      ]} />}</QueryState>
    </Card>}
  </PortalPageContainer>;
}
