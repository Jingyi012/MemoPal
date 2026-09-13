import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, App, Button, Form, Input, InputNumber, Select, Space, Spin, Switch, Typography } from 'antd';
import { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { adminMemoryCollectionsApi, type MemoryCollectionInput } from '../../../api/adminMemoryCollectionsApi';
import { adminPredefinedMemoryLessonCategoriesApi, adminPredefinedMemoryLessonsApi } from '../../../api/adminPredefinedMemoryLessonsApi';
import { PortalPageContainer } from '../../../components/PortalPageContainer';
import { extractApiErrorMessage } from '../../../lib/errorMessage';
import { adminPaths } from '../../../navigation/adminPaths';

export default function MemoryCollectionEditorPage() {
  const { collectionId } = useParams();
  const id = collectionId === 'new' ? undefined : collectionId;
  const navigate = useNavigate();
  const { message } = App.useApp();
  const client = useQueryClient();
  const [form] = Form.useForm<MemoryCollectionInput>();
  const selectedLessonIds = Form.useWatch('lessonIds', form) ?? [];
  const collections = useQuery({ queryKey: ['admin-memory-collections'], queryFn: adminMemoryCollectionsApi.list });
  const categories = useQuery({ queryKey: ['admin-predefined-memory-lesson-categories'], queryFn: adminPredefinedMemoryLessonCategoriesApi.list });
  const lessons = useQuery({ queryKey: ['admin-predefined-memory-lessons'], queryFn: adminPredefinedMemoryLessonsApi.list });
  const current = collections.data?.find((item) => item.id === id);
  useEffect(() => {
    if (current && !form.isFieldsTouched()) form.setFieldsValue({ ...current, expectedVersion: current.version, lessonIds: current.lessons.map((item) => item.id) });
  }, [current, form]);
  const save = useMutation({
    mutationFn: (input: MemoryCollectionInput) => adminMemoryCollectionsApi.save(id, input),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['admin-memory-collections'] });
      message.success('Collection saved.');
      navigate(adminPaths.memoryCollections);
    },
    onError: (error) => message.error(extractApiErrorMessage(error, 'Could not save collection.')),
  });
  if (collections.isLoading || categories.isLoading || lessons.isLoading) return <Spin />;
  if (collections.isError || categories.isError || lessons.isError) return <Alert type="error" message="Could not load collection editor" action={<Button onClick={() => void Promise.all([collections.refetch(), categories.refetch(), lessons.refetch()])}>Retry</Button>} />;
  if (id && !current) return <Alert type="error" message="Collection not found" />;
  return <PortalPageContainer>
    <Link to={adminPaths.memoryCollections}>Back to collections</Link>
    <Typography.Title level={2}>{id ? 'Edit collection' : 'New collection'}</Typography.Title>
    <Form form={form} layout="vertical" initialValues={{ emoji: '📚', descriptionEn: '', descriptionZh: '', sortOrder: 100, isPublished: false, lessonIds: [] }} onFinish={(input) => save.mutate(input)}>
      <Form.Item name="expectedVersion" hidden><InputNumber /></Form.Item>
      <Form.Item name="titleZh" label="Chinese title" rules={[{ required: true, whitespace: true, max: 200 }]}><Input placeholder="中文听写集1" /></Form.Item>
      <Form.Item name="titleEn" label="English title" rules={[{ required: true, whitespace: true, max: 200 }]}><Input /></Form.Item>
      <Form.Item name="descriptionZh" label="Chinese description" rules={[{ max: 500 }]}><Input.TextArea /></Form.Item>
      <Form.Item name="descriptionEn" label="English description" rules={[{ max: 500 }]}><Input.TextArea /></Form.Item>
      <Form.Item name="emoji" label="Artwork emoji" rules={[{ required: true, max: 32 }]}><Input /></Form.Item>
      <Form.Item name="categoryId" label="Category" rules={[{ required: true }]}><Select options={categories.data?.map((item) => ({ value: item.id, label: `${item.nameZh} / ${item.nameEn}` }))} /></Form.Item>
      <Form.Item name="lessonIds" label="Lessons in collection" extra="Create individual lessons in Predefined Lessons, select them here, then arrange their order below. A collection can contain up to 100 lessons."
        rules={[{ type: 'array', max: 100 }]}>
        <Select mode="multiple" optionFilterProp="label" options={lessons.data?.map((item) => ({ value: item.id, label: `${item.titleZh} / ${item.titleEn} · ${item.techniqueKey}${item.isPublished ? '' : ' (draft)'}` }))} />
      </Form.Item>
      {selectedLessonIds.length > 0 && <Space direction="vertical" style={{ width: '100%', marginBottom: 24 }}>
        <Typography.Text strong>Course order · {selectedLessonIds.length} lessons</Typography.Text>
        {selectedLessonIds.map((lessonId: string, index: number) => {
          const lesson = lessons.data?.find((item) => item.id === lessonId);
          const move = (offset: number) => {
            const reordered = [...selectedLessonIds];
            [reordered[index], reordered[index + offset]] = [reordered[index + offset], reordered[index]];
            form.setFieldValue('lessonIds', reordered);
          };
          return <Space key={lessonId} wrap>
            <Typography.Text>{index + 1}. {lesson ? `${lesson.titleZh} / ${lesson.titleEn}` : 'Unavailable lesson'}</Typography.Text>
            <Button aria-label={`Move course ${index + 1} up`} disabled={index === 0} onClick={() => move(-1)}>Move up</Button>
            <Button aria-label={`Move course ${index + 1} down`} disabled={index === selectedLessonIds.length - 1} onClick={() => move(1)}>Move down</Button>
          </Space>;
        })}
      </Space>}
      <Form.Item name="sortOrder" label="Sort order"><InputNumber min={0} max={10000} /></Form.Item>
      <Form.Item name="isPublished" label="Published" valuePropName="checked" extra="Publishing requires an active category and published lessons. Unpublish to remove this collection from the catalogue; downloaded copies remain with users."><Switch /></Form.Item>
      <Space><Button type="primary" htmlType="submit" loading={save.isPending}>Save collection</Button><Link to={adminPaths.predefinedMemoryLessons}>Manage individual lessons</Link></Space>
    </Form>
  </PortalPageContainer>;
}
