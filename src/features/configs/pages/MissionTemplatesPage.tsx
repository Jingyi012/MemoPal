import { DeleteOutlined, EditOutlined, PlusOutlined, SaveOutlined } from '@ant-design/icons';
import {
  ModalForm,
  ProFormDigit,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { useMutation, useQuery } from '@tanstack/react-query';
import { App, Button, Card, Popconfirm, Space, Table, Tag } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { adminConfigsApi } from '../../../api/adminConfigsApi';
import { PortalPageContainer } from '../../../components/PortalPageContainer';
import type { MissionTemplateDto } from '../../../types/config';

const metricOptions = [
  'reviews_completed',
  'lessons_completed',
  'streak_days',
  'mastered_lessons',
  'words_learned',
].map((value) => ({ label: value, value }));

const periodOptions = ['daily', 'weekly', 'all_time'].map((value) => ({ label: value, value }));

type MissionFormValues = MissionTemplateDto;

export default function MissionTemplatesPage() {
  const { message } = App.useApp();
  const [draft, setDraft] = useState<MissionTemplateDto[]>([]);
  const [editing, setEditing] = useState<MissionTemplateDto | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const query = useQuery({
    queryKey: ['admin-mission-templates'],
    queryFn: () => adminConfigsApi.listMissionTemplates(),
  });

  useEffect(() => {
    if (query.data) {
      setDraft(query.data);
    }
  }, [query.data]);

  const saveMutation = useMutation({
    mutationFn: (payload: MissionTemplateDto[]) => adminConfigsApi.updateMissionTemplates(payload),
    onSuccess: (data) => {
      setDraft(data);
      message.success('Mission templates saved.');
    },
    onError: () => message.error('Failed to save mission templates.'),
  });

  const hasChanges = useMemo(() => JSON.stringify(query.data ?? []) !== JSON.stringify(draft), [query.data, draft]);

  const sortedDraft = useMemo(
    () => [...draft].sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title)),
    [draft]
  );

  const upsertDraftRow = (values: MissionFormValues, mode: 'create' | 'edit') => {
    setDraft((current) => {
      if (mode === 'create') {
        return [...current, values]
          .map((item, index) => ({ ...item, sortOrder: item.sortOrder > 0 ? item.sortOrder : index + 1 }))
          .sort((a, b) => a.sortOrder - b.sortOrder);
      }

      return current
        .map((item) => (item.key === values.key ? values : item))
        .sort((a, b) => a.sortOrder - b.sortOrder);
    });
  };

  return (
    <PortalPageContainer>
      <Card
        title='Mission Templates'
        extra={
          <Space>
            <Button icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
              Add Mission
            </Button>
            <Button
              type='primary'
              icon={<SaveOutlined />}
              disabled={!hasChanges}
              loading={saveMutation.isPending}
              onClick={() => saveMutation.mutate(sortedDraft)}
            >
              Save Templates
            </Button>
          </Space>
        }
      >
        <Table<MissionTemplateDto>
          rowKey='key'
          dataSource={sortedDraft}
          pagination={false}
          loading={query.isLoading}
          columns={[
            { title: 'Order', dataIndex: 'sortOrder', width: 80 },
            { title: 'Key', dataIndex: 'key', width: 180 },
            { title: 'Title', dataIndex: 'title' },
            { title: 'Metric', dataIndex: 'metricType', width: 170 },
            { title: 'Period', dataIndex: 'period', width: 100 },
            { title: 'Target', dataIndex: 'targetValue', width: 90 },
            { title: 'Reward XP', dataIndex: 'rewardXp', width: 100 },
            {
              title: 'Active',
              dataIndex: 'isActive',
              width: 90,
              render: (value: boolean) => <Tag color={value ? 'green' : 'default'}>{value ? 'Yes' : 'No'}</Tag>,
            },
            {
              title: 'Actions',
              width: 120,
              render: (_, row) => (
                <Space>
                  <Button size='small' icon={<EditOutlined />} onClick={() => setEditing(row)} />
                  <Popconfirm
                    title='Delete this mission template?'
                    onConfirm={() =>
                      setDraft((current) =>
                        current
                          .filter((item) => item.key !== row.key)
                          .map((item, index) => ({ ...item, sortOrder: index + 1 }))
                      )
                    }
                  >
                    <Button size='small' danger icon={<DeleteOutlined />} />
                  </Popconfirm>
                </Space>
              ),
            },
          ]}
        />

        <ModalForm<MissionFormValues>
        title='Add Mission Template'
        open={createOpen}
        modalProps={{ destroyOnClose: true }}
        onOpenChange={setCreateOpen}
        initialValues={{
          key: '',
          title: '',
          description: '',
          metricType: 'reviews_completed',
          period: 'daily',
          targetValue: 1,
          rewardXp: 0,
          sortOrder: sortedDraft.length + 1,
          isActive: true,
        }}
        onFinish={async (values) => {
          const keyExists = draft.some((item) => item.key === values.key);
          if (keyExists) {
            message.error('Mission key must be unique.');
            return false;
          }
          upsertDraftRow(values, 'create');
          setCreateOpen(false);
          return true;
        }}
      >
        <ProFormText
          name='key'
          label='Key'
          rules={[{ required: true }]}
          fieldProps={{ placeholder: 'Enter unique mission key (e.g., daily_review_rhythm)' }}
        />
        <ProFormText
          name='title'
          label='Title'
          rules={[{ required: true }]}
          fieldProps={{ placeholder: 'Enter mission title' }}
        />
        <ProFormTextArea
          name='description'
          label='Description'
          fieldProps={{ placeholder: 'Describe this mission goal for users (optional)' }}
        />
        <ProFormSelect
          name='metricType'
          label='Metric Type'
          placeholder='Select metric type'
          rules={[{ required: true }]}
          options={metricOptions}
        />
        <ProFormSelect
          name='period'
          label='Period'
          placeholder='Select mission period'
          rules={[{ required: true }]}
          options={periodOptions}
        />
        <ProFormDigit
          name='targetValue'
          label='Target'
          min={1}
          rules={[{ required: true }]}
          fieldProps={{ placeholder: 'Enter target value' }}
        />
        <ProFormDigit
          name='rewardXp'
          label='Reward XP'
          min={0}
          rules={[{ required: true }]}
          fieldProps={{ placeholder: 'Enter XP reward on completion' }}
        />
        <ProFormDigit
          name='sortOrder'
          label='Sort Order'
          min={1}
          rules={[{ required: true }]}
          fieldProps={{ placeholder: 'Enter display order' }}
        />
        <ProFormSwitch name='isActive' label='Active' />
      </ModalForm>

        <ModalForm<MissionFormValues>
        key={editing?.key ?? 'edit-mission-template'}
        title='Edit Mission Template'
        open={!!editing}
        modalProps={{ destroyOnClose: true }}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        initialValues={editing ? { ...editing } : undefined}
        onFinish={async (values) => {
          if (!editing) return false;
          upsertDraftRow({ ...values, key: editing.key }, 'edit');
          setEditing(null);
          return true;
        }}
      >
        <ProFormText name='key' label='Key' disabled />
        <ProFormText
          name='title'
          label='Title'
          rules={[{ required: true }]}
          fieldProps={{ placeholder: 'Enter mission title' }}
        />
        <ProFormTextArea
          name='description'
          label='Description'
          fieldProps={{ placeholder: 'Describe this mission goal for users (optional)' }}
        />
        <ProFormSelect
          name='metricType'
          label='Metric Type'
          placeholder='Select metric type'
          rules={[{ required: true }]}
          options={metricOptions}
        />
        <ProFormSelect
          name='period'
          label='Period'
          placeholder='Select mission period'
          rules={[{ required: true }]}
          options={periodOptions}
        />
        <ProFormDigit
          name='targetValue'
          label='Target'
          min={1}
          rules={[{ required: true }]}
          fieldProps={{ placeholder: 'Enter target value' }}
        />
        <ProFormDigit
          name='rewardXp'
          label='Reward XP'
          min={0}
          rules={[{ required: true }]}
          fieldProps={{ placeholder: 'Enter XP reward on completion' }}
        />
        <ProFormDigit
          name='sortOrder'
          label='Sort Order'
          min={1}
          rules={[{ required: true }]}
          fieldProps={{ placeholder: 'Enter display order' }}
        />
        <ProFormSwitch name='isActive' label='Active' />
      </ModalForm>
      </Card>
    </PortalPageContainer>
  );
}
