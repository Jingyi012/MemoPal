import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert, App, Col, Form, Input, InputNumber, Modal, Row, Switch } from 'antd';
import { adminPredefinedMemoryLessonCategoriesApi } from '../../../api/adminPredefinedMemoryLessonsApi';
import { extractApiErrorMessage } from '../../../lib/errorMessage';
import type { PredefinedMemoryLessonCategoryDto, PredefinedMemoryLessonCategoryUpsertRequest } from '../../../types/predefinedMemoryLesson';
import { invalidateContentLibrary } from '../hooks/useContentLibrary';

export function CategoryEditor({ category, onClose }: { category?: PredefinedMemoryLessonCategoryDto; onClose: () => void }) {
  const [form] = Form.useForm<PredefinedMemoryLessonCategoryUpsertRequest>();
  const { message, modal } = App.useApp();
  const client = useQueryClient();
  const save = useMutation({
    mutationFn: (input: PredefinedMemoryLessonCategoryUpsertRequest) => category
      ? adminPredefinedMemoryLessonCategoriesApi.update(category.id, { ...input, expectedVersion: category.version })
      : adminPredefinedMemoryLessonCategoriesApi.create(input),
    retry: false, meta: { suppressGlobalErrorToast: true },
    onSuccess: async () => { await invalidateContentLibrary(client); message.success(category ? 'Category updated.' : 'Category created.'); onClose(); },
    onError: error => message.error(extractApiErrorMessage(error, 'Could not save category. Your changes are still here.')),
  });
  const close = () => {
    if (save.isPending) return;
    if (!form.isFieldsTouched()) { onClose(); return; }
    modal.confirm({ title: 'Discard category changes?', okText: 'Discard changes', okButtonProps: { danger: true }, onOk: onClose });
  };
  return <Modal open width={720} title={category ? `Edit ${category.nameEn}` : 'New category'} onCancel={close} onOk={() => form.submit()}
    okText='Save category' confirmLoading={save.isPending} closable={!save.isPending} keyboard={!save.isPending} maskClosable={false}
    cancelButtonProps={{ disabled: save.isPending }} styles={{ body: { maxHeight: '70vh', overflowY: 'auto', overflowX: 'hidden', paddingInline: 10 } }}>
    <Form form={form} layout='vertical' disabled={save.isPending}
      initialValues={category ?? { key: '', nameEn: '', nameZh: '', descriptionEn: '', descriptionZh: '', emoji: '📚', sortOrder: 100, isActive: true }}
      onFinish={input => {
        if (category?.isActive && !input.isActive) modal.confirm({ title: 'Hide this category?', content: 'This category and its lessons will no longer appear in the public catalogue. Collections using it may also become unavailable.', okText: 'Hide category', onOk: () => save.mutateAsync(input) });
        else save.mutate(input);
      }}>
      <Row gutter={18}>
        <Col xs={24} sm={16}><Form.Item name='key' label='Stable key' extra='Lowercase words separated by single hyphens.' rules={[{ required: true, min: 2, max: 100, pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/, message: 'Use 2–100 lowercase letters or numbers with single hyphens.' }]}><Input maxLength={100} placeholder='language-learning' /></Form.Item></Col>
        <Col xs={24} sm={8}><Form.Item name='emoji' label='Emoji' rules={[{ required: true, whitespace: true, max: 32 }]}><Input maxLength={32} /></Form.Item></Col>
        <Col xs={24} sm={12}><Form.Item name='nameEn' label='English name' rules={[{ required: true, whitespace: true, max: 120 }]}><Input maxLength={120} placeholder='Languages' /></Form.Item></Col>
        <Col xs={24} sm={12}><Form.Item name='nameZh' label='Chinese name' rules={[{ required: true, whitespace: true, max: 120 }]}><Input maxLength={120} placeholder='语言学习' /></Form.Item></Col>
        <Col xs={24} sm={12}><Form.Item name='descriptionEn' label='English description'><Input.TextArea rows={3} maxLength={500} showCount /></Form.Item></Col>
        <Col xs={24} sm={12}><Form.Item name='descriptionZh' label='Chinese description'><Input.TextArea rows={3} maxLength={500} showCount /></Form.Item></Col>
        <Col xs={24} sm={12}><Form.Item name='sortOrder' label='Display order' rules={[{ required: true, type: 'number', min: 0, max: 10000 }]} extra='Lower numbers appear first.'><InputNumber min={0} max={10000} precision={0} style={{ width: '100%' }} /></Form.Item></Col>
        <Col xs={24} sm={12}><Form.Item name='isActive' label='Catalogue visibility' valuePropName='checked'><Switch checkedChildren='Active' unCheckedChildren='Hidden' /></Form.Item></Col>
      </Row>
      <Alert showIcon type='info' message='Categories group lessons and collections by topic. Use collections to arrange lessons into a learning sequence.' />
    </Form>
  </Modal>;
}
