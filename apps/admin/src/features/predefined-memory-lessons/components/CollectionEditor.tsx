import { Button, Col, Form, Input, InputNumber, Row, Select, Space, Switch, Typography } from 'antd';
import type { MemoryCollectionDto, MemoryCollectionInput } from '../../../api/adminMemoryCollectionsApi';
import type { PredefinedMemoryLessonCategoryDto, PredefinedMemoryLessonDto } from '../../../types/predefinedMemoryLesson';

export function CollectionEditor({ current, categories, lessons, pending, onSave, onCancel }: {
  current?: MemoryCollectionDto; categories: PredefinedMemoryLessonCategoryDto[]; lessons: PredefinedMemoryLessonDto[];
  pending: boolean; onSave: (input: MemoryCollectionInput) => void; onCancel: () => void;
}) {
  const [form] = Form.useForm<MemoryCollectionInput>();
  const selectedLessonIds: string[] = Form.useWatch('lessonIds', form) ?? [];
  return (
    <Form form={form} layout="vertical" disabled={pending} initialValues={current ? { ...current, expectedVersion: current.version, lessonIds: current.lessons.map(l => l.id) } : { emoji: '📚', descriptionEn: '', descriptionZh: '', sortOrder: 100, isPublished: false, lessonIds: [] }} onFinish={onSave}>
      <Form.Item name="expectedVersion" hidden><InputNumber /></Form.Item>
      <section className="library-editor-section"><Typography.Title level={4}>Collection details</Typography.Title><Typography.Paragraph type="secondary">Give this collection a clear identity in both languages.</Typography.Paragraph><Row gutter={24}><Col xs={24} md={12}><Form.Item name="titleZh" label="Chinese title" rules={[{ required: true, whitespace: true, max: 200 }]}><Input maxLength={200} placeholder="中文听写集1" /></Form.Item></Col><Col xs={24} md={12}>
      <Form.Item name="titleEn" label="English title" rules={[{ required: true, whitespace: true, max: 200 }]}><Input maxLength={200} placeholder="Chinese dictation · Level 1" /></Form.Item></Col></Row><Row gutter={24}><Col xs={24} md={12}>
      <Form.Item name="descriptionZh" label="Chinese description" rules={[{ max: 500 }]}><Input.TextArea rows={3} maxLength={500} showCount /></Form.Item></Col><Col xs={24} md={12}>
      <Form.Item name="descriptionEn" label="English description" rules={[{ max: 500 }]}><Input.TextArea rows={3} maxLength={500} showCount /></Form.Item></Col></Row><Row gutter={24}><Col xs={24} md={8}>
      <Form.Item name="emoji" label="Artwork emoji" rules={[{ required: true, max: 32 }]}><Input maxLength={32} /></Form.Item></Col><Col xs={24} md={16}>
      <Form.Item name="categoryId" label="Category" rules={[{ required: true }]}><Select options={categories?.map((item) => ({ value: item.id, label: `${item.nameZh} / ${item.nameEn}` }))} /></Form.Item>
      </Col></Row></section><section className="library-editor-section"><Typography.Title level={4}>Lessons & order</Typography.Title>
      <Form.Item name="lessonIds" label="Lessons in collection" extra="Add lessons from the collection workspace, then arrange their order below. A collection can contain up to 100 lessons. Adding an existing lesson keeps its other collection memberships."
        rules={[{ type: 'array', max: 100 }]}>
        <Select mode="multiple" optionFilterProp="label" options={lessons?.map((item) => ({ value: item.id, label: `${item.titleZh} / ${item.titleEn} · ${item.techniqueKey}${item.isPublished ? '' : ' (draft)'}` }))} />
      </Form.Item>
      {selectedLessonIds.length > 0 && <Space direction="vertical" style={{ width: '100%', marginBottom: 24 }}>
        <Typography.Text strong>Course order · {selectedLessonIds.length} lessons</Typography.Text>
        {selectedLessonIds.map((lessonId: string, index: number) => {
          const lesson = lessons?.find((item) => item.id === lessonId);
          const move = (offset: number) => {
            const reordered = [...selectedLessonIds];
            [reordered[index], reordered[index + offset]] = [reordered[index + offset], reordered[index]];
            form.setFieldValue('lessonIds', reordered);
          };
          return <Space key={lessonId} wrap>
            <Typography.Text>{index + 1}. {lesson ? `${lesson.titleZh} / ${lesson.titleEn}` : 'Unavailable lesson'}</Typography.Text>
            <Button aria-label={`Move course ${index + 1} up`} disabled={pending || index === 0} onClick={() => move(-1)}>Move up</Button>
            <Button aria-label={`Move course ${index + 1} down`} disabled={pending || index === selectedLessonIds.length - 1} onClick={() => move(1)}>Move down</Button>
          </Space>;
        })}
      </Space>}
      </section><section className="library-editor-section"><Typography.Title level={4}>Publishing</Typography.Title>
      <Form.Item name="sortOrder" label="Sort order"><InputNumber min={0} max={10000} /></Form.Item>
      <Form.Item name="isPublished" label="Published" valuePropName="checked" extra="Publishing requires an active category and published lessons. Unpublish to remove this collection from the catalogue; downloaded copies remain with users."><Switch /></Form.Item>
      </section><Space><Button onClick={onCancel}>Cancel</Button><Button type="primary" htmlType="submit" loading={pending}>Save collection</Button></Space>
    </Form>
  );
}
