import { useState } from 'react';
import { Alert, Button, Card, Form, Input, Modal, Select, Space, Typography } from 'antd';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { educationAuthoringApi } from '../../../api/educationAuthoringApi';
import { useAuth } from '../../../auth/AuthContext';
import { adminPaths } from '../../../navigation/adminPaths';
import { extractApiErrorMessage } from '../../../lib/errorMessage';
import { educationAuthoringKeys } from '../hooks/useEducationAuthoring';
import { useEducationText } from '../i18n/useEducationText';
import { parseStudyList } from '../utils/parseStudyList';

export function EducationStudyCourseDraftButton() {
  const { language } = useEducationText();
  const zh = language === 'zh-Hans';
  const { user } = useAuth();
  const client = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState(false);
  const [form] = Form.useForm<{ title: string; languageCode: string; text: string; groupSize: number }>();
  const groupSize = Form.useWatch('groupSize', form) ?? 0;
  const text = Form.useWatch('text', form) ?? '';
  const entries = parseStudyList(text);
  const mutation = useMutation({ mutationFn: educationAuthoringApi.createStudyCourseDraft, retry: false,
    meta: { suppressGlobalErrorToast: true },
    onSuccess: async result => {
      await client.invalidateQueries({ queryKey: educationAuthoringKeys.courses(user?.id ?? '') });
      setOpen(false); form.resetFields(); setPreview(false);
      navigate(adminPaths.educationCourse(result.courseId));
    },
  });
  const clueCount = entries.filter(entry => entry.meaning && !entry.meaning.toLocaleLowerCase().includes(entry.text.toLocaleLowerCase())).length;
  return <>
    <Button onClick={() => { mutation.reset(); setOpen(true); }}>{zh ? '用词表制作小课' : 'Turn a word list into lessons'}</Button>
    <Modal title={zh ? '把学习资料变成小课' : 'Create lessons from your material'} open={open} footer={null}
      closable={!mutation.isPending} maskClosable={!mutation.isPending} keyboard={!mutation.isPending}
      onCancel={() => { if (!mutation.isPending) setOpen(false); }}>
      <Form form={form} layout="vertical" initialValues={{ languageCode: zh ? 'zh-Hans' : 'en', groupSize: 0 }}
        onFinish={value => { if (!preview) { setPreview(true); return; } mutation.mutate({ title: value.title, languageCode: value.languageCode, entries, groupSize: value.groupSize || null }); }}>
        <Form.Item name="title" label={zh ? '小课名称' : 'Course title'} rules={[{ required: true, whitespace: true }, { max: 200 }]}><Input disabled={mutation.isPending} /></Form.Item>
        <Form.Item name="languageCode" label={zh ? '内容语言' : 'Content language'} rules={[{ required: true }]}>
          <Select disabled={mutation.isPending} options={[{ value: 'zh-Hans', label: '简体中文' }, { value: 'zh-Hant', label: '繁體中文' }, { value: 'en', label: 'English' }, { value: 'ms', label: 'Bahasa Melayu' }]} />
        </Form.Item>
        <Form.Item name="text" label={zh ? '词表 · 每行一个词，可用 Tab 分隔释义' : 'One word per line · Optional meaning after a tab'}
          rules={[{ validator: (_, value: string) => {
            const rows = parseStudyList(value ?? '');
            return rows.length > 0 && rows.length <= 50 && rows.every(row => row.text && [...row.text].length <= 500 && [...(row.meaning ?? '')].length <= 500)
              && new Set(rows.map(row => row.text.toLocaleLowerCase())).size === rows.length
              ? Promise.resolve() : Promise.reject(new Error(zh ? '请提供 1–50 个不重复的词，每个词和释义最多 500 字。' : 'Use 1–50 unique words; each word and meaning can have up to 500 characters.'));
          } }]}>
          <Input.TextArea rows={6} disabled={mutation.isPending} onChange={() => setPreview(false)} placeholder={'school\t学校\npencil\t铅笔\nbook\t书'} />
        </Form.Item>
        <Form.Item name="groupSize" label={zh ? '学习安排' : 'Study arrangement'}>
          <Select disabled={mutation.isPending} onChange={() => setPreview(false)} options={[
            { value: 0, label: zh ? '全部一起学（一个单元）' : 'Keep together (one unit)' },
            ...Array.from({ length: 50 }, (_, index) => ({ value: index + 1, label: zh ? `每个单元 ${index + 1} 个词条` : `${index + 1} words per unit` })),
          ]} />
        </Form.Item>
        {preview && <Card size="small" style={{ borderRadius: 20, marginBottom: 16 }}>
          <Typography.Title level={5}>{zh ? '生成预览' : 'Draft preview'}</Typography.Title>
          <Typography.Paragraph>{zh ? `${groupSize ? Math.ceil(entries.length / groupSize) : 1} 个单元 · ${entries.length} 张教学卡片 · ${clueCount} 道文字回忆题` : `${groupSize ? Math.ceil(entries.length / groupSize) : 1} units · ${entries.length} study cards · ${clueCount} written recall questions`}</Typography.Paragraph>
          <div style={{ maxHeight: 220, overflowY: 'auto', overflowWrap: 'anywhere' }}>{entries.map((entry, index) => <p key={index}><strong>{entry.text}</strong>{entry.meaning ? ` — ${entry.meaning}` : ''}</p>)}</div>
        </Card>}
        <Alert type="info" role="note" showIcon style={{ marginBottom: 16 }} message={zh ? '仅保存私人草稿，需检查后发布。相同词表与标题会打开原课程，不覆盖你的修改。' : 'Saved as a private draft for review. The same list and title reopens its original course without overwriting edits.'}
          description={zh ? '没有释义或释义包含答案的词只生成学习卡片。这里不会生成听写或口语评分题。' : 'Words without a separate clue create study cards only. This does not generate dictation or speech scoring.'} />
        {mutation.isError && <Alert type="error" role="alert" style={{ marginBottom: 16 }} message={extractApiErrorMessage(mutation.error, zh ? '保存失败，请重试。' : 'Could not save. Please retry.')} />}
        <Space wrap><Button htmlType="submit" type="primary" loading={mutation.isPending}>{preview ? (zh ? '保存并编辑小课' : 'Save and edit lessons') : (zh ? '预览小课' : 'Preview lessons')}</Button>
          {preview && <Button disabled={mutation.isPending} onClick={() => setPreview(false)}>{zh ? '继续修改' : 'Keep editing'}</Button>}</Space>
      </Form>
    </Modal>
  </>;
}
