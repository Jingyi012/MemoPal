import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { ModalForm, ProTable } from '@ant-design/pro-components';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { Button, Popconfirm } from 'antd';
import { useRef, useState, type ReactNode } from 'react';
import { useConfigCrudMutations } from '../hooks/useConfigCrudMutations';

type Props<T extends { id: string }> = {
  title: string;
  list: (page: number, size: number, search: string) => Promise<any>;
  create: (v: any) => Promise<any>;
  update: (id: string, v: any) => Promise<any>;
  remove: (id: string) => Promise<void>;
  columns: ProColumns<T>[];
  form: ReactNode;
};

export function DefinitionCrudTab<T extends { id: string }>(props: Props<T>) {
  const actionRef = useRef<ActionType | null>(null);
  const [editing, setEditing] = useState<T | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const refresh = () => actionRef.current?.reload();

  const { createMutation, updateMutation, deleteMutation } = useConfigCrudMutations({
    create: props.create,
    update: ({ id, payload }: any) => props.update(id, payload),
    remove: props.remove,
    onDone: refresh,
  });

  return (
    <>
      <ProTable<T>
        rowKey='id'
        actionRef={actionRef}
        columns={[
          ...props.columns,
          {
            title: 'Actions', valueType: 'option', render: (_, row: any) => [
              <Button key='e' size='small' icon={<EditOutlined />} onClick={() => setEditing(row)} />,
              <Popconfirm key='d' title='Delete?' onConfirm={() => deleteMutation.mutate(row.id)}><Button danger size='small' icon={<DeleteOutlined />} /></Popconfirm>,
            ]
          },
        ]}
        request={async (params) => {
          const res = await props.list(params.current || 1, params.pageSize || 20, String(params.key || params.name || params.title || ''));
          return { data: res.data, success: res.success, total: res.pagination.totalCount };
        }}
        toolBarRender={() => [<Button key='add' type='primary' icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>New {props.title}</Button>]}
      />

      <ModalForm title={`Create ${props.title}`} open={createOpen} onOpenChange={setCreateOpen} onFinish={async (v) => { await createMutation.mutateAsync(v); setCreateOpen(false); return true; }}>
        {props.form}
      </ModalForm>

      <ModalForm title={`Edit ${props.title}`} open={!!editing} initialValues={editing || {}} onOpenChange={(o) => !o && setEditing(null)} onFinish={async (v) => { if (!editing) return false; await updateMutation.mutateAsync({ id: editing.id, payload: v } as any); setEditing(null); return true; }}>
        {props.form}
      </ModalForm>
    </>
  );
}
