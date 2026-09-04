import { AppstoreOutlined, DeleteOutlined, EditOutlined, PlusOutlined, TableOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App, Button, Card, Col, Empty, Flex, Form, Input, InputNumber, Modal, Popconfirm, Row, Select, Segmented, Space, Spin, Switch, Table, Tag, Typography } from 'antd';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminPredefinedMemoryLessonCategoriesApi, adminPredefinedMemoryLessonsApi } from '../../../api/adminPredefinedMemoryLessonsApi';
import { PortalPageContainer } from '../../../components/PortalPageContainer';
import { extractApiErrorMessage } from '../../../lib/errorMessage';
import type { PredefinedMemoryLessonDto, PredefinedMemoryLessonItemInput, PredefinedMemoryLessonUpsertRequest } from '../../../types/predefinedMemoryLesson';

const queryKey = ['admin-predefined-memory-lessons'] as const;
const categoryQueryKey = ['admin-predefined-memory-lesson-categories'] as const;
type LessonViewMode = 'cards' | 'table';
const blankDraft = (): PredefinedMemoryLessonUpsertRequest => ({
  key: '', titleEn: '', titleZh: '', descriptionEn: '', descriptionZh: '', emoji: '🧠',
  categoryId: '', techniqueKey: 'number-peg', goalType: 'ordered-list', sortOrder: 100,
  isPublished: false, isStarterLesson: false, items: [{ position: 1, contentEn: '', contentZh: '' }],
});

export default function PredefinedMemoryLessonsPage() {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCategoryId = searchParams.get('category') ?? 'all';
  const lessonsQuery = useQuery({ queryKey, queryFn: adminPredefinedMemoryLessonsApi.list });
  const categoriesQuery = useQuery({ queryKey: categoryQueryKey, queryFn: adminPredefinedMemoryLessonCategoriesApi.list });
  const [editing, setEditing] = useState<PredefinedMemoryLessonDto | null>(null);
  const [draft, setDraft] = useState<PredefinedMemoryLessonUpsertRequest>(blankDraft);
  const [open, setOpen] = useState(false);
  const [viewMode, setViewMode] = useState<LessonViewMode>('table');

  const filteredLessons = useMemo(() => (lessonsQuery.data ?? []).filter(
    (lesson) => selectedCategoryId === 'all' || lesson.categoryId === selectedCategoryId,
  ), [lessonsQuery.data, selectedCategoryId]);

  const openEditor = (lesson?: PredefinedMemoryLessonDto) => {
    setEditing(lesson ?? null);
    setDraft(lesson ? {
      key: lesson.key, titleEn: lesson.titleEn, titleZh: lesson.titleZh,
      descriptionEn: lesson.descriptionEn, descriptionZh: lesson.descriptionZh,
      emoji: lesson.emoji, categoryId: lesson.categoryId, techniqueKey: lesson.techniqueKey,
      goalType: lesson.goalType, sortOrder: lesson.sortOrder, isPublished: lesson.isPublished,
      isStarterLesson: lesson.isStarterLesson,
      expectedVersion: lesson.version,
      items: lesson.items.map(({ id, position, contentEn, contentZh }) => ({ id, position, contentEn, contentZh })),
    } : { ...blankDraft(), categoryId: categoriesQuery.data?.find((category) => category.isActive)?.id ?? '' });
    setOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: () => editing
      ? adminPredefinedMemoryLessonsApi.update(editing.id, draft)
      : adminPredefinedMemoryLessonsApi.create(draft),
    retry: false,
    onSuccess: () => {
      message.success(editing ? 'Lesson updated.' : 'Lesson created.');
      setOpen(false);
      void queryClient.invalidateQueries({ queryKey });
    },
    onError: (error) => message.error(extractApiErrorMessage(error, 'Could not save lesson.')),
  });
  const deleteMutation = useMutation({
    mutationFn: adminPredefinedMemoryLessonsApi.delete,
    retry: false,
    onSuccess: () => {
      message.success('Lesson deleted.');
      void queryClient.invalidateQueries({ queryKey });
    },
    onError: (error) => message.error(extractApiErrorMessage(error, 'Could not delete lesson.')),
  });

  const updateItem = (index: number, values: Partial<PredefinedMemoryLessonItemInput>) => setDraft((current) => ({
    ...current,
    items: current.items.map((item, itemIndex) => itemIndex === index ? { ...item, ...values } : item),
  }));
  const addItem = () => setDraft((current) => ({
    ...current,
    items: [...current.items, { position: current.items.length + 1, contentEn: '', contentZh: '' }],
  }));
  const removeItem = (index: number) => setDraft((current) => ({
    ...current,
    items: current.items.filter((_, itemIndex) => itemIndex !== index)
      .map((item, itemIndex) => ({ ...item, position: itemIndex + 1 })),
  }));
  const canSave = draft.key.trim().length >= 2 && draft.titleEn.trim() && draft.titleZh.trim()
    && draft.emoji.trim() && draft.categoryId && draft.items.length > 0
    && (!draft.isStarterLesson || (draft.items.length >= 2 && draft.items.length <= 5))
    && draft.items.every((item) => item.contentEn.trim() && item.contentZh.trim());

  return (
    <PortalPageContainer>
      <Flex justify='space-between' align='center' wrap='wrap' gap={12} style={{ marginBottom: 20 }}>
        <div>
          <Typography.Title level={2} style={{ margin: 0 }}>Predefined Memory Lessons</Typography.Title>
          <Typography.Text type='secondary'>Publish bilingual starter memories for any learning category. The mobile Practice screen reads this catalogue directly.</Typography.Text>
        </div>
        <Space wrap>
          <Segmented
            value={viewMode}
            onChange={(value) => setViewMode(value as LessonViewMode)}
            options={[
              { value: 'cards', label: 'Cards', icon: <AppstoreOutlined /> },
              { value: 'table', label: 'Table', icon: <TableOutlined /> },
            ]}
          />
          <Button type='primary' icon={<PlusOutlined />} onClick={() => openEditor()}>New lesson</Button>
        </Space>
      </Flex>

      <Select
        value={selectedCategoryId}
        options={[
          { label: 'All categories', value: 'all' },
          ...(categoriesQuery.data ?? []).map((category) => ({ label: `${category.emoji} ${category.nameEn}`, value: category.id })),
        ]}
        onChange={(value) => setSearchParams(value === 'all' ? {} : { category: value })}
        style={{ width: 280, marginBottom: 18 }}
      />

      {lessonsQuery.isLoading ? <Spin /> : filteredLessons.length ? viewMode === 'table' ? (
        <Table<PredefinedMemoryLessonDto>
          rowKey='id'
          dataSource={filteredLessons}
          scroll={{ x: 1060 }}
          pagination={{ pageSize: 12, showSizeChanger: true }}
          columns={[
            {
              title: 'Lesson',
              key: 'lesson',
              width: 300,
              render: (_, lesson) => (
                <Space align='start'>
                  <Typography.Text style={{ fontSize: 30, lineHeight: 1 }}>{lesson.emoji}</Typography.Text>
                  <div>
                    <Typography.Text strong>{lesson.titleEn}</Typography.Text>
                    <Typography.Text type='secondary' style={{ display: 'block' }}>{lesson.titleZh}</Typography.Text>
                    <Typography.Paragraph type='secondary' ellipsis={{ rows: 2 }} style={{ margin: '4px 0 0', maxWidth: 220 }}>
                      {lesson.descriptionEn || 'No description'}
                    </Typography.Paragraph>
                  </div>
                </Space>
              ),
            },
            {
              title: 'Category',
              key: 'category',
              width: 170,
              render: (_, lesson) => <Tag color='cyan'>{lesson.category.emoji} {lesson.category.nameEn}</Tag>,
            },
            {
              title: 'Technique',
              dataIndex: 'techniqueKey',
              key: 'techniqueKey',
              width: 135,
              render: (technique: string) => <Tag color={technique === 'palace' ? 'purple' : 'magenta'}>{technique}</Tag>,
            },
            {
              title: 'Items',
              dataIndex: 'items',
              key: 'items',
              width: 80,
              render: (items: PredefinedMemoryLessonDto['items']) => items.length,
            },
            {
              title: 'Status',
              key: 'status',
              width: 170,
              render: (_, lesson) => (
                <Space direction='vertical' size={2}>
                  <Tag color={lesson.isPublished ? 'green' : 'default'}>{lesson.isPublished ? 'Published' : 'Draft'}</Tag>
                  {lesson.isStarterLesson ? <Tag color='gold'>Onboarding starter</Tag> : null}
                </Space>
              ),
            },
            { title: 'Version', dataIndex: 'version', key: 'version', width: 80 },
            {
              title: 'Actions',
              key: 'actions',
              fixed: 'right',
              width: 110,
              render: (_, lesson) => (
                <Space>
                  <Button type='text' icon={<EditOutlined />} aria-label={`Edit ${lesson.titleEn}`} onClick={() => openEditor(lesson)} />
                  <Popconfirm title='Delete this lesson?' onConfirm={() => deleteMutation.mutate(lesson.id)}>
                    <Button type='text' danger icon={<DeleteOutlined />} aria-label={`Delete ${lesson.titleEn}`} />
                  </Popconfirm>
                </Space>
              ),
            },
          ]}
        />
      ) : (
        <Row gutter={[16, 16]}>
          {filteredLessons.map((lesson) => (
            <Col xs={24} md={12} xl={8} key={lesson.id}>
              <Card actions={[
                <EditOutlined key='edit' onClick={() => openEditor(lesson)} />,
                <Popconfirm key='delete' title='Delete this lesson?' onConfirm={() => deleteMutation.mutate(lesson.id)}><DeleteOutlined /></Popconfirm>,
              ]}>
                <Flex gap={12} align='flex-start'>
                  <Typography.Text style={{ fontSize: 32, lineHeight: 1 }}>{lesson.emoji}</Typography.Text>
                  <div style={{ minWidth: 0 }}>
                    <Typography.Title level={5} style={{ margin: 0 }}>{lesson.titleEn}</Typography.Title>
                    <Typography.Text>{lesson.titleZh}</Typography.Text>
                    <Flex gap={6} wrap='wrap' style={{ marginTop: 10 }}>
                      <Tag color='cyan'>{lesson.category.emoji} {lesson.category.nameEn}</Tag>
                      <Tag color={lesson.techniqueKey === 'palace' ? 'purple' : 'magenta'}>{lesson.techniqueKey}</Tag>
                      <Tag>{lesson.items.length} items</Tag>
                      <Tag color={lesson.isPublished ? 'green' : 'default'}>{lesson.isPublished ? 'Published' : 'Draft'}</Tag>
                      {lesson.isStarterLesson ? <Tag color='gold'>Onboarding starter</Tag> : null}
                    </Flex>
                  </div>
                </Flex>
              </Card>
            </Col>
          ))}
        </Row>
      ) : <Empty description='No lessons in this group' />}

      <Modal
        open={open}
        onCancel={() => setOpen(false)}
        width={980}
        title={editing ? `Edit ${editing.titleEn}` : 'Create predefined lesson'}
        okText={saveMutation.isPending ? 'Saving…' : 'Save lesson'}
        okButtonProps={{ loading: saveMutation.isPending, disabled: !canSave }}
        onOk={() => saveMutation.mutate()}
        styles={{ body: { maxHeight: '72vh', overflowY: 'auto', paddingRight: 8 } }}
      >
        <Form layout='vertical'>
          <Row gutter={14}>
            <Col xs={24} md={8}><Form.Item label='Stable key' required><Input value={draft.key} placeholder='primary-spelling-safari' onChange={(event) => setDraft({ ...draft, key: event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })} /></Form.Item></Col>
            <Col xs={8} md={4}><Form.Item label='Emoji' required><Input value={draft.emoji} onChange={(event) => setDraft({ ...draft, emoji: event.target.value })} /></Form.Item></Col>
            <Col xs={8} md={6}><Form.Item label='Category' required><Select value={draft.categoryId || undefined} placeholder='Choose category' onChange={(categoryId) => setDraft({ ...draft, categoryId })} options={(categoriesQuery.data ?? []).map((category) => ({ value: category.id, label: `${category.emoji} ${category.nameEn}${category.isActive ? '' : ' (hidden)'}` }))} /></Form.Item></Col>
            <Col xs={8} md={6}><Form.Item label='Sort order'><InputNumber min={0} max={10000} value={draft.sortOrder} onChange={(value) => setDraft({ ...draft, sortOrder: value ?? 0 })} style={{ width: '100%' }} /></Form.Item></Col>
          </Row>
          <Row gutter={14}>
            <Col xs={24} md={12}><Form.Item label='English title' required><Input value={draft.titleEn} onChange={(event) => setDraft({ ...draft, titleEn: event.target.value })} /></Form.Item></Col>
            <Col xs={24} md={12}><Form.Item label='Chinese title' required><Input value={draft.titleZh} onChange={(event) => setDraft({ ...draft, titleZh: event.target.value })} /></Form.Item></Col>
            <Col xs={24} md={12}><Form.Item label='English description'><Input.TextArea rows={2} value={draft.descriptionEn} onChange={(event) => setDraft({ ...draft, descriptionEn: event.target.value })} /></Form.Item></Col>
            <Col xs={24} md={12}><Form.Item label='Chinese description'><Input.TextArea rows={2} value={draft.descriptionZh} onChange={(event) => setDraft({ ...draft, descriptionZh: event.target.value })} /></Form.Item></Col>
          </Row>
          <Row gutter={14}>
            <Col xs={24} md={6}><Form.Item label='Technique'><Select value={draft.techniqueKey} onChange={(techniqueKey) => setDraft({ ...draft, techniqueKey, isStarterLesson: techniqueKey === 'number-peg' ? draft.isStarterLesson : false })} options={[{ value: 'number-peg', label: 'Number Peg' }, { value: 'palace', label: 'Memory Palace' }]} /></Form.Item></Col>
            <Col xs={24} md={6}><Form.Item label='Learning goal'><Select value={draft.goalType} onChange={(goalType) => setDraft({ ...draft, goalType })} options={['spelling', 'ordered-list', 'facts', 'names', 'custom'].map((value) => ({ value, label: value }))} /></Form.Item></Col>
            <Col xs={12} md={6}><Form.Item label='Onboarding starter' extra='Starter lessons use 2–5 items.'><Switch disabled={draft.techniqueKey !== 'number-peg'} checked={draft.isStarterLesson} onChange={(isStarterLesson) => setDraft({ ...draft, isStarterLesson })} checkedChildren='Starter' unCheckedChildren='Regular' /></Form.Item></Col>
            <Col xs={12} md={6}><Form.Item label='Published'><Switch checked={draft.isPublished} onChange={(isPublished) => setDraft({ ...draft, isPublished })} checkedChildren='Visible' unCheckedChildren='Draft' /></Form.Item></Col>
          </Row>
        </Form>

        <Flex justify='space-between' align='center' style={{ marginBottom: 10 }}>
          <div><Typography.Title level={5} style={{ margin: 0 }}>Lesson items</Typography.Title><Typography.Text type='secondary'>Mobile uses English or Chinese content according to the app language.</Typography.Text></div>
          <Button icon={<PlusOutlined />} onClick={addItem}>Add item</Button>
        </Flex>
        <Table
          pagination={false}
          rowKey={(item) => item.id ?? String(item.position)}
          dataSource={draft.items}
          columns={[
            { title: '#', width: 54, render: (_, item) => item.position },
            { title: 'English content', render: (_, item, index) => <Input value={item.contentEn} onChange={(event) => updateItem(index, { contentEn: event.target.value })} /> },
            { title: 'Chinese content', render: (_, item, index) => <Input value={item.contentZh} onChange={(event) => updateItem(index, { contentZh: event.target.value })} /> },
            { title: '', width: 54, render: (_, _item, index) => <Button danger type='text' icon={<DeleteOutlined />} disabled={draft.items.length === 1} onClick={() => removeItem(index)} /> },
          ]}
          scroll={{ x: 720 }}
          size='small'
        />
        <Space style={{ marginTop: 12 }}><Typography.Text type='secondary'>Version {editing?.version ?? 1} · changes are fully audited</Typography.Text></Space>
      </Modal>
    </PortalPageContainer>
  );
}
