import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App, Button, Card, Col, Empty, Flex, Form, Input, InputNumber, Modal, Popconfirm, Row, Spin, Switch, Tag, Typography } from 'antd';
import { useState } from 'react';
import { adminPredefinedMemoryLessonCategoriesApi } from '../../../api/adminPredefinedMemoryLessonsApi';
import { PortalPageContainer } from '../../../components/PortalPageContainer';
import { extractApiErrorMessage } from '../../../lib/errorMessage';
import type { PredefinedMemoryLessonCategoryDto, PredefinedMemoryLessonCategoryUpsertRequest } from '../../../types/predefinedMemoryLesson';

const queryKey = ['admin-predefined-memory-lesson-categories'] as const;
const lessonQueryKey = ['admin-predefined-memory-lessons'] as const;
const blankDraft = (): PredefinedMemoryLessonCategoryUpsertRequest => ({
  key: '', nameEn: '', nameZh: '', descriptionEn: '', descriptionZh: '',
  emoji: '📚', sortOrder: 100, isActive: true,
});

export default function PredefinedMemoryLessonCategoriesPage() {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const categoriesQuery = useQuery({ queryKey, queryFn: adminPredefinedMemoryLessonCategoriesApi.list });
  const [editing, setEditing] = useState<PredefinedMemoryLessonCategoryDto | null>(null);
  const [draft, setDraft] = useState<PredefinedMemoryLessonCategoryUpsertRequest>(blankDraft);
  const [open, setOpen] = useState(false);

  const openEditor = (category?: PredefinedMemoryLessonCategoryDto) => {
    setEditing(category ?? null);
    setDraft(category ? {
      key: category.key,
      nameEn: category.nameEn,
      nameZh: category.nameZh,
      descriptionEn: category.descriptionEn,
      descriptionZh: category.descriptionZh,
      emoji: category.emoji,
      sortOrder: category.sortOrder,
      isActive: category.isActive,
      expectedVersion: category.version,
    } : blankDraft());
    setOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: () => editing
      ? adminPredefinedMemoryLessonCategoriesApi.update(editing.id, draft)
      : adminPredefinedMemoryLessonCategoriesApi.create(draft),
    retry: false,
    onSuccess: () => {
      message.success(editing ? 'Category updated.' : 'Category created.');
      setOpen(false);
      void queryClient.invalidateQueries({ queryKey });
      void queryClient.invalidateQueries({ queryKey: lessonQueryKey });
    },
    onError: (error) => message.error(extractApiErrorMessage(error, 'Could not save category.')),
  });
  const deleteMutation = useMutation({
    mutationFn: adminPredefinedMemoryLessonCategoriesApi.delete,
    retry: false,
    onSuccess: () => {
      message.success('Category deleted.');
      void queryClient.invalidateQueries({ queryKey });
    },
    onError: (error) => message.error(extractApiErrorMessage(error, 'Could not delete category.')),
  });
  const canSave = Boolean(draft.key.trim().length >= 2 && draft.nameEn.trim() && draft.nameZh.trim() && draft.emoji.trim());

  return (
    <PortalPageContainer>
      <Flex justify='space-between' align='center' wrap='wrap' gap={12} style={{ marginBottom: 20 }}>
        <div>
          <Typography.Title level={2} style={{ margin: 0 }}>Lesson Categories</Typography.Title>
          <Typography.Text type='secondary'>Organise lessons into any content type, such as languages, science, daily life, history, or exam revision.</Typography.Text>
        </div>
        <Button type='primary' icon={<PlusOutlined />} onClick={() => openEditor()}>New category</Button>
      </Flex>

      {categoriesQuery.isLoading ? <Spin /> : categoriesQuery.data?.length ? (
        <Row gutter={[16, 16]}>
          {categoriesQuery.data.map((category) => (
            <Col xs={24} md={12} xl={8} key={category.id}>
              <Card actions={[
                <EditOutlined key='edit' onClick={() => openEditor(category)} />,
                <Popconfirm key='delete' title='Delete this category?' description='Categories used by lessons cannot be deleted.' onConfirm={() => deleteMutation.mutate(category.id)}><DeleteOutlined /></Popconfirm>,
              ]}>
                <Flex gap={12} align='flex-start'>
                  <Typography.Text style={{ fontSize: 32, lineHeight: 1 }}>{category.emoji}</Typography.Text>
                  <div>
                    <Typography.Title level={5} style={{ margin: 0 }}>{category.nameEn}</Typography.Title>
                    <Typography.Text>{category.nameZh}</Typography.Text>
                    <div style={{ marginTop: 10 }}><Tag color={category.isActive ? 'green' : 'default'}>{category.isActive ? 'Active' : 'Hidden'}</Tag><Tag>Order {category.sortOrder}</Tag></div>
                  </div>
                </Flex>
              </Card>
            </Col>
          ))}
        </Row>
      ) : <Empty description='No lesson categories yet' />}

      <Modal
        open={open}
        onCancel={() => setOpen(false)}
        title={editing ? `Edit ${editing.nameEn}` : 'Create lesson category'}
        okText={saveMutation.isPending ? 'Saving…' : 'Save category'}
        okButtonProps={{ loading: saveMutation.isPending, disabled: !canSave }}
        onOk={() => saveMutation.mutate()}
      >
        <Form layout='vertical'>
          <Row gutter={12}>
            <Col span={16}><Form.Item label='Stable key' required><Input value={draft.key} placeholder='language-learning' onChange={(event) => setDraft({ ...draft, key: event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })} /></Form.Item></Col>
            <Col span={8}><Form.Item label='Emoji' required><Input value={draft.emoji} onChange={(event) => setDraft({ ...draft, emoji: event.target.value })} /></Form.Item></Col>
            <Col span={12}><Form.Item label='English name' required><Input value={draft.nameEn} onChange={(event) => setDraft({ ...draft, nameEn: event.target.value })} /></Form.Item></Col>
            <Col span={12}><Form.Item label='Chinese name' required><Input value={draft.nameZh} onChange={(event) => setDraft({ ...draft, nameZh: event.target.value })} /></Form.Item></Col>
            <Col span={12}><Form.Item label='English description'><Input.TextArea rows={3} value={draft.descriptionEn} onChange={(event) => setDraft({ ...draft, descriptionEn: event.target.value })} /></Form.Item></Col>
            <Col span={12}><Form.Item label='Chinese description'><Input.TextArea rows={3} value={draft.descriptionZh} onChange={(event) => setDraft({ ...draft, descriptionZh: event.target.value })} /></Form.Item></Col>
            <Col span={12}><Form.Item label='Sort order'><InputNumber min={0} max={10000} value={draft.sortOrder} onChange={(value) => setDraft({ ...draft, sortOrder: value ?? 0 })} style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={12}><Form.Item label='Available in Practice'><Switch checked={draft.isActive} onChange={(isActive) => setDraft({ ...draft, isActive })} checkedChildren='Active' unCheckedChildren='Hidden' /></Form.Item></Col>
          </Row>
        </Form>
      </Modal>
    </PortalPageContainer>
  );
}
