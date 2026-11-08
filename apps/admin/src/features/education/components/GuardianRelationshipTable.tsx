import { Avatar, Space, Table, Tag, Typography } from 'antd';
import type { ReactNode } from 'react';
import type { GuardianLinkDto } from '../../../types/educationRelationships';
import { useEducationText } from '../i18n/useEducationText';

export function GuardianIdentity({ name, id }: { name?: string | null; id: string }) {
  return <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
    <Avatar aria-hidden style={{ flexShrink: 0 }}>{(name || id).slice(0, 1).toUpperCase()}</Avatar>
    <div style={{ minWidth: 0, flex: 1 }}>
      <Typography.Text strong ellipsis style={{ maxWidth: '100%', display: 'block' }}>{name || id}</Typography.Text>
      {name && <Typography.Text type="secondary" ellipsis style={{ maxWidth: '100%', display: 'block', fontSize: 12 }}>{id}</Typography.Text>}
    </div>
  </div>;
}

export function GuardianAccessStatus({ link }: { link: GuardianLinkDto }) {
  const { t } = useEducationText();
  const label = link.status === 'revoked' ? t('guardianRevoked') : link.status === 'active' ? t('guardianActive')
    : !link.studentConfirmed ? t('guardianStudentWaiting') : t('guardianAdminWaiting');
  return <Tag style={{ whiteSpace: 'normal', marginInlineEnd: 0 }} color={link.status === 'active' ? 'green' : link.status === 'pending' ? 'gold' : 'default'}>{label}</Tag>;
}

export function GuardianRelationshipTable({ links, renderActions }: {
  links: GuardianLinkDto[]; renderActions: (link: GuardianLinkDto) => ReactNode;
}) {
  const { t } = useEducationText();
  return <Table<GuardianLinkDto> rowKey="id" dataSource={links} tableLayout="fixed" scroll={{ x: 850 }}
    pagination={{ pageSize: 10, hideOnSinglePage: true }} locale={{ emptyText: t('guardianNoResults') }}
    columns={[
      { title: t('guardian'), width: 175, render: (_, link) => <GuardianIdentity name={link.guardianDisplayName} id={link.guardianUserId} /> },
      { title: t('learner'), width: 175, render: (_, link) => <GuardianIdentity name={link.studentDisplayName} id={link.studentUserId} /> },
      { title: t('guardianProgress'), width: 200, render: (_, link) => <GuardianAccessStatus link={link} /> },
      { title: t('guardianRequested'), width: 110, dataIndex: 'createdAt', render: (date: string) => new Date(date).toLocaleDateString() },
      { title: t('guardianActions'), width: 190, render: (_, link) => <Space wrap>{renderActions(link)}</Space> },
    ]} />;
}
