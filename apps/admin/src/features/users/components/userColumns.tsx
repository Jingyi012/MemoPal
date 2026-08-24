import { DeleteOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons';
import type { ProColumns } from '@ant-design/pro-components';
import { Button, Popconfirm, Tag } from 'antd';
import type { ManagedUserDto } from '../../../types/user';

export function buildUserColumns(
  onEdit: (row: ManagedUserDto) => void,
  onDelete: (id: string) => void,
  onViewData: (id: string) => void
): ProColumns<ManagedUserDto>[] {
  return [
    { title: 'Display Name', dataIndex: 'displayName' },
    { title: 'Email', dataIndex: 'email', copyable: true },
    {
      title: 'Role',
      dataIndex: 'role',
      render: (_, row) => <Tag color={row.role === 'Admin' ? 'gold' : 'blue'}>{row.role}</Tag>,
    },
    { title: 'Level', dataIndex: 'level', width: 80 },
    { title: 'XP', dataIndex: 'totalXp', width: 100 },
    {
      title: 'Actions',
      valueType: 'option',
      render: (_, row) => [
        <Button key="view" size="small" icon={<EyeOutlined />} onClick={() => onViewData(row.id)} />,
        <Button key="edit" size="small" icon={<EditOutlined />} onClick={() => onEdit(row)} />,
        <Popconfirm key="del" title="Delete this user?" onConfirm={() => onDelete(row.id)}>
          <Button size="small" danger icon={<DeleteOutlined />} />
        </Popconfirm>,
      ],
    },
  ];
}
