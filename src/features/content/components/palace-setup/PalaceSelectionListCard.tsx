import { EyeOutlined } from '@ant-design/icons';
import { Button, Card, Table, Tag } from 'antd';
import type { TablePaginationConfig } from 'antd/es/table';

export interface PalaceSelectionItem {
  id: string;
  name: string;
  level: number;
  isCustom: boolean;
  locationsCount: number;
  lessonsCount: number;
}

interface PalaceSelectionListCardProps {
  title: string;
  palaces: PalaceSelectionItem[];
  selectedPalaceId?: string;
  loading?: boolean;
  emptyText: string;
  onViewPalace: (palaceId: string) => void;
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    onChange: NonNullable<TablePaginationConfig['onChange']>;
  };
}

export function PalaceSelectionListCard({
  title,
  palaces,
  selectedPalaceId,
  loading,
  emptyText,
  onViewPalace,
  pagination,
}: PalaceSelectionListCardProps) {
  return (
    <Card title={title}>
      <Table<PalaceSelectionItem>
        rowKey='id'
        size='small'
        loading={loading}
        dataSource={palaces}
        locale={{ emptyText }}
        pagination={
          pagination
            ? {
                current: pagination.current,
                pageSize: pagination.pageSize,
                total: pagination.total,
                onChange: pagination.onChange,
                showSizeChanger: true,
                showTotal: (total) => `Total ${total}`,
              }
            : false
        }
        columns={[
          { title: 'Name', dataIndex: 'name' },
          { title: 'Level', dataIndex: 'level', width: 78 },
          { title: 'Locations', dataIndex: 'locationsCount', width: 88 },
          { title: 'Lessons', dataIndex: 'lessonsCount', width: 80 },
          {
            title: 'Type',
            width: 94,
            render: (_, row) => (row.isCustom ? <Tag color='gold'>Custom</Tag> : <Tag>System</Tag>),
          },
          {
            title: 'Actions',
            width: 96,
            render: (_, row) => (
              <Button
                size='small'
                icon={<EyeOutlined />}
                type={selectedPalaceId === row.id ? 'primary' : 'default'}
                onClick={() => onViewPalace(row.id)}
              >
                View
              </Button>
            ),
          },
        ]}
      />
    </Card>
  );
}
