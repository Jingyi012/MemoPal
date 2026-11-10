import { App, Button, Card, Col, Descriptions, Drawer, Input, Row, Select, Space, Steps, Tabs, Typography } from 'antd';
import { useState } from 'react';
import { useAuth } from '../../../auth/AuthContext';
import { PortalPageContainer } from '../../../components/PortalPageContainer';
import type { GuardianLinkDto } from '../../../types/educationRelationships';
import { GuardianAccessStatus, GuardianRelationshipTable } from '../components/GuardianRelationshipTable';
import { QueryState } from '../components/QueryState';
import { CreateGuardianLinkForm } from '../components/RelationshipForms';
import { useEducationRelationships } from '../hooks/useEducationRelationships';
import { useEducationText } from '../i18n/useEducationText';

export default function GuardianRelationshipsPage() {
  const { user, isAdmin } = useAuth();
  const { modal } = App.useApp();
  const { t } = useEducationText();
  const relationships = useEducationRelationships(user?.id ?? '', isAdmin);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [tab, setTab] = useState(isAdmin ? 'review' : 'mine');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = [...(relationships.guardianLinks.data ?? []), ...(relationships.guardianVerifications.data ?? [])]
    .find(link => link.id === selectedId);
  const busy = relationships.verifyGuardianLink.isPending || relationships.confirmGuardianLink.isPending || relationships.revokeGuardianLink.isPending;

  const actions = (link: GuardianLinkDto, details = false) => <>
    {!details && <Button onClick={() => setSelectedId(link.id)}>{t('guardianDetails')}</Button>}
    {link.status === 'pending' && link.studentUserId === user?.id && !link.studentConfirmed &&
      <Button type="primary" disabled={busy} onClick={() => modal.confirm({
        title: t('guardianConfirm'), content: t('guardianConsentHelp'),
        onOk: () => relationships.confirmGuardianLink.mutateAsync(link.id),
      })}>{t('guardianConfirm')}</Button>}
    {isAdmin && link.status === 'pending' && link.studentConfirmed && !link.adminVerified &&
      <Button type="primary" disabled={busy} onClick={() => modal.confirm({
        title: t('guardianVerifyTitle'),
        content: t('guardianVerifyHelp', { guardian: link.guardianDisplayName || link.guardianUserId, learner: link.studentDisplayName || link.studentUserId }),
        onOk: async () => { await relationships.verifyGuardianLink.mutateAsync(link.id); setSelectedId(null); },
      })}>{t('guardianVerify')}</Button>}
    {details && link.status !== 'revoked' && (link.guardianUserId === user?.id || link.studentUserId === user?.id) &&
      <Button danger disabled={busy} onClick={() => modal.confirm({
        title: t('guardianRevokeTitle'), content: t('guardianRevokeHelp'), okButtonProps: { danger: true },
        onOk: () => relationships.revokeGuardianLink.mutateAsync(link.id),
      })}>{t('guardianRevoke')}</Button>}
  </>;

  const filter = (links: GuardianLinkDto[]) => links.filter(link => {
    const term = search.trim().toLocaleLowerCase();
    return (status === 'all' || link.status === status) &&
      [link.guardianDisplayName, link.studentDisplayName, link.guardianUserId, link.studentUserId]
        .some(value => value?.toLocaleLowerCase().includes(term));
  });
  const list = (review: boolean) => <QueryState query={review ? relationships.guardianVerifications : relationships.guardianLinks}
    emptyText={review ? t('guardianReviewEmpty') : t('guardianEmpty')}>
    {links => <GuardianRelationshipTable links={filter(links)} renderActions={link => actions(link)} />}
  </QueryState>;

  return <PortalPageContainer eyebrow="Learning workspace" title={t('guardianTitle')} description={t('guardianDescription')}
    actions={<CreateGuardianLinkForm loading={relationships.createGuardianLink.isPending} onSubmit={input => relationships.createGuardianLink.mutateAsync(input)} />}>
    <Card size="small" style={{ marginBottom: 20 }}>
      <Steps size="small" current={-1} items={[
        { title: t('guardianFlowRequest') }, { title: t('guardianFlowConsent') }, { title: t('guardianFlowVerify') },
      ]} />
    </Card>
    <Card>
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={24} md={tab === 'mine' ? 16 : 24}><Input.Search aria-label={t('guardianSearch')} placeholder={t('guardianSearch')} allowClear value={search} onChange={event => setSearch(event.target.value)} /></Col>
        {tab === 'mine' && <Col xs={24} md={8}><Select aria-label={t('guardianProgress')} style={{ width: '100%' }} value={status} onChange={setStatus} options={[
          { value: 'all', label: t('guardianAllStatuses') }, { value: 'pending', label: t('guardianPending') },
          { value: 'active', label: t('guardianActive') }, { value: 'revoked', label: t('guardianRevoked') },
        ]} /></Col>}
      </Row>
      <Tabs activeKey={tab} onChange={key => { setTab(key); setStatus('all'); }} items={[
        ...(isAdmin ? [{ key: 'review', label: `${t('guardianReview')} (${relationships.guardianVerifications.data?.length ?? 0})`, children: list(true) }] : []),
        { key: 'mine', label: `${t('guardianMine')} (${relationships.guardianLinks.data?.length ?? 0})`, children: list(false) },
      ]} />
    </Card>
    <Drawer title={t('guardianDetails')} open={!!selectedId} onClose={() => setSelectedId(null)} width={480}
      footer={selected ? <Space wrap>{actions(selected, true)}</Space> : undefined}>
      {selected && <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <GuardianAccessStatus link={selected} />
        <Descriptions column={1} layout="vertical" items={[
          { key: 'guardian', label: t('guardian'), children: <><Typography.Text strong>{selected.guardianDisplayName || selected.guardianUserId}</Typography.Text><Typography.Paragraph copyable style={{ overflowWrap: 'anywhere' }}>{selected.guardianUserId}</Typography.Paragraph></> },
          { key: 'student', label: t('learner'), children: <><Typography.Text strong>{selected.studentDisplayName || selected.studentUserId}</Typography.Text><Typography.Paragraph copyable style={{ overflowWrap: 'anywhere' }}>{selected.studentUserId}</Typography.Paragraph></> },
          { key: 'created', label: t('guardianRequested'), children: new Date(selected.createdAt).toLocaleString() },
        ]} />
        <Steps direction="vertical" current={selected.status === 'active' ? 3 : !selected.studentConfirmed ? 1 : 2}
          status={selected.status === 'revoked' ? 'error' : 'process'} items={[
            { title: t('guardianFlowRequest') }, { title: t('guardianFlowConsent') }, { title: t('guardianFlowVerify') },
          ]} />
      </Space>}
    </Drawer>
  </PortalPageContainer>;
}
