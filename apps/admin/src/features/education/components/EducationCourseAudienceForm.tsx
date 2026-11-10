import { useEffect } from 'react';
import { App, Button, Card, Form, Select, Typography } from 'antd';
import type { EducationCourseAudienceRequest, EducationCourseDto } from '../../../types/educationAuthoring';
import { useEducationText } from '../i18n/useEducationText';

export function EducationCourseAudienceForm({ course, saving, onSave }: {
  course: EducationCourseDto;
  saving: boolean;
  onSave: (input: EducationCourseAudienceRequest) => Promise<unknown>;
}) {
  const [form] = Form.useForm<EducationCourseAudienceRequest>();
  const { language } = useEducationText();
  const zh = language === 'zh-Hans';
  const { message } = App.useApp();
  useEffect(() => { form.setFieldsValue({ subjectCode: course.subjectCode ?? null, learningStage: course.learningStage ?? null, languageCode: course.languageCode ?? null }); }, [course.id, course.subjectCode, course.learningStage, course.languageCode, form]);
  const options = (items: string[][]) => items.map(([value, chinese, english]) => ({ value, label: zh ? chinese : english }));
  return <Card title={zh ? '适合谁来学' : 'Who is this course for?'}>
    <Typography.Paragraph type="secondary">{zh ? '用于学习页的分类与筛选。尚未确认时可以留空；内容语言与界面语言不同。' : 'Used to organize and filter learning content. Leave unknown values unset. Content language is separate from interface language.'}</Typography.Paragraph>
    <Form form={form} layout="vertical" onFinish={async values => {
      try {
        await onSave({ subjectCode: values.subjectCode ?? null, learningStage: values.learningStage ?? null, languageCode: values.languageCode ?? null });
        message.success(zh ? '课程适用信息已保存' : 'Course audience saved');
      } catch { /* The mutation reports the API error and keeps the draft visible. */ }
    }}>
      <Form.Item name="subjectCode" label={zh ? '学科' : 'Subject'}><Select allowClear options={options([['chinese', '中文', 'Chinese'], ['english', '英语', 'English'], ['math', '数学', 'Math'], ['science', '科学', 'Science'], ['history', '历史', 'History'], ['geography', '地理', 'Geography'], ['other', '其他', 'Other']])} /></Form.Item>
      <Form.Item name="learningStage" label={zh ? '学习阶段' : 'Learning stage'}><Select allowClear options={options([['early-primary', '小学低年级', 'Early primary'], ['upper-primary', '小学高年级', 'Upper primary'], ['secondary', '中学', 'Secondary'], ['general', '通用体验', 'General exploration']])} /></Form.Item>
      <Form.Item name="languageCode" label={zh ? '主要内容语言' : 'Primary content language'}><Select allowClear options={options([['zh-Hans', '简体中文', 'Simplified Chinese'], ['en', '英语', 'English'], ['ms', '马来语', 'Malay']])} /></Form.Item>
      <Button type="primary" htmlType="submit" loading={saving}>{zh ? '保存适用信息' : 'Save audience'}</Button>
    </Form>
  </Card>;
}
