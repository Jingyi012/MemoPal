import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { ModalForm, ProFormDigit, ProFormText, ProTable } from '@ant-design/pro-components';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { Button, Popconfirm } from 'antd';
import { useRef, useState } from 'react';
import { adminConfigsApi } from '../../../api/adminConfigsApi';
import type { LevelConfigDto } from '../../../types/config';
import { useConfigCrudMutations } from '../hooks/useConfigCrudMutations';

export function LevelConfigTab() {
  const actionRef = useRef<ActionType | null>(null);
  const [editing, setEditing] = useState<LevelConfigDto | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const refresh = () => actionRef.current?.reload();

  const { createMutation, updateMutation, deleteMutation } = useConfigCrudMutations({
    create: ({ level, payload }: { level: number; payload: any }) => adminConfigsApi.createLevelConfig(level, payload),
    update: ({ level, payload }: { level: number; payload: any }) => adminConfigsApi.updateLevelConfig(level, payload),
    remove: (level) => adminConfigsApi.deleteLevelConfig(Number(level)),
    onDone: refresh,
  });

  const columns: ProColumns<LevelConfigDto>[] = [
    { title: 'Level', dataIndex: 'level' },
    { title: 'Required XP', dataIndex: 'requiredXp' },
    { title: 'Title', dataIndex: 'title' },
    { title: 'Actions', valueType: 'option', render: (_, row) => [
      <Button key='e' icon={<EditOutlined />} size='small' onClick={() => setEditing(row)} />,
      <Popconfirm key='d' title='Delete?' onConfirm={() => deleteMutation.mutate(row.level)}><Button danger size='small' icon={<DeleteOutlined />} /></Popconfirm>,
    ]},
  ];

  return <>
    <ProTable<LevelConfigDto>
      rowKey='level' actionRef={actionRef} columns={columns} search={false}
      request={async (params) => {
        const res = await adminConfigsApi.listLevelConfigs(params.current || 1, params.pageSize || 20);
        return { data: res.data, success: res.success, total: res.pagination.totalCount };
      }}
      toolBarRender={() => [<Button key='add' type='primary' icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>New Level Config</Button>]}
    />
    <ModalForm open={createOpen} title='Create Level Config' onOpenChange={setCreateOpen} onFinish={async (v: any) => { await createMutation.mutateAsync({ level: v.level, payload: { requiredXp: v.requiredXp, title: v.title } }); setCreateOpen(false); return true; }}>
      <ProFormDigit
        name='level'
        label='Level'
        rules={[{ required: true }]}
        min={1}
        fieldProps={{ placeholder: 'Enter level number' }}
      />
      <ProFormDigit
        name='requiredXp'
        label='Required XP'
        rules={[{ required: true }]}
        min={0}
        fieldProps={{ placeholder: 'Enter XP required for this level' }}
      />
      <ProFormText name='title' label='Title' fieldProps={{ placeholder: 'Enter level title (e.g., Navigator)' }} />
    </ModalForm>
    <ModalForm open={!!editing} title='Edit Level Config' initialValues={editing || {}} onOpenChange={(o) => !o && setEditing(null)} onFinish={async (v: any) => { if (!editing) return false; await updateMutation.mutateAsync({ level: editing.level, payload: { requiredXp: v.requiredXp, title: v.title } }); setEditing(null); return true; }}>
      <ProFormDigit
        name='requiredXp'
        label='Required XP'
        rules={[{ required: true }]}
        min={0}
        fieldProps={{ placeholder: 'Enter XP required for this level' }}
      />
      <ProFormText name='title' label='Title' fieldProps={{ placeholder: 'Enter level title (e.g., Navigator)' }} />
    </ModalForm>
  </>;
}
