import { EditOutlined } from '@ant-design/icons';
import { ModalForm, ProFormDateTimePicker, ProFormSelect, ProFormSwitch, ProTable } from '@ant-design/pro-components';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { useMutation } from '@tanstack/react-query';
import { Button, message } from 'antd';
import { useRef, useState } from 'react';
import { adminSubscriptionsApi } from '../../../api/adminSubscriptionsApi';
import { PortalPageContainer } from '../../../components/PortalPageContainer';
import type { AdminUserSubscriptionDto } from '../../../types/subscription';

export default function SubscriptionsPage() {
  const actionRef = useRef<ActionType | null>(null);
  const [editing, setEditing] = useState<AdminUserSubscriptionDto | null>(null);

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => adminSubscriptionsApi.update(id, payload),
    onSuccess: () => {
      message.success('Subscription updated');
      setEditing(null);
      actionRef.current?.reload();
    },
  });

  const columns: ProColumns<AdminUserSubscriptionDto>[] = [
    { title: 'User', dataIndex: 'userId' },
    { title: 'Plan', dataIndex: 'planId' },
    { title: 'Provider', dataIndex: 'provider' },
    { title: 'Status', dataIndex: 'status', valueType: 'select', valueEnum: { active: { text: 'active' }, canceled: { text: 'canceled' }, past_due: { text: 'past_due' }, trialing: { text: 'trialing' } } },
    { title: 'Expires', dataIndex: 'expiresAt', valueType: 'dateTime' },
    { title: 'AutoRenew', dataIndex: 'autoRenew', valueType: 'switch' },
    {
      title: 'Actions',
      valueType: 'option',
      render: (_, row) => [<Button key='edit' size='small' icon={<EditOutlined />} onClick={() => setEditing(row)} />],
    },
  ];

  return (
    <PortalPageContainer>
      <ProTable<AdminUserSubscriptionDto>
        rowKey='id'
        actionRef={actionRef}
        columns={columns}
        request={async (params) => {
          const data = await adminSubscriptionsApi.list(params.current || 1, params.pageSize || 20, String(params.userId || ''), String(params.status || ''));
          return { data: data.data, success: data.success, total: data.pagination.totalCount };
        }}
      />

      <ModalForm
        key={editing?.id ?? 'edit-subscription'}
        title='Update Subscription'
        open={!!editing}
        modalProps={{ destroyOnClose: true }}
        initialValues={editing ? { ...editing } : undefined}
        onOpenChange={(open) => !open && setEditing(null)}
        onFinish={async (values) => {
          if (!editing) return false;
          await updateMutation.mutateAsync({ id: editing.id, payload: values });
          return true;
        }}>
        <ProFormSelect
          name='status'
          label='Status'
          placeholder='Select subscription status'
          options={[
            { label: 'active', value: 'active' },
            { label: 'canceled', value: 'canceled' },
            { label: 'past_due', value: 'past_due' },
            { label: 'trialing', value: 'trialing' },
          ]}
        />
        <ProFormDateTimePicker
          name='expiresAt'
          label='Expires At'
          fieldProps={{ placeholder: 'Select expiration date/time' }}
        />
        <ProFormDateTimePicker
          name='lastVerifiedAt'
          label='Last Verified At'
          fieldProps={{ placeholder: 'Select last verification date/time' }}
        />
        <ProFormSwitch name='autoRenew' label='Auto Renew' />
      </ModalForm>
    </PortalPageContainer>
  );
}

