import { DeleteOutlined, PlusOutlined, SaveOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, App, Button, Card, Col, Collapse, Form, Input, InputNumber, Pagination, Row, Select, Space, Switch, Tag, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { adminSystemSettingsApi } from '../../../api/adminSystemSettingsApi';

const SETTING_KEY = 'companion.dialogues';
const TRIGGERS = [
  { value: 'tap', label: 'Tap · everyday interaction' },
  { value: 'star', label: 'Star · after catching a memory star' },
  { value: 'greeting', label: 'Greeting · daily wave' },
  { value: 'practice', label: 'Practice · after review' },
  { value: 'outfit', label: 'Outfit · after changing clothes' },
  { value: 'bond', label: 'Bond · relationship milestone' },
  { value: 'return', label: 'Return · welcome back' },
] as const;
const REACTIONS = [
  { value: 'bounce', label: 'Bounce' },
  { value: 'tilt', label: 'Tilt' },
  { value: 'sparkle', label: 'Sparkle' },
  { value: 'catch_star', label: 'Catch star' },
] as const;

type Trigger = (typeof TRIGGERS)[number]['value'];
type Reaction = (typeof REACTIONS)[number]['value'];
type Character = { companionKey: string; personalityEn: string; personalityZh: string };
type DialogueLine = {
  id: string;
  companionKey: string | null;
  trigger: Trigger;
  stageKey: string | null;
  textEn: string;
  textZh: string;
  reaction: Reaction;
  enabled: boolean;
  weight: number;
};
type DialogueConfig = { characters: Character[]; lines: DialogueLine[] };

const emptyConfig = (): DialogueConfig => ({ characters: [], lines: [] });

function parseDialogueConfig(value: string): DialogueConfig {
  const parsed: unknown = JSON.parse(value);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Expected a dialogue configuration object.');
  const config = parsed as Partial<DialogueConfig>;
  if (!Array.isArray(config.characters) || !Array.isArray(config.lines)) throw new Error('Expected characters and lines arrays.');
  if (config.characters.some((character) => !character || typeof character.companionKey !== 'string' || typeof character.personalityEn !== 'string' || typeof character.personalityZh !== 'string')) {
    throw new Error('A character entry has an invalid shape.');
  }
  if (config.lines.some((line) => !line || typeof line.id !== 'string' || (line.companionKey !== null && typeof line.companionKey !== 'string') || typeof line.trigger !== 'string' || (line.stageKey !== null && typeof line.stageKey !== 'string') || typeof line.textEn !== 'string' || typeof line.textZh !== 'string' || typeof line.reaction !== 'string' || typeof line.enabled !== 'boolean' || typeof line.weight !== 'number')) {
    throw new Error('A dialogue line has an invalid shape.');
  }
  return config as DialogueConfig;
}

function requiredText(label: string, maxLength: number) {
  return [{
    validator: async (_: unknown, value: string | undefined) => {
      const trimmed = value?.trim() ?? '';
      if (!trimmed) throw new Error(`${label} is required.`);
      if (trimmed.length > maxLength) throw new Error(`${label} must be ${maxLength} characters or fewer.`);
    },
  }];
}

function normalizeConfig(values: DialogueConfig): DialogueConfig {
  return {
    characters: values.characters.map((character) => ({
      companionKey: character.companionKey.trim(),
      personalityEn: character.personalityEn.trim(),
      personalityZh: character.personalityZh.trim(),
    })),
    lines: values.lines.map((line) => ({
      id: line.id.trim(),
      companionKey: line.companionKey?.trim() || null,
      trigger: line.trigger,
      stageKey: line.stageKey?.trim() || null,
      textEn: line.textEn.trim(),
      textZh: line.textZh.trim(),
      reaction: line.reaction,
      enabled: line.enabled,
      weight: line.weight,
    })),
  };
}

export function CompanionDialogueCard() {
  const [form] = Form.useForm<DialogueConfig>();
  const [lineSearch, setLineSearch] = useState('');
  const [triggerFilter, setTriggerFilter] = useState<Trigger | ''>('');
  const [linePage, setLinePage] = useState(1);
  const lines = Form.useWatch('lines', form) ?? [];
  const queryClient = useQueryClient();
  const { message } = App.useApp();
  const setting = useQuery({
    queryKey: ['admin-system-settings', SETTING_KEY],
    queryFn: async () => {
      try {
        const saved = await adminSystemSettingsApi.getByKey(SETTING_KEY);
        return saved ? parseDialogueConfig(saved.value) : emptyConfig();
      } catch (error) {
        if ((error as { response?: { status?: number } }).response?.status === 404) return emptyConfig();
        throw error;
      }
    },
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (setting.data) form.setFieldsValue(setting.data);
  }, [form, setting.data]);

  const save = useMutation({
    mutationFn: (values: DialogueConfig) => adminSystemSettingsApi.upsert({
      key: SETTING_KEY,
      value: JSON.stringify(normalizeConfig(values)),
      description: 'Localized companion personalities and contextual interaction dialogue.',
    }),
    onSuccess: () => {
      message.success('Companion dialogue saved.');
      void queryClient.invalidateQueries({ queryKey: ['admin-system-settings', SETTING_KEY] });
    },
  });

  return (
    <Card title="Companion interactions & dialogue" extra={<Tag color="purple">EN + 中文</Tag>} style={{ marginBottom: 18 }}>
      <Typography.Paragraph type="secondary">
        Give each companion a voice, then write short responses for specific moments. A blank companion key makes a line available to all companions; a blank stage key makes it available at every relationship stage. IDs should stay stable after release. Saving this card updates <Typography.Text code>{SETTING_KEY}</Typography.Text>.
      </Typography.Paragraph>
      {setting.isLoading ? <Typography.Text type="secondary">Loading dialogue…</Typography.Text> : null}
      {setting.isError ? (
        <Alert type="error" showIcon style={{ marginBottom: 16 }} message={setting.data ? 'Could not refresh companion dialogue' : 'Could not load companion dialogue'} description={setting.error instanceof Error ? setting.error.message : 'Check the admin API connection.'} action={<Button size="small" onClick={() => void setting.refetch()} loading={setting.isFetching}>Retry</Button>} />
      ) : null}
      {!setting.isLoading && (setting.data !== undefined || !setting.isError) ? (
        <Form form={form} layout="vertical" initialValues={emptyConfig()} onFinish={(values) => save.mutate(values)}>
          {setting.data?.characters.length === 0 && setting.data.lines.length === 0 ? (
            <Alert type="info" showIcon style={{ marginBottom: 18 }} message="No dialogue override saved yet" description="The server's default dialogue remains active. Add at least one line to save an override; this editor does not insert sample lines." />
          ) : null}
          <Typography.Title level={5}>Character voices</Typography.Title>
          <Typography.Paragraph type="secondary">Use the companion catalog’s internal key. Personality notes help editors keep each character’s tone consistent.</Typography.Paragraph>
          <Form.List name="characters" rules={[{
            validator: async (_, entries: Character[] = []) => {
              if (entries.length > 100) throw new Error('Use at most 100 character voices.');
              const keys = entries.map((entry) => entry?.companionKey?.trim().toLowerCase()).filter(Boolean);
              if (new Set(keys).size !== keys.length) throw new Error('Each companion can have only one personality entry.');
            },
          }]}>
            {(fields, { add, remove }, { errors }) => (
              <Space direction="vertical" size={10} style={{ width: '100%' }}>
                {fields.map((field, index) => (
                  <Card key={field.key} size="small" title={`Character ${index + 1}`} extra={<Button danger size="small" icon={<DeleteOutlined />} onClick={() => remove(field.name)}>Remove</Button>}>
                    <Row gutter={16}>
                      <Col xs={24} md={8}><Form.Item {...field} name={[field.name, 'companionKey']} label="Companion key" rules={requiredText('Companion key', 80)}><Input maxLength={80} placeholder="From companion catalog" /></Form.Item></Col>
                      <Col xs={24} md={8}><Form.Item {...field} name={[field.name, 'personalityEn']} label="Personality (EN)" rules={requiredText('English personality', 240)}><Input.TextArea maxLength={240} autoSize={{ minRows: 2, maxRows: 4 }} /></Form.Item></Col>
                      <Col xs={24} md={8}><Form.Item {...field} name={[field.name, 'personalityZh']} label="性格描述 (中文)" rules={requiredText('Chinese personality', 240)}><Input.TextArea maxLength={240} autoSize={{ minRows: 2, maxRows: 4 }} /></Form.Item></Col>
                    </Row>
                  </Card>
                ))}
                <Form.ErrorList errors={errors} />
                <Button icon={<PlusOutlined />} disabled={fields.length >= 100} onClick={() => add({ companionKey: '', personalityEn: '', personalityZh: '' })}>Add character voice</Button>
              </Space>
            )}
          </Form.List>

          <Typography.Title level={5} style={{ marginTop: 28 }}>Dialogue lines <Tag>{lines.length}</Tag></Typography.Title>
          <Typography.Paragraph type="secondary">Search or filter by moment, then expand only the line you want to edit. Weight 1–100 controls how often a line is chosen among matches.</Typography.Paragraph>
          <Space wrap style={{ width: '100%', marginBottom: 12 }}>
            <Input.Search allowClear value={lineSearch} onChange={(event) => { setLineSearch(event.target.value); setLinePage(1); }} placeholder="Search ID, companion or dialogue" style={{ width: 300 }} />
            <Select allowClear value={triggerFilter || undefined} onChange={(value) => { setTriggerFilter(value ?? ''); setLinePage(1); }} placeholder="All moments" style={{ width: 220 }} options={[...TRIGGERS]} />
            <Typography.Text type="secondary">{lines.length} saved · {lines.filter((line: DialogueLine) => line.enabled).length} active</Typography.Text>
          </Space>
          <Form.List name="lines" rules={[{
            validator: async (_, lines: DialogueLine[] = []) => {
              if (lines.length === 0) throw new Error('Add at least one dialogue line.');
              if (lines.length > 500) throw new Error('Use at most 500 dialogue lines.');
              const ids = lines.map((line) => line?.id?.trim().toLowerCase()).filter(Boolean);
              if (new Set(ids).size !== ids.length) throw new Error('Every dialogue ID must be unique.');
              if (lines.some((line) => line?.stageKey !== null && line?.stageKey !== undefined && !line.stageKey.trim())) throw new Error('Clear an unused stage key instead of entering spaces.');
            },
          }]}>
            {(fields, { add, remove }, { errors }) => {
              const query = lineSearch.trim().toLowerCase();
              const filtered = fields.filter((field) => {
                const line = lines[field.name] as DialogueLine | undefined;
                if (!line) return !query && !triggerFilter;
                if (triggerFilter && line.trigger !== triggerFilter) return false;
                if (!query) return true;
                return [line.id, line.companionKey, line.textEn, line.textZh, line.stageKey].some((value) => value?.toLowerCase().includes(query));
              });
              const pageSize = 10;
              const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
              const safePage = Math.min(linePage, pageCount);
              const visibleFields = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
              return (
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                {visibleFields.length ? <Collapse size="small" accordion items={visibleFields.map((field) => {
                  const line = lines[field.name] as DialogueLine | undefined;
                  const moment = TRIGGERS.find((item) => item.value === line?.trigger)?.label ?? 'Choose a moment';
                  const label = <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    <Tag color="purple" style={{ marginInlineEnd: 0, flexShrink: 0 }}>{moment.split(' · ')[0]}</Tag>
                    <div style={{ minWidth: 0, flex: 1, lineHeight: 1.35 }}>
                      <Typography.Text ellipsis style={{ display: 'block', maxWidth: 620 }}>{line?.textZh?.trim() || line?.textEn?.trim() || line?.id || 'New dialogue line'}</Typography.Text>
                      {line?.textZh && line?.textEn ? <Typography.Text type="secondary" ellipsis style={{ display: 'block', maxWidth: 620, fontSize: 11 }}>{line.textEn}</Typography.Text> : null}
                    </div>
                    <Tag color={line?.enabled ? 'green' : 'default'} style={{ marginInlineEnd: 0, flexShrink: 0 }}>{line?.enabled ? 'On' : 'Off'}</Tag>
                  </div>;
                  return {
                    key: String(field.key),
                    label,
                    extra: <Button danger type="text" size="small" icon={<DeleteOutlined />} onClick={(event) => { event.stopPropagation(); remove(field.name); }} />,
                    children: <div style={{ padding: '12px 4px 4px' }}>
                    <Row gutter={16}>
                      <Col xs={24} sm={12} lg={6}><Form.Item {...field} name={[field.name, 'id']} label="Stable ID" rules={[...requiredText('Dialogue ID', 80), { pattern: /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/, message: 'Use letters, numbers, dots, underscores or hyphens.' }]}><Input maxLength={80} placeholder="owl.tap.01" /></Form.Item></Col>
                      <Col xs={24} sm={12} lg={6}><Form.Item {...field} name={[field.name, 'companionKey']} label="Companion key" extra="Optional catalog key; blank means every companion." rules={[{ max: 80 }]}><Input maxLength={80} placeholder="All companions" /></Form.Item></Col>
                      <Col xs={24} sm={12} lg={6}><Form.Item {...field} name={[field.name, 'trigger']} label="Moment" rules={[{ required: true, type: 'enum', enum: TRIGGERS.map((item) => item.value) }]}><Select options={[...TRIGGERS]} /></Form.Item></Col>
                      <Col xs={24} sm={12} lg={6}><Form.Item {...field} name={[field.name, 'stageKey']} label="Relationship stage" extra="Optional stable stage key from Bond progression." rules={[{ max: 40 }]}><Input maxLength={40} placeholder="All stages" /></Form.Item></Col>
                      <Col xs={24} md={12}><Form.Item {...field} name={[field.name, 'textEn']} label="Speech bubble (EN) · 96 max" rules={requiredText('English line', 96)}><Input.TextArea showCount autoSize={{ minRows: 2, maxRows: 3 }} /></Form.Item></Col>
                      <Col xs={24} md={12}><Form.Item {...field} name={[field.name, 'textZh']} label="气泡台词 (中文) · 48 字以内" rules={requiredText('Chinese line', 48)}><Input.TextArea showCount autoSize={{ minRows: 2, maxRows: 3 }} /></Form.Item></Col>
                      <Col xs={12} sm={8}><Form.Item {...field} name={[field.name, 'reaction']} label="Reaction" rules={[{ required: true, type: 'enum', enum: REACTIONS.map((item) => item.value) }]}><Select options={[...REACTIONS]} /></Form.Item></Col>
                      <Col xs={12} sm={8}><Form.Item {...field} name={[field.name, 'weight']} label="Rotation weight" rules={[{ required: true, type: 'integer', min: 1, max: 100 }]}><InputNumber min={1} max={100} precision={0} style={{ width: '100%' }} /></Form.Item></Col>
                      <Col xs={24} sm={8}><Form.Item {...field} name={[field.name, 'enabled']} label="Available to players" valuePropName="checked"><Switch checkedChildren="On" unCheckedChildren="Off" /></Form.Item></Col>
                    </Row>
                    <Form.Item noStyle shouldUpdate>
                      {() => {
                        const currentLine = form.getFieldValue(['lines', field.name]) as DialogueLine | undefined;
                        return <div style={{ borderRadius: 12, padding: '12px 16px', background: '#f7f4ff' }}>
                          <Space wrap size={6}><Typography.Text strong>Speech preview</Typography.Text><Tag>{TRIGGERS.find((item) => item.value === currentLine?.trigger)?.label ?? 'Choose a moment'}</Tag><Tag color="purple">{REACTIONS.find((item) => item.value === currentLine?.reaction)?.label ?? 'Choose a reaction'}</Tag></Space>
                          <Row gutter={12} style={{ marginTop: 8 }}>
                            <Col xs={24} md={12}><Typography.Text type="secondary">EN</Typography.Text><div style={{ marginTop: 4, padding: '9px 12px', borderRadius: 14, background: '#fff', minHeight: 58 }}><span style={{ display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, overflow: 'hidden', overflowWrap: 'anywhere', lineHeight: '20px' }}>{currentLine?.textEn?.trim() || 'Your English line appears here.'}</span></div></Col>
                            <Col xs={24} md={12}><Typography.Text type="secondary">中文</Typography.Text><div style={{ marginTop: 4, padding: '9px 12px', borderRadius: 14, background: '#fff', minHeight: 58 }}><span style={{ display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, overflow: 'hidden', overflowWrap: 'anywhere', lineHeight: '20px' }}>{currentLine?.textZh?.trim() || '中文台词预览'}</span></div></Col>
                          </Row>
                        </div>;
                      }}
                    </Form.Item>
                  </div>,
                  };
                })} /> : <Alert type="info" showIcon message={fields.length ? 'No dialogue lines match these filters.' : 'No dialogue lines yet. Add one to begin.'} />}
                <Pagination size="small" current={safePage} pageSize={pageSize} total={filtered.length} showSizeChanger={false} showTotal={(total, range) => `${range[0]}–${range[1]} of ${total}`} onChange={(page) => setLinePage(page)} style={{ display: filtered.length > pageSize ? 'flex' : 'none', justifyContent: 'flex-end' }} />
                <Form.ErrorList errors={errors} />
                <Button icon={<PlusOutlined />} disabled={fields.length >= 500} onClick={() => { add({ id: '', companionKey: null, trigger: 'tap', stageKey: null, textEn: '', textZh: '', reaction: 'bounce', enabled: true, weight: 1 }); setTriggerFilter(''); setLineSearch(''); setLinePage(Math.ceil((fields.length + 1) / pageSize)); }}>Add dialogue line</Button>
              </Space>
            );
            }}
          </Form.List>
          {save.isError ? <Alert type="error" showIcon style={{ marginTop: 18 }} message="Could not save companion dialogue" description={save.error instanceof Error ? `${save.error.message} Your edits are still here.` : 'Your edits are still here. Check the connection and try saving again.'} /> : null}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={save.isPending}>Save dialogue</Button>
          </div>
        </Form>
      ) : null}
    </Card>
  );
}
