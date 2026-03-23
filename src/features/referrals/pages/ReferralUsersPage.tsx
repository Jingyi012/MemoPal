import { FilterOutlined, ReloadOutlined } from '@ant-design/icons';
import { ProTable } from '@ant-design/pro-components';
import { Button, Card, Space, Tag } from 'antd';
import { useMemo, useState } from 'react';
import { adminReferralsApi } from '../../../api/adminReferralsApi';
import { PortalPageContainer } from '../../../components/PortalPageContainer';
import type { AdminReferralRecordDto, AdminReferralUserDto } from '../../../types/referral';

function formatDateTime(value?: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export default function ReferralUsersPage() {
  const [selectedReferrer, setSelectedReferrer] = useState<AdminReferralUserDto | null>(null);

  const selectedTag = useMemo(() => {
    if (!selectedReferrer) return null;
    return `${selectedReferrer.displayName} (${selectedReferrer.referralCode})`;
  }, [selectedReferrer]);

  return (
    <PortalPageContainer>
      <Space direction='vertical' size={16} style={{ width: '100%' }}>
        <Card title='Referrer Users'>
          <ProTable<AdminReferralUserDto>
            rowKey='userId'
            search={{ labelWidth: 'auto' }}
            options={false}
            pagination={{ pageSize: 20 }}
            request={async (params) => {
              const search = String(params.displayName || params.email || params.referralCode || '');
              const page = await adminReferralsApi.listUsers(
                params.current || 1,
                params.pageSize || 20,
                search
              );
              return {
                data: page.data,
                success: page.success,
                total: page.pagination.totalCount,
              };
            }}
            columns={[
              { title: 'Name', dataIndex: 'displayName' },
              { title: 'Email', dataIndex: 'email' },
              { title: 'Referral Code', dataIndex: 'referralCode', width: 150 },
              { title: 'Referrals', dataIndex: 'successfulReferrals', width: 96, search: false },
              { title: 'XP Awarded', dataIndex: 'totalXpAwarded', width: 100, search: false },
              { title: 'Premium Days', dataIndex: 'totalPremiumDaysAwarded', width: 120, search: false },
              {
                title: 'Last Referral',
                dataIndex: 'lastReferralAt',
                width: 170,
                search: false,
                render: (_, row) => formatDateTime(row.lastReferralAt),
              },
              {
                title: 'Actions',
                width: 130,
                search: false,
                render: (_, row) => (
                  <Button
                    icon={<FilterOutlined />}
                    onClick={() => setSelectedReferrer(row)}
                    type={selectedReferrer?.userId === row.userId ? 'primary' : 'default'}
                  >
                    View Records
                  </Button>
                ),
              },
            ]}
          />
        </Card>

        <Card
          title='Referral Records'
          extra={
            <Space>
              {selectedTag ? <Tag color='blue'>{selectedTag}</Tag> : <Tag>All Referrers</Tag>}
              <Button
                icon={<ReloadOutlined />}
                onClick={() => setSelectedReferrer(null)}
                disabled={!selectedReferrer}
              >
                Clear Filter
              </Button>
            </Space>
          }
        >
          <ProTable<AdminReferralRecordDto>
            rowKey='id'
            search={{ labelWidth: 'auto' }}
            options={false}
            key={selectedReferrer?.userId ?? 'all-referrers'}
            pagination={{ pageSize: 20 }}
            request={async (params) => {
              const search = String(
                params.referralCode || params.referrerDisplayName || params.refereeDisplayName || ''
              );
              const page = await adminReferralsApi.listRecords(
                params.current || 1,
                params.pageSize || 20,
                search,
                selectedReferrer?.userId
              );
              return {
                data: page.data,
                success: page.success,
                total: page.pagination.totalCount,
              };
            }}
            columns={[
              { title: 'Code', dataIndex: 'referralCode', width: 130 },
              { title: 'Referrer', dataIndex: 'referrerDisplayName' },
              { title: 'Referee', dataIndex: 'refereeDisplayName' },
              { title: 'Inviter XP', dataIndex: 'inviterRewardXp', width: 90, search: false },
              { title: 'Inviter Premium', dataIndex: 'inviterRewardPremiumDays', width: 120, search: false },
              { title: 'Invitee XP', dataIndex: 'inviteeRewardXp', width: 90, search: false },
              { title: 'Invitee Premium', dataIndex: 'inviteeRewardPremiumDays', width: 120, search: false },
              {
                title: 'Redeemed At',
                dataIndex: 'redeemedAt',
                width: 170,
                search: false,
                render: (_, row) => formatDateTime(row.redeemedAt),
              },
            ]}
          />
        </Card>
      </Space>
    </PortalPageContainer>
  );
}
