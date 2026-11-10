import { App, Alert, Button, Card, Form, Input, Popconfirm, Select, Space, Typography } from 'antd';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { educationAuthoringApi } from '../../../api/educationAuthoringApi';
import { extractApiErrorMessage } from '../../../lib/errorMessage';
import type { EducationCourseOutlineDto, EducationCourseOutlineRequest, EducationObjectiveDto } from '../../../types/educationAuthoring';
import { useEducationText } from '../i18n/useEducationText';

export function EducationCourseOutlineEditor({ userId, courseId, objectives }: {
  userId: string; courseId: string; objectives: EducationObjectiveDto[];
}) {
  const client = useQueryClient();
  const { message } = App.useApp();
  const { language } = useEducationText();
  const zh = language === 'zh-Hans';
  const [reloadKey, setReloadKey] = useState(0);
  const queryKey = ['education', userId, 'courses', courseId, 'outline'];
  const query = useQuery({ queryKey, queryFn: () => educationAuthoringApi.getCourseOutline(courseId), enabled: !!userId && !!courseId, refetchOnWindowFocus: false });
  const save = useMutation({
    mutationFn: (input: EducationCourseOutlineRequest) => educationAuthoringApi.updateCourseOutline(courseId, input),
    onSuccess: result => { client.setQueryData(queryKey, result); message.success(zh ? '学习路径已保存' : 'Learning path saved'); },
    onError: error => { void message.error(extractApiErrorMessage(error, zh ? '保存失败，草稿已保留' : 'Could not save. Your draft is still here.')); },
    retry: false, meta: { suppressGlobalErrorToast: true },
  });
  if (query.isPending) return <Card loading />;
  if (!query.data) return <Alert type="error" message={zh ? '无法加载单元' : 'Could not load units'} action={<Button onClick={() => void query.refetch()}>{zh ? '重试' : 'Retry'}</Button>} />;
  return <Space direction="vertical" style={{ display: 'flex' }}>
    {save.isError ? <Alert type="warning" showIcon message={zh ? '保存未完成。若他人修改了路径，请重新载入后编辑。' : 'Not saved. If someone changed this path, reload before editing.'} action={<Popconfirm title={zh ? '放弃当前草稿并重新载入？' : 'Discard this draft and reload?'} onConfirm={async () => { const result = await query.refetch(); if (!result.isError) { save.reset(); setReloadKey(value => value + 1); } }}><Button>{zh ? '重新载入' : 'Reload'}</Button></Popconfirm>} /> : null}
    <OutlineForm key={`${courseId}:${query.data.version}:${reloadKey}`} outline={query.data} objectives={objectives} saving={save.isPending} onSave={input => save.mutate(input)} zh={zh} />
  </Space>;
}

function OutlineForm({ outline, objectives, saving, onSave, zh }: {
  outline: EducationCourseOutlineDto; objectives: EducationObjectiveDto[]; saving: boolean;
  onSave: (input: EducationCourseOutlineRequest) => void; zh: boolean;
}) {
  const [form] = Form.useForm<{ units: EducationCourseOutlineRequest['units'] }>();
  const units: EducationCourseOutlineRequest['units'] = Form.useWatch('units', form) ?? outline.units;
  const assigned = new Set(units.flatMap(unit => unit?.objectiveIds ?? []));
  return <Form form={form} disabled={saving} layout="vertical" initialValues={{ units: outline.units }} onFinish={values => onSave({ expectedVersion: outline.version, units: values.units.map(unit => ({ id: unit.id ?? null, title: unit.title.trim(), objectiveIds: unit.objectiveIds ?? [] })) })}>
    <Alert type="info" showIcon style={{ marginBottom: 16 }} message={zh ? '按单元编排学习路径' : 'Build a learning path with units'} description={zh ? '先创建知识点，再放入单元。选择顺序就是知识点展示顺序；练习跟随原有知识点关联。保存会更新学生看到的路径。' : 'Create study points, then place them in units. Selection order is display order; practices follow their study-point links. Saving updates the student path.'} />
    <Form.List name="units">{(fields, { add, remove, move }) => <Space direction="vertical" style={{ display: 'flex' }}>
      {fields.map((field, index) => <Card key={field.key} title={`${zh ? '单元' : 'Unit'} ${index + 1}`} extra={<Space wrap>
        <Button disabled={saving || index === 0} aria-label={`${zh ? '上移单元' : 'Move unit up'} ${index + 1}`} onClick={() => move(index, index - 1)}>↑</Button>
        <Button disabled={saving || index === fields.length - 1} aria-label={`${zh ? '下移单元' : 'Move unit down'} ${index + 1}`} onClick={() => move(index, index + 1)}>↓</Button>
        <Popconfirm title={zh ? '移除单元？知识点会保留在未分组中。' : 'Remove unit? Its study points remain ungrouped.'} onConfirm={() => remove(index)}><Button danger disabled={saving}>{zh ? '移除' : 'Remove'}</Button></Popconfirm>
      </Space>}>
        <Form.Item name={[field.name, 'id']} hidden><Input /></Form.Item>
        <Form.Item name={[field.name, 'title']} label={zh ? '单元名称' : 'Unit title'} rules={[{ required: true, whitespace: true }, { max: 200 }]}><Input maxLength={200} /></Form.Item>
        <Form.Item name={[field.name, 'objectiveIds']} label={zh ? '知识点（按选择顺序排列）' : 'Study points (in selection order)'}>
          <Select mode="multiple" optionFilterProp="label" options={objectives.map(objective => ({ value: objective.id, label: objective.title, disabled: assigned.has(objective.id) && !units[index]?.objectiveIds?.includes(objective.id) }))} />
        </Form.Item>
      </Card>)}
      <Button type="dashed" block disabled={saving || fields.length >= 50} onClick={() => add({ id: null, title: '', objectiveIds: [] })}>{zh ? '＋ 添加单元' : '+ Add unit'}</Button>
    </Space>}</Form.List>
    <Card style={{ marginTop: 16 }} title={zh ? '未分组知识点' : 'Ungrouped study points'}>
      <Typography.Paragraph type="secondary">{objectives.filter(objective => !assigned.has(objective.id)).map(objective => objective.title).join(' · ') || (zh ? '全部已安排' : 'Everything is placed')}</Typography.Paragraph>
      <Button type="primary" htmlType="submit" loading={saving}>{zh ? '保存学习路径' : 'Save learning path'}</Button>
    </Card>
  </Form>;
}
