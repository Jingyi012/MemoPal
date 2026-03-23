import { DeleteOutlined, EditOutlined, PlusOutlined, SettingOutlined } from '@ant-design/icons';
import {
  ModalForm,
  ProForm,
  ProFormDigit,
  ProFormSwitch,
  ProFormText,
  ProTable,
} from '@ant-design/pro-components';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { useMutation } from '@tanstack/react-query';
import { Button, Popconfirm, message } from 'antd';
import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminContentApi } from '../../../api/adminContentApi';
import { PortalPageContainer } from '../../../components/PortalPageContainer';
import { adminPaths } from '../../../navigation/adminPaths';
import { ImageUploadField } from '../components/ImageUploadField';
import { MediaThumbnail } from '../components/MediaThumbnail';
import type { PalaceDto, PalaceUpsertRequest } from '../../../types/content';
import { buildPalacePayload, type PalaceFormValues } from '../components/palace-setup/forms';

export default function PalacesPage() {
  const actionRef = useRef<ActionType | null>(null);
  const [editing, setEditing] = useState<PalaceDto | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const navigate = useNavigate();
  const formLayout = { layout: 'horizontal' as const, labelCol: { span: 7 }, wrapperCol: { span: 17 } };

  const refresh = () => actionRef.current?.reload();

  const createMutation = useMutation({
    mutationFn: (payload: PalaceUpsertRequest) => adminContentApi.createPalace(payload),
    onSuccess: () => {
      message.success('Palace created.');
      setCreateOpen(false);
      refresh();
    },
    onError: () => message.error('Failed to create palace.'),
  });

  const updateMutation = useMutation({
    mutationFn: (args: { id: string; payload: PalaceUpsertRequest }) =>
      adminContentApi.updatePalace(args.id, args.payload),
    onSuccess: () => {
      message.success('Palace updated.');
      setEditing(null);
      refresh();
    },
    onError: () => message.error('Failed to update palace.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminContentApi.deletePalace(id),
    onSuccess: () => {
      message.success('Palace deleted.');
      refresh();
    },
    onError: () => message.error('Failed to delete palace.'),
  });

  const columns: ProColumns<PalaceDto>[] = useMemo(
    () => [
      { title: 'Name', dataIndex: 'name' },
      { title: 'Description', dataIndex: 'description', ellipsis: true },
      {
        title: 'Thumbnail',
        dataIndex: 'thumbnail',
        width: 120,
        render: (_, row) => (
          <MediaThumbnail path={row.thumbnail} alt={`${row.name} thumbnail`} width={84} height={50} />
        ),
      },
      { title: 'Locations', dataIndex: 'locationsCount', width: 100 },
      { title: 'Required XP', dataIndex: 'requiredXp', width: 110 },
      { title: 'Premium', dataIndex: 'isPremium', valueType: 'switch', width: 90 },
      { title: 'Custom', dataIndex: 'isCustom', valueType: 'switch', width: 90 },
      {
        title: 'Actions',
        valueType: 'option',
        width: 220,
        render: (_, row) => [
          <Button
            key='configure'
            size='small'
            icon={<SettingOutlined />}
            onClick={() => navigate(adminPaths.palaceDetails(row.id))}
          >
            Configure
          </Button>,
          <Button key='edit' size='small' icon={<EditOutlined />} onClick={() => setEditing(row)} />,
          <Popconfirm
            key='delete'
            title='Delete this palace?'
            onConfirm={() => deleteMutation.mutate(row.id)}
          >
            <Button size='small' danger icon={<DeleteOutlined />} />
          </Popconfirm>,
        ],
      },
    ],
    [deleteMutation, navigate]
  );

  return (
    <PortalPageContainer>
      <ProTable<PalaceDto>
        rowKey='id'
        actionRef={actionRef}
        columns={columns}
        search={false}
        request={async (params) => {
          const data = await adminContentApi.listPalaces(params.current || 1, params.pageSize || 20);
          return {
            data: data.data,
            success: data.success,
            total: data.pagination.totalCount,
          };
        }}
        toolBarRender={() => [
          <Button key='add' type='primary' icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
            New Palace
          </Button>,
        ]}
      />

      <ModalForm<PalaceFormValues>
        title='Create Palace'
        open={createOpen}
        {...formLayout}
        onOpenChange={setCreateOpen}
        initialValues={{
          requiredXp: 0,
          isPremium: false,
          isCustom: false,
          isLocked: false,
        }}
        onFinish={async (values) => {
          await createMutation.mutateAsync(buildPalacePayload(values));
          return true;
        }}
      >
        <ProFormText
          name='name'
          label='Name'
          rules={[{ required: true }]}
          fieldProps={{ placeholder: 'Enter palace name' }}
        />
        <ProFormText
          name='description'
          label='Description'
          rules={[{ required: true }]}
          fieldProps={{ placeholder: 'Enter short palace description' }}
        />
        <ProForm.Item name='thumbnail' label='Thumbnail' rules={[{ required: true }]}>
          <ImageUploadField category='palace' />
        </ProForm.Item>
        <ProFormDigit
          name='requiredXp'
          label='Required XP'
          min={0}
          rules={[{ required: true }]}
          fieldProps={{ placeholder: 'Enter XP required to unlock' }}
        />
        <ProFormSwitch name='isPremium' label='Premium' />
        <ProFormSwitch name='isCustom' label='Custom' />
        <ProFormSwitch name='isLocked' label='Locked' />
      </ModalForm>

      <ModalForm<PalaceFormValues>
        title='Edit Palace'
        open={!!editing}
        {...formLayout}
        initialValues={
          editing
            ? {
                name: editing.name,
                description: editing.description,
                thumbnail: editing.thumbnail,
                requiredXp: editing.requiredXp,
                isPremium: editing.isPremium,
                isCustom: editing.isCustom,
                isLocked: editing.isLocked,
              }
            : undefined
        }
        onOpenChange={(isOpen) => {
          if (!isOpen) setEditing(null);
        }}
        onFinish={async (values) => {
          if (!editing) return false;
          await updateMutation.mutateAsync({
            id: editing.id,
            payload: buildPalacePayload(values, editing),
          });
          return true;
        }}
      >
        <ProFormText
          name='name'
          label='Name'
          rules={[{ required: true }]}
          fieldProps={{ placeholder: 'Enter palace name' }}
        />
        <ProFormText
          name='description'
          label='Description'
          rules={[{ required: true }]}
          fieldProps={{ placeholder: 'Enter short palace description' }}
        />
        <ProForm.Item name='thumbnail' label='Thumbnail' rules={[{ required: true }]}>
          <ImageUploadField category='palace' />
        </ProForm.Item>
        <ProFormDigit
          name='requiredXp'
          label='Required XP'
          min={0}
          rules={[{ required: true }]}
          fieldProps={{ placeholder: 'Enter XP required to unlock' }}
        />
        <ProFormSwitch name='isPremium' label='Premium' />
        <ProFormSwitch name='isCustom' label='Custom' />
        <ProFormSwitch name='isLocked' label='Locked' />
      </ModalForm>
    </PortalPageContainer>
  );
}

