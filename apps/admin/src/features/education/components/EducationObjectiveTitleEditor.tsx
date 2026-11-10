import { useEffect } from 'react';
import { Button, Form, Input } from 'antd';
import { useEducationText } from '../i18n/useEducationText';
import { unicodeCodePointLength } from '../utils/educationStudyItems';

export function EducationObjectiveTitleEditor({ title, loading, onSave }: { title: string; loading: boolean; onSave: (title: string) => Promise<void> }) {
  const { language, t } = useEducationText();
  const label = language === 'zh-Hans' ? '知识点名称' : 'Knowledge point title';
  const [form] = Form.useForm<{ title: string }>();
  useEffect(() => { form.setFieldsValue({ title }); }, [title, form]);
  return <Form form={form} layout="vertical" onFinish={async value => { try { await onSave(value.title); } catch { /* The mutation displays the error; retain the edited title for retry. */ } }}>
    <Form.Item name="title" label={label} rules={[{required:true,whitespace:true}, {validator:(_, value?:string)=>unicodeCodePointLength(value??'')<=200?Promise.resolve():Promise.reject(new Error(t('overLimit')))}]}>
      <Input aria-label={label} />
    </Form.Item>
    <Button type="primary" htmlType="submit" loading={loading}>{t('save')}</Button>
  </Form>;
}
