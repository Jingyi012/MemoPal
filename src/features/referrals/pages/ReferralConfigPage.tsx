import { DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined, SaveOutlined } from '@ant-design/icons';
import { ModalForm, ProFormDigit, ProFormSwitch, ProFormText } from '@ant-design/pro-components';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Alert, App, Button, Card, Col, Form, InputNumber, Popconfirm, Row, Space, Switch, Table, Tag, Typography } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { PortalPageContainer } from '../../../components/PortalPageContainer';
import type { ReferralMilestoneConfigDto, ReferralProgramConfigDto } from '../../../types/referral';
import { useAdminReferralsApi } from '../hooks/useAdminReferralsApi';

type MilestoneFormValues = ReferralMilestoneConfigDto;

function normalizeMilestones(items: ReferralMilestoneConfigDto[]): ReferralMilestoneConfigDto[] {
  return [...items]
    .map((item, index) => ({
      ...item,
      key: item.key.trim(),
      title: item.title.trim(),
      rewardLabel: item.rewardLabel?.trim() || null,
      referralsRequired: Math.max(1, Number(item.referralsRequired) || 1),
      rewardXp: Math.max(0, Number(item.rewardXp) || 0),
      rewardPremiumDays: Math.max(0, Number(item.rewardPremiumDays) || 0),
      sortOrder: item.sortOrder > 0 ? item.sortOrder : index + 1,
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder || a.referralsRequired - b.referralsRequired)
    .map((item, index) => ({ ...item, sortOrder: index + 1 }));
}

function serializeForDiff(config: ReferralProgramConfigDto | null, milestones: ReferralMilestoneConfigDto[]) {
  if (!config) return '';
  return JSON.stringify({
    ...config,
    milestones: normalizeMilestones(milestones),
  });
}

export default function ReferralConfigPage() {
  const { message } = App.useApp();
  const { getConfig, updateConfig } = useAdminReferralsApi();
  const [form] = Form.useForm<ReferralProgramConfigDto>();
  const watchedValues = Form.useWatch([], form);
  const [milestones, setMilestones] = useState<ReferralMilestoneConfigDto[]>([]);
  const [editing, setEditing] = useState<ReferralMilestoneConfigDto | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [baselineSerialized, setBaselineSerialized] = useState('');

  const configQuery = useQuery({
    queryKey: ['admin-referral-config'],
    queryFn: getConfig,
  });

  useEffect(() => {
    if (!configQuery.data) return;
    form.setFieldsValue(configQuery.data);
    setMilestones(configQuery.data.milestones ?? []);
    setBaselineSerialized(
      serializeForDiff(configQuery.data, configQuery.data.milestones ?? [])
    );
  }, [configQuery.data, form]);

  const saveMutation = useMutation({
    mutationFn: (payload: ReferralProgramConfigDto) => updateConfig(payload),
    onSuccess: (next) => {
      form.setFieldsValue(next);
      setMilestones(next.milestones ?? []);
      setBaselineSerialized(serializeForDiff(next, next.milestones ?? []));
      message.success('Referral reward configuration updated.');
    },
  });

  const sortedMilestones = useMemo(() => normalizeMilestones(milestones), [milestones]);

  const hasChanges = useMemo(() => {
    return serializeForDiff((watchedValues as ReferralProgramConfigDto) ?? null, sortedMilestones) !== baselineSerialized;
  }, [baselineSerialized, sortedMilestones, watchedValues]);

  const handleReload = async () => {
    const latest = await configQuery.refetch();
    if (latest.data) {
      form.setFieldsValue(latest.data);
      setMilestones(latest.data.milestones ?? []);
      setBaselineSerialized(
        serializeForDiff(latest.data, latest.data.milestones ?? [])
      );
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const payload: ReferralProgramConfigDto = {
        ...values,
        milestones: normalizeMilestones(sortedMilestones),
      };
      await saveMutation.mutateAsync(payload);
    } catch {
      // form validation already indicates field errors
    }
  };

  const upsertMilestone = (values: MilestoneFormValues, mode: 'create' | 'edit', originalKey?: string) => {
    const normalized = {
      ...values,
      key: values.key.trim(),
      title: values.title.trim(),
      rewardLabel: values.rewardLabel?.trim() || null,
      referralsRequired: Math.max(1, Number(values.referralsRequired) || 1),
      rewardXp: Math.max(0, Number(values.rewardXp) || 0),
      rewardPremiumDays: Math.max(0, Number(values.rewardPremiumDays) || 0),
      sortOrder: Math.max(1, Number(values.sortOrder) || 1),
    };

    setMilestones((current) => {
      const withoutCurrent = mode === 'edit' && originalKey
        ? current.filter((item) => item.key !== originalKey)
        : current;

      const duplicate = withoutCurrent.some((item) => item.key === normalized.key);
      if (duplicate) {
        message.error('Milestone key must be unique.');
        return current;
      }

      return normalizeMilestones([...withoutCurrent, normalized]);
    });
  };

  return (
    <PortalPageContainer>
      <Card
        title='Referral Rewards'
        loading={configQuery.isLoading}
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => void handleReload()} disabled={saveMutation.isPending}>
              Reload
            </Button>
            <Button
              type='primary'
              icon={<SaveOutlined />}
              onClick={() => void handleSave()}
              loading={saveMutation.isPending}
              disabled={!hasChanges}
            >
              Save
            </Button>
          </Space>
        }
      >
        <Space direction='vertical' size={16} style={{ width: '100%' }}>
          <Alert
            type='info'
            showIcon
            message='Users redeem a referral code once. Rewards are granted immediately to both users.'
          />

          <Form form={form} layout='vertical'>
            <Card size='small' title='Base Rewards'>
              <Space direction='vertical' size={0} style={{ width: '100%' }}>
                <Form.Item
                  name='isEnabled'
                  label='Enable Referral Program'
                  valuePropName='checked'
                  rules={[{ required: true }]}
                >
                  <Switch checkedChildren='Enabled' unCheckedChildren='Disabled' />
                </Form.Item>
                <Typography.Text type='secondary'>
                  Disable this to temporarily block referral redemptions while keeping existing data.
                </Typography.Text>
              </Space>

              <Row gutter={12} style={{ marginTop: 12 }}>
                <Col xs={24} md={12} lg={8}>
                  <Form.Item name='inviterRewardXp' label='Inviter XP Per Referral' rules={[{ required: true }]}>
                    <InputNumber style={{ width: '100%' }} min={0} placeholder='e.g. 80' />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12} lg={8}>
                  <Form.Item
                    name='inviterRewardPremiumDays'
                    label='Inviter Premium Days Per Referral'
                    rules={[{ required: true }]}
                  >
                    <InputNumber style={{ width: '100%' }} min={0} placeholder='e.g. 3' />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12} lg={8}>
                  <Form.Item name='inviteeRewardXp' label='Invitee XP On Redeem' rules={[{ required: true }]}>
                    <InputNumber style={{ width: '100%' }} min={0} placeholder='e.g. 40' />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12} lg={8}>
                  <Form.Item
                    name='inviteeRewardPremiumDays'
                    label='Invitee Premium Days On Redeem'
                    rules={[{ required: true }]}
                  >
                    <InputNumber style={{ width: '100%' }} min={0} placeholder='e.g. 2' />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12} lg={8}>
                  <Form.Item
                    name='maxSuccessfulReferralsPerUser'
                    label='Max Rewarded Referrals Per User (0 = unlimited)'
                    rules={[{ required: true }]}
                  >
                    <InputNumber style={{ width: '100%' }} min={0} placeholder='e.g. 100' />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </Form>

          <Card
            size='small'
            title='Milestone Rewards'
            extra={
              <Button icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
                Add Milestone
              </Button>
            }
          >
            <Table<ReferralMilestoneConfigDto>
              rowKey='key'
              pagination={false}
              dataSource={sortedMilestones}
              locale={{ emptyText: 'No milestone rewards configured.' }}
              columns={[
                { title: 'Order', dataIndex: 'sortOrder', width: 72 },
                { title: 'Key', dataIndex: 'key', width: 170 },
                { title: 'Title', dataIndex: 'title' },
                { title: 'Referrals', dataIndex: 'referralsRequired', width: 96 },
                { title: 'XP', dataIndex: 'rewardXp', width: 90 },
                { title: 'Premium Days', dataIndex: 'rewardPremiumDays', width: 120 },
                {
                  title: 'Reward Label',
                  dataIndex: 'rewardLabel',
                  width: 240,
                  render: (value: string | null) => value || '-',
                },
                {
                  title: 'Status',
                  dataIndex: 'isActive',
                  width: 100,
                  render: (value: boolean) => (
                    <Tag color={value ? 'green' : 'default'}>{value ? 'Active' : 'Inactive'}</Tag>
                  ),
                },
                {
                  title: 'Actions',
                  width: 120,
                  render: (_, row) => (
                    <Space>
                      <Button size='small' icon={<EditOutlined />} onClick={() => setEditing(row)} />
                      <Popconfirm
                        title='Delete this milestone reward?'
                        onConfirm={() =>
                          setMilestones((current) => normalizeMilestones(current.filter((item) => item.key !== row.key)))
                        }
                      >
                        <Button size='small' icon={<DeleteOutlined />} danger />
                      </Popconfirm>
                    </Space>
                  ),
                },
              ]}
            />
          </Card>
        </Space>
      </Card>

      <ModalForm<MilestoneFormValues>
        title='Add Milestone Reward'
        open={createOpen}
        modalProps={{ destroyOnClose: true }}
        onOpenChange={setCreateOpen}
        initialValues={{
          key: '',
          title: '',
          referralsRequired: Math.max(1, sortedMilestones.length + 1),
          rewardXp: 0,
          rewardPremiumDays: 0,
          rewardLabel: '',
          isActive: true,
          sortOrder: sortedMilestones.length + 1,
        }}
        onFinish={async (values) => {
          upsertMilestone(values, 'create');
          setCreateOpen(false);
          return true;
        }}
      >
        <ProFormText
          name='key'
          label='Milestone Key'
          rules={[{ required: true }]}
          fieldProps={{ placeholder: 'e.g. referral_3' }}
        />
        <ProFormText
          name='title'
          label='Title'
          rules={[{ required: true }]}
          fieldProps={{ placeholder: 'e.g. Community Starter' }}
        />
        <ProFormDigit
          name='referralsRequired'
          label='Referrals Required'
          min={1}
          rules={[{ required: true }]}
          fieldProps={{ placeholder: 'e.g. 3' }}
        />
        <ProFormDigit
          name='rewardXp'
          label='Reward XP'
          min={0}
          rules={[{ required: true }]}
          fieldProps={{ placeholder: 'e.g. 250' }}
        />
        <ProFormDigit
          name='rewardPremiumDays'
          label='Reward Premium Days'
          min={0}
          rules={[{ required: true }]}
          fieldProps={{ placeholder: 'e.g. 7' }}
        />
        <ProFormText
          name='rewardLabel'
          label='Reward Label'
          fieldProps={{ placeholder: 'e.g. 250 XP + 7 Premium Days' }}
        />
        <ProFormDigit
          name='sortOrder'
          label='Sort Order'
          min={1}
          rules={[{ required: true }]}
          fieldProps={{ placeholder: 'e.g. 1' }}
        />
        <ProFormSwitch name='isActive' label='Active' />
      </ModalForm>

      <ModalForm<MilestoneFormValues>
        key={editing?.key ?? 'edit-referral-milestone'}
        title='Edit Milestone Reward'
        open={!!editing}
        modalProps={{ destroyOnClose: true }}
        onOpenChange={(open) => {
          if (!open) {
            setEditing(null);
          }
        }}
        initialValues={editing ? { ...editing } : undefined}
        onFinish={async (values) => {
          if (!editing) return false;
          upsertMilestone(values, 'edit', editing.key);
          setEditing(null);
          return true;
        }}
      >
        <ProFormText name='key' label='Milestone Key' disabled />
        <ProFormText
          name='title'
          label='Title'
          rules={[{ required: true }]}
          fieldProps={{ placeholder: 'e.g. Community Starter' }}
        />
        <ProFormDigit
          name='referralsRequired'
          label='Referrals Required'
          min={1}
          rules={[{ required: true }]}
          fieldProps={{ placeholder: 'e.g. 3' }}
        />
        <ProFormDigit
          name='rewardXp'
          label='Reward XP'
          min={0}
          rules={[{ required: true }]}
          fieldProps={{ placeholder: 'e.g. 250' }}
        />
        <ProFormDigit
          name='rewardPremiumDays'
          label='Reward Premium Days'
          min={0}
          rules={[{ required: true }]}
          fieldProps={{ placeholder: 'e.g. 7' }}
        />
        <ProFormText
          name='rewardLabel'
          label='Reward Label'
          fieldProps={{ placeholder: 'e.g. 250 XP + 7 Premium Days' }}
        />
        <ProFormDigit
          name='sortOrder'
          label='Sort Order'
          min={1}
          rules={[{ required: true }]}
          fieldProps={{ placeholder: 'e.g. 1' }}
        />
        <ProFormSwitch name='isActive' label='Active' />
      </ModalForm>
    </PortalPageContainer>
  );
}
