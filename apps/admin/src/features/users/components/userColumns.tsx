import { DeleteOutlined, EditOutlined, UndoOutlined } from '@ant-design/icons';
import type { ProColumns } from '@ant-design/pro-components';
import { Button, Popconfirm, Space, Tag, Tooltip } from 'antd';
import type { ManagedUserDto } from '../../../types/user';

export function buildUserColumns(
  onEdit: (row: ManagedUserDto) => void,
  onDelete: (id: string) => void,
  onRestore: (id: string) => void,
  currentUserId?: string,
): ProColumns<ManagedUserDto>[] {
  return [
    { title: 'Search users', dataIndex: 'search', hideInTable: true, fieldProps: { placeholder: 'Name or email' } },
    { title: 'Display Name', dataIndex: 'displayName', width: 140, search: false },
    { title: 'Email', dataIndex: 'email', width: 260, search: false, copyable: true },
    {
      title: 'Role',
      dataIndex: 'role',
      width: 80,
      search: false,
      render: (_, row) => <Tag color={row.role === 'Admin' ? 'gold' : 'blue'}>{row.role}</Tag>,
    },
    { title: 'Level', dataIndex: 'level', search: false, width: 70 },
    { title: 'XP', dataIndex: 'totalXp', search: false, width: 70 },
    {
      title: 'Status',
      dataIndex: 'isDeleted',
      width: 90,
      valueType: 'select',
      search: false,
      render: (_, row) => <Tag color={row.isDeleted ? 'default' : 'green'}>{row.isDeleted ? 'Deactivated' : 'Active'}</Tag>,
    },
    {
      title: 'Actions',
      fixed: 'right',
      width: 112,
      valueType: 'option',
      render: (_, row) => row.isDeleted ? (
        <Button size="small" icon={<UndoOutlined />} onClick={() => onRestore(row.id)}>Restore</Button>
      ) : (
        <Space>
          <Tooltip title="Edit user"><Button size="small" aria-label={`Edit ${row.displayName}`} icon={<EditOutlined />} onClick={() => onEdit(row)} /></Tooltip>
          <Tooltip title={row.id === currentUserId ? 'You cannot deactivate your own account.' : 'Deactivate user'}>
            <span>
              <Popconfirm title="Deactivate this user?" description="The account can be restored later." disabled={row.id === currentUserId} onConfirm={() => onDelete(row.id)}>
                <Button size="small" danger disabled={row.id === currentUserId} aria-label={`Deactivate ${row.displayName}`} icon={<DeleteOutlined />} />
              </Popconfirm>
            </span>
          </Tooltip>
        </Space>
      ),
    },
  ];
}
