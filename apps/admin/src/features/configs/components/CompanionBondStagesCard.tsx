import { SaveOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App, Button, Card, Form, Input, InputNumber, Space, Typography } from 'antd';
import { useEffect } from 'react';
import { adminSystemSettingsApi } from '../../../api/adminSystemSettingsApi';

const SETTING_KEY = 'companion.bond_stages';
type Stage = { key: string; points: number; titleEn: string; titleZh: string; messageEn: string; messageZh: string };

export function CompanionBondStagesCard() {
  const [form] = Form.useForm<{ stages: Stage[] }>();
  const queryClient = useQueryClient();
  const { message } = App.useApp();
  const setting = useQuery({
    queryKey: ['admin-system-settings', SETTING_KEY],
    queryFn: () => adminSystemSettingsApi.getByKey(SETTING_KEY),
  });
  useEffect(() => {
    if (!setting.data) return;
    try { form.setFieldsValue({ stages: JSON.parse(setting.data.value) as Stage[] }); }
    catch { message.error('Bond stage configuration is invalid.'); }
  }, [form, message, setting.data]);

  const save = useMutation({
    mutationFn: (stages: Stage[]) => adminSystemSettingsApi.upsert({
      key: SETTING_KEY,
      value: JSON.stringify(stages),
      description: 'Companion bond progression milestones, localized labels, and point thresholds.',
    }),
    onSuccess: () => {
      message.success('Companion progression saved.');
      void queryClient.invalidateQueries({ queryKey: ['admin-system-settings', SETTING_KEY] });
    },
    onError: () => message.error('Could not save companion progression.'),
  });

  return (
    <Card title="Bond progression" extra={<Typography.Text type="secondary">Starts at 0 points · 2–10 stages</Typography.Text>} style={{ marginBottom: 18 }}>
      <Typography.Paragraph type="secondary">Set the names and point milestones that define how a player’s relationship with each companion grows. Keep stage keys stable after launch so past memories remain correctly associated.</Typography.Paragraph>
      {setting.isLoading ? <Typography.Text type="secondary">Loading progression…</Typography.Text> : null}
      {setting.isError ? <Space>
        <Typography.Text type="danger">Could not load saved stages.</Typography.Text>
        <Button size="small" onClick={() => void setting.refetch()}>Retry</Button>
      </Space> : null}
      {!setting.isLoading && !setting.isError ? <Form form={form} layout="vertical" onFinish={(values) => save.mutate(values.stages)}>
        <Form.List name="stages" rules={[{
          validator: async (_, stages: Stage[] = []) => {
            if (stages.length < 2 || stages.length > 10) throw new Error('Add between 2 and 10 stages.');
            if (stages[0]?.points !== 0) throw new Error('The first stage must start at 0 points.');
            const normalizedKeys = stages.map((stage) => stage.key?.trim().toLowerCase());
            if (normalizedKeys.some((key) => !key) || new Set(normalizedKeys).size !== stages.length) throw new Error('Every stage needs a unique stable key.');
            if (stages.some((stage, index) => !stage.titleEn?.trim() || !stage.titleZh?.trim() || (index > 0 && (stage.points <= stages[index - 1].points || !stage.messageEn?.trim() || !stage.messageZh?.trim())))) throw new Error('Fill every name and milestone message, and use increasing point values.');
          },
        }]}>
          {(fields, { add, remove, move }, { errors }) => <Space direction="vertical" size={10} style={{ width: '100%' }}>
            {fields.map((field, index) => <Card key={field.key} size="small" title={`Stage ${index + 1}`} extra={index > 0 ? <Button type="link" onClick={() => move(index, index - 1)}>Move up</Button> : null}>
              <Space align="start" wrap style={{ width: '100%' }}>
                <Form.Item {...field} name={[field.name, 'key']} label="Stable key" rules={[{ required: true }]}><Input placeholder="familiar" maxLength={40} /></Form.Item>
                <Form.Item {...field} name={[field.name, 'points']} label="Points required" rules={[{ required: true }]}><InputNumber min={0} precision={0} /></Form.Item>
                <Form.Item {...field} name={[field.name, 'titleEn']} label="English name" rules={[{ required: true }]}><Input maxLength={80} /></Form.Item>
                <Form.Item {...field} name={[field.name, 'titleZh']} label="Chinese name" rules={[{ required: true }]}><Input maxLength={80} /></Form.Item>
                {index > 0 ? <>
                  <Form.Item {...field} name={[field.name, 'messageEn']} label="Milestone message (EN)" rules={[{ required: true }]}><Input maxLength={160} /></Form.Item>
                  <Form.Item {...field} name={[field.name, 'messageZh']} label="Milestone message (ZH)" rules={[{ required: true }]}><Input maxLength={160} /></Form.Item>
                </> : null}
                {index > 0 ? <Button danger type="link" onClick={() => remove(field.name)}>Remove</Button> : null}
              </Space>
            </Card>)}
            <Form.ErrorList errors={errors} />
            <Space>
              <Button onClick={() => add({ key: '', points: 1, titleEn: '', titleZh: '', messageEn: '', messageZh: '' })} disabled={fields.length >= 10}>Add stage</Button>
              <Button type="primary" icon={<SaveOutlined />} htmlType="submit" loading={save.isPending}>Save progression</Button>
            </Space>
          </Space>}
        </Form.List>
      </Form> : null}
    </Card>
  );
}
