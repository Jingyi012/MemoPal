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
import type { ReactNode } from 'react';
import { adminContentApi } from '../../../../api/adminContentApi';
import type { PaginatedResponse } from '../../../../types/api';
import type { PalaceDto, PalaceUpsertRequest } from '../../../../types/content';
import { ImageUploadField } from '../ImageUploadField';
import { MediaThumbnail } from '../MediaThumbnail';
import { buildPalacePayload, type PalaceFormValues } from './forms';

interface PalacesManagerWorkspaceProps {
  onConfigure: (palaceId: string) => void;
  listPalaces?: (pageNumber: number, pageSize: number) => Promise<PaginatedResponse<PalaceDto>>;
  createPalace?: (payload: PalaceUpsertRequest) => Promise<PalaceDto>;
  updatePalace?: (id: string, payload: PalaceUpsertRequest) => Promise<PalaceDto>;
  deletePalace?: (id: string) => Promise<boolean>;
  allowCreate?: boolean;
  allowEdit?: boolean;
  allowDelete?: boolean;
}

export function PalacesManagerWorkspace({
  onConfigure,
  listPalaces = adminContentApi.listPalaces,
  createPalace = adminContentApi.createPalace,
  updatePalace = adminContentApi.updatePalace,
  deletePalace = adminContentApi.deletePalace,
  allowCreate = true,
  allowEdit = true,
  allowDelete = true,
}: PalacesManagerWorkspaceProps) {
  const actionRef = useRef<ActionType | null>(null);
  const [editing, setEditing] = useState<PalaceDto | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const formLayout = { layout: 'horizontal' as const, labelCol: { span: 7 }, wrapperCol: { span: 17 } };

  const refresh = () => actionRef.current?.reload();

  const createMutation = useMutation({
    mutationFn: (payload: PalaceUpsertRequest) => createPalace(payload),
    onSuccess: () => {
      message.success('Palace created.');
      setCreateOpen(false);
      refresh();
    },
    onError: () => message.error('Failed to create palace.'),
  });

  const updateMutation = useMutation({
    mutationFn: (args: { id: string; payload: PalaceUpsertRequest }) => updatePalace(args.id, args.payload),
    onSuccess: () => {
      message.success('Palace updated.');
      setEditing(null);
      refresh();
    },
    onError: () => message.error('Failed to update palace.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deletePalace(id),
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
      { title: 'Unlock Level', dataIndex: 'level', width: 110 },
      { title: 'Premium', dataIndex: 'isPremium', valueType: 'switch', width: 90 },
      { title: 'Custom', dataIndex: 'isCustom', valueType: 'switch', width: 90 },
      {
        title: 'Actions',
        valueType: 'option',
        width: 260,
        render: (_, row) => {
          const actions: ReactNode[] = [
            <Button
              key='configure'
              size='small'
              icon={<SettingOutlined />}
              onClick={() => onConfigure(row.id)}
            >
              Configure
            </Button>,
          ];

          if (allowEdit) {
            actions.push(
              <Button key='edit' size='small' icon={<EditOutlined />} onClick={() => setEditing(row)} />
            );
          }

          if (allowDelete) {
            actions.push(
              <Popconfirm
                key='delete'
                title='Delete this palace?'
                onConfirm={() => deleteMutation.mutate(row.id)}
              >
                <Button size='small' danger icon={<DeleteOutlined />} />
              </Popconfirm>
            );
          }

          return actions;
        },
      },
    ],
    [allowDelete, allowEdit, deleteMutation, onConfigure]
  );

  return (
    <>
      <ProTable<PalaceDto>
        rowKey='id'
        actionRef={actionRef}
        columns={columns}
        search={false}
        request={async (params) => {
          const data = await listPalaces(params.current || 1, params.pageSize || 20);
          return {
            data: data.data,
            success: data.success,
            total: data.pagination.totalCount,
          };
        }}
        toolBarRender={
          allowCreate
            ? () => [
                <Button key='add' type='primary' icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
                  New Palace
                </Button>,
              ]
            : false
        }
      />

      <ModalForm<PalaceFormValues>
        title='Create Palace'
        open={allowCreate && createOpen}
        modalProps={{ destroyOnClose: true }}
        {...formLayout}
        onOpenChange={setCreateOpen}
        initialValues={{
          level: 1,
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
          name='level'
          label='Unlock Level'
          min={1}
          rules={[{ required: true }]}
          fieldProps={{ placeholder: 'Enter required user level' }}
        />
        <ProFormSwitch name='isPremium' label='Premium' />
        <ProFormSwitch name='isCustom' label='Custom' />
        <ProFormSwitch name='isLocked' label='Locked' />
      </ModalForm>

      <ModalForm<PalaceFormValues>
        key={editing?.id ?? 'edit-palace'}
        title='Edit Palace'
        open={allowEdit && !!editing}
        modalProps={{ destroyOnClose: true }}
        {...formLayout}
        initialValues={
          editing
            ? {
                name: editing.name,
                description: editing.description,
                thumbnail: editing.thumbnail,
                level: editing.level,
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
          name='level'
          label='Unlock Level'
          min={1}
          rules={[{ required: true }]}
          fieldProps={{ placeholder: 'Enter required user level' }}
        />
        <ProFormSwitch name='isPremium' label='Premium' />
        <ProFormSwitch name='isCustom' label='Custom' />
        <ProFormSwitch name='isLocked' label='Locked' />
      </ModalForm>
    </>
  );
}
