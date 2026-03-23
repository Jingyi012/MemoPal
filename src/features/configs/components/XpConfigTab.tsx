import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { ModalForm, ProFormDigit, ProFormSwitch, ProFormText, ProTable } from '@ant-design/pro-components';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { Button, Popconfirm } from 'antd';
import { useRef, useState } from 'react';
import { adminConfigsApi } from '../../../api/adminConfigsApi';
import type { XpConfigDto } from '../../../types/config';
import { useConfigCrudMutations } from '../hooks/useConfigCrudMutations';

export function XpConfigTab() {
  const actionRef = useRef<ActionType | null>(null);
  const [editing, setEditing] = useState<XpConfigDto | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const refresh = () => actionRef.current?.reload();

  const { createMutation, updateMutation, deleteMutation } = useConfigCrudMutations({
    create: adminConfigsApi.createXpConfig,
    update: ({ id, payload }: { id: string; payload: any }) => adminConfigsApi.updateXpConfig(id, payload),
    remove: adminConfigsApi.deleteXpConfig,
    onDone: refresh,
  });

  const columns: ProColumns<XpConfigDto>[] = [
    { title: 'Source', dataIndex: 'sourceType' },
    { title: 'Base XP', dataIndex: 'baseXp' },
    { title: 'Variable XP', dataIndex: 'variableXp' },
    { title: 'Active', dataIndex: 'isActive', valueType: 'switch' },
    {
      title: 'Actions', valueType: 'option', render: (_, row) => [
        <Button key='e' icon={<EditOutlined />} size='small' onClick={() => setEditing(row)} />,
        <Popconfirm key='d' title='Delete?' onConfirm={() => deleteMutation.mutate(row.id)}>
          <Button danger size='small' icon={<DeleteOutlined />} />
        </Popconfirm>,
      ]
    },
  ];

  return <>
    <ProTable<XpConfigDto>
      rowKey='id' actionRef={actionRef} columns={columns} search={false}
      request={async (params) => {
        const res = await adminConfigsApi.listXpConfigs(params.current || 1, params.pageSize || 20);
        return { data: res.data, success: res.success, total: res.pagination.totalCount };
      }}
      toolBarRender={() => [<Button key='add' type='primary' icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>New XP Config</Button>]}
    />
    <ModalForm open={createOpen} title='Create XP Config' onOpenChange={setCreateOpen} onFinish={async (v) => { await createMutation.mutateAsync(v as any); setCreateOpen(false); return true; }}>
      <ProFormText
        name='sourceType'
        label='Source Type'
        rules={[{ required: true }]}
        fieldProps={{ placeholder: 'Enter source type (e.g., review_complete)' }}
      />
      <ProFormDigit
        name='baseXp'
        label='Base XP'
        rules={[{ required: true }]}
        fieldProps={{ placeholder: 'Enter base XP' }}
      />
      <ProFormDigit
        name='variableXp'
        label='Variable XP'
        initialValue={0}
        fieldProps={{ placeholder: 'Enter bonus/variable XP (optional)' }}
      />
      <ProFormSwitch name='isActive' label='Active' initialValue />
    </ModalForm>
    <ModalForm open={!!editing} title='Edit XP Config' initialValues={editing || {}} onOpenChange={(o) => !o && setEditing(null)} onFinish={async (v) => { if (!editing) return false; await updateMutation.mutateAsync({ id: editing.id, payload: v } as any); setEditing(null); return true; }}>
      <ProFormText
        name='sourceType'
        label='Source Type'
        rules={[{ required: true }]}
        fieldProps={{ placeholder: 'Enter source type (e.g., review_complete)' }}
      />
      <ProFormDigit
        name='baseXp'
        label='Base XP'
        rules={[{ required: true }]}
        fieldProps={{ placeholder: 'Enter base XP' }}
      />
      <ProFormDigit
        name='variableXp'
        label='Variable XP'
        fieldProps={{ placeholder: 'Enter bonus/variable XP (optional)' }}
      />
      <ProFormSwitch name='isActive' label='Active' />
    </ModalForm>
  </>;
}
