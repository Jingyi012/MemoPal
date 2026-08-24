import { PlusOutlined } from '@ant-design/icons';
import { ProTable } from '@ant-design/pro-components';
import type { ProColumns } from '@ant-design/pro-components';
import { Alert, Button, Card, Space, Typography } from 'antd';
import type { ReactNode } from 'react';
import type { WordDto } from '../../../../types/content';

type LocationOption = {
  label: ReactNode;
  value: string;
  title: string;
};

type LessonWordsListPanelProps = {
  lessonTitle: string;
  locationOptions: LocationOption[];
  words: WordDto[];
  isLoading: boolean;
  columns: ProColumns<WordDto>[];
  onOpenPlanner: () => void;
  onCreateWord: () => void;
};

export function LessonWordsListPanel({
  lessonTitle,
  locationOptions,
  words,
  isLoading,
  columns,
  onOpenPlanner,
  onCreateWord,
}: LessonWordsListPanelProps) {
  return (
    <Card
      title={`Words for "${lessonTitle}"`}
      extra={
        <Space>
          <Button onClick={onOpenPlanner}>Open Planner</Button>
          <Button
            type='primary'
            icon={<PlusOutlined />}
            onClick={onCreateWord}
            disabled={locationOptions.length === 0}
          >
            New Word
          </Button>
        </Space>
      }
    >
      <Space direction='vertical' size={12} style={{ width: '100%' }}>
        <Typography.Text type='secondary'>
          Edit existing words here. Use planner tab for quick bulk setup.
        </Typography.Text>

        {locationOptions.length === 0 ? (
          <Alert
            type='warning'
            showIcon
            message='No locations found for this palace. Please create locations first.'
          />
        ) : null}

        <ProTable<WordDto>
          rowKey='id'
          search={false}
          options={false}
          pagination={false}
          loading={isLoading}
          dataSource={words}
          columns={columns}
        />
      </Space>
    </Card>
  );
}

