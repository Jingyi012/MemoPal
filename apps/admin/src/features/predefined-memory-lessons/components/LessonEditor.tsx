import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, App, Button, Col, Flex, Form, Input, InputNumber, Modal, Row, Select, Space, Switch, Table, Typography } from 'antd';
import { useState } from 'react';
import type { MemoryCollectionDto } from '../../../api/adminMemoryCollectionsApi';
import { adminPredefinedMemoryLessonsApi } from '../../../api/adminPredefinedMemoryLessonsApi';
import { adminPalaceScenesApi } from '../../../api/adminPalaceScenesApi';
import { extractApiErrorMessage } from '../../../lib/errorMessage';
import type { PredefinedMemoryLessonCategoryDto, PredefinedMemoryLessonDto, PredefinedMemoryLessonItemInput, PredefinedMemoryLessonUpsertRequest } from '../../../types/predefinedMemoryLesson';
import { invalidateContentLibrary } from '../hooks/useContentLibrary';

const blankDraft = (): PredefinedMemoryLessonUpsertRequest => ({
  key: '', titleEn: '', titleZh: '', descriptionEn: '', descriptionZh: '', emoji: '🧠',
  categoryId: '', techniqueKey: 'number-peg', goalType: 'ordered-list', sortOrder: 100,
  palaceSceneId: null, isPublished: false, isStarterLesson: false,
  items: [{ position: 1, contentEn: '', contentZh: '', associationEn: '', associationZh: '' }],
});

export function LessonEditor({ editing, categories, collection, onClose }: {
  editing?: PredefinedMemoryLessonDto;
  categories: PredefinedMemoryLessonCategoryDto[];
  collection?: MemoryCollectionDto;
  onClose: () => void;
}) {
  const { message, modal } = App.useApp();
  const queryClient = useQueryClient();
  const palaceScenesQuery = useQuery({ queryKey: ['admin-palace-scenes'], queryFn: adminPalaceScenesApi.list });
  const [initial] = useState<PredefinedMemoryLessonUpsertRequest>(() => editing ? {
    key: editing.key, titleEn: editing.titleEn, titleZh: editing.titleZh,
    descriptionEn: editing.descriptionEn, descriptionZh: editing.descriptionZh,
    emoji: editing.emoji, categoryId: editing.categoryId, techniqueKey: editing.techniqueKey,
    goalType: editing.goalType, palaceSceneId: editing.palaceSceneId ?? null, sortOrder: editing.sortOrder, isPublished: editing.isPublished,
    isStarterLesson: editing.isStarterLesson, expectedVersion: editing.version,
    items: editing.items.map(({ id, position, contentEn, contentZh, associationEn, associationZh }) => ({ id, position, contentEn, contentZh, associationEn, associationZh })),
  } : { ...blankDraft(), categoryId: collection?.categoryId ?? categories.find(c => c.isActive)?.id ?? '',
    isPublished: collection?.isPublished ?? false,
    collectionId: collection?.id, expectedCollectionVersion: collection?.version });
  const [draft, setDraft] = useState(initial);
  const saveMutation = useMutation({
    mutationFn: () => editing ? adminPredefinedMemoryLessonsApi.update(editing.id, draft) : adminPredefinedMemoryLessonsApi.create(draft),
    meta: { suppressGlobalErrorToast: true }, retry: false,
    onSuccess: async () => {
      await invalidateContentLibrary(queryClient);
      message.success(editing ? 'Lesson updated.' : 'Lesson created.');
      onClose();
    },
    onError: (error) => message.error(extractApiErrorMessage(error, 'Could not save lesson. Your changes are still here.')),
  });
  const close = () => {
    if (saveMutation.isPending) return;
    if (JSON.stringify(initial) === JSON.stringify(draft)) { onClose(); return; }
    modal.confirm({ title: 'Discard unsaved changes?', content: 'Your lesson changes have not been saved.', okText: 'Discard changes', okButtonProps: { danger: true }, onOk: onClose });
  };
  const moveItem = (index: number, offset: number) => setDraft(current => {
    const items = [...current.items];
    [items[index], items[index + offset]] = [items[index + offset], items[index]];
    return { ...current, items: items.map((item, i) => ({ ...item, position: i + 1 })) };
  });
  const updateItem = (index: number, values: Partial<PredefinedMemoryLessonItemInput>) => setDraft((current) => ({
    ...current,
    items: current.items.map((item, itemIndex) => itemIndex === index ? { ...item, ...values } : item),
  }));
  const addItem = () => setDraft((current) => ({
    ...current,
    items: [...current.items, { position: current.items.length + 1, contentEn: '', contentZh: '', associationEn: '', associationZh: '' }],
  }));
  const removeItem = (index: number) => setDraft((current) => ({
    ...current,
    items: current.items.filter((_, itemIndex) => itemIndex !== index)
      .map((item, itemIndex) => ({ ...item, position: itemIndex + 1 })),
  }));
  const canSave = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(draft.key) && draft.key.length >= 2 && draft.key.length <= 100 && draft.titleEn.trim() && draft.titleZh.trim()
    && draft.emoji.trim() && draft.categoryId && draft.items.length > 0
    && (draft.techniqueKey !== 'palace' || draft.palaceSceneId)
    && (!draft.isStarterLesson || (draft.items.length >= 2 && draft.items.length <= 5))
    && draft.items.every((item) => item.contentEn.trim() && item.contentZh.trim()
      && (!draft.isPublished || (item.associationEn.trim() && item.associationZh.trim())));
  const saveLesson = () => {
    if (saveMutation.isPending) return;
    const isPublishing = draft.isPublished && !editing?.isPublished;
    if (!isPublishing) {
      saveMutation.mutate();
      return;
    }

    modal.confirm({
      title: 'Publish this lesson now?',
      content: 'The lesson will become visible in the mobile Practice catalogue immediately after it is saved.',
      okText: 'Publish lesson',
      onOk: () => saveMutation.mutateAsync(),
    });
  };

  return (
      <Modal
        open
        onCancel={close}
        width={980}
        title={editing ? `Edit ${editing.titleEn}` : 'Create lesson'}
        okText={saveMutation.isPending ? 'Saving…' : 'Save lesson'}
        okButtonProps={{ loading: saveMutation.isPending, disabled: !canSave }}
        onOk={saveLesson}
        styles={{ body: { maxHeight: '72vh', overflowY: 'auto', paddingRight: 8 } }}
        closable={!saveMutation.isPending}
        maskClosable={false}
        keyboard={!saveMutation.isPending}
        cancelButtonProps={{ disabled: saveMutation.isPending }}
      >
        {collection && !editing && <Alert showIcon type="info" message={`New lesson in ${collection.titleEn}`} style={{ marginBottom: 16 }} />}
        <Form layout='vertical' disabled={saveMutation.isPending}>
          <Row gutter={14}>
            <Col xs={24} md={8}><Form.Item label='Stable key' htmlFor='lesson-key' required extra='2–100 lowercase letters or numbers, separated by single hyphens.'><Input maxLength={100} id='lesson-key' value={draft.key} placeholder='primary-spelling-safari' onChange={(event) => setDraft({ ...draft, key: event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })} /></Form.Item></Col>
            <Col xs={8} md={4}><Form.Item label='Emoji' htmlFor='lesson-emoji' required><Input maxLength={32} id='lesson-emoji' value={draft.emoji} onChange={(event) => setDraft({ ...draft, emoji: event.target.value })} /></Form.Item></Col>
            <Col xs={8} md={6}><Form.Item label='Category' htmlFor='lesson-categoryId' required><Select id='lesson-categoryId' value={draft.categoryId || undefined} placeholder='Choose category' onChange={(categoryId) => setDraft({ ...draft, categoryId })} options={(categories).map((category) => ({ value: category.id, label: `${category.emoji} ${category.nameEn}${category.isActive ? '' : ' (hidden)'}` }))} /></Form.Item></Col>
            <Col xs={8} md={6}><Form.Item label='Sort order' htmlFor='lesson-sortOrder'><InputNumber min={0} max={10000} id='lesson-sortOrder' value={draft.sortOrder} onChange={(value) => setDraft({ ...draft, sortOrder: value ?? 0 })} style={{ width: '100%' }} /></Form.Item></Col>
          </Row>
          <Row gutter={14}>
            <Col xs={24} md={12}><Form.Item label='English title' htmlFor='lesson-titleEn' required><Input maxLength={200} id='lesson-titleEn' value={draft.titleEn} onChange={(event) => setDraft({ ...draft, titleEn: event.target.value })} /></Form.Item></Col>
            <Col xs={24} md={12}><Form.Item label='Chinese title' htmlFor='lesson-titleZh' required><Input maxLength={200} id='lesson-titleZh' value={draft.titleZh} onChange={(event) => setDraft({ ...draft, titleZh: event.target.value })} /></Form.Item></Col>
            <Col xs={24} md={12}><Form.Item label='English description' htmlFor='lesson-descriptionEn'><Input.TextArea maxLength={500} showCount rows={2} id='lesson-descriptionEn' value={draft.descriptionEn} onChange={(event) => setDraft({ ...draft, descriptionEn: event.target.value })} /></Form.Item></Col>
            <Col xs={24} md={12}><Form.Item label='Chinese description' htmlFor='lesson-descriptionZh'><Input.TextArea maxLength={500} showCount rows={2} id='lesson-descriptionZh' value={draft.descriptionZh} onChange={(event) => setDraft({ ...draft, descriptionZh: event.target.value })} /></Form.Item></Col>
          </Row>
          <Row gutter={14}>
            <Col xs={24} md={6}><Form.Item label='Technique' htmlFor='lesson-techniqueKey'><Select id='lesson-techniqueKey' value={draft.techniqueKey} onChange={(techniqueKey) => setDraft({ ...draft, techniqueKey, palaceSceneId: techniqueKey === 'palace' ? draft.palaceSceneId : null, isStarterLesson: techniqueKey === 'number-peg' ? draft.isStarterLesson : false })} options={[{ value: 'number-peg', label: 'Number Peg' }, { value: 'palace', label: 'Memory Palace' }]} /></Form.Item></Col>
            {draft.techniqueKey === 'palace' && <Col xs={24} md={8}><Form.Item label='Authored Palace scene' htmlFor='lesson-palaceSceneId' required extra='Published lessons use this scene and map items to loci by position.'><Select id='lesson-palaceSceneId' loading={palaceScenesQuery.isLoading} value={draft.palaceSceneId || undefined} placeholder='Choose published scene' onChange={(palaceSceneId) => setDraft({ ...draft, palaceSceneId })} options={(palaceScenesQuery.data ?? []).filter((scene) => scene.status === 'published').map((scene) => ({ value: scene.id, label: `${scene.name} · ${scene.loci.length} loci` }))} /></Form.Item></Col>}
            <Col xs={24} md={6}><Form.Item label='Learning goal' htmlFor='lesson-goalType'><Select id='lesson-goalType' value={draft.goalType} onChange={(goalType) => setDraft({ ...draft, goalType })} options={['spelling', 'ordered-list', 'facts', 'names', 'custom'].map((value) => ({ value, label: value }))} /></Form.Item></Col>
            <Col xs={12} md={6}><Form.Item label='Onboarding starter' htmlFor='lesson-isStarterLesson' extra='Starter lessons use 2–5 items.'><Switch disabled={draft.techniqueKey !== 'number-peg'} checked={draft.isStarterLesson} onChange={(isStarterLesson) => setDraft({ ...draft, isStarterLesson })} checkedChildren='Starter' unCheckedChildren='Regular' /></Form.Item></Col>
            <Col xs={12} md={6}><Form.Item label='Published' htmlFor='lesson-isPublished'><Switch checked={draft.isPublished} onChange={(isPublished) => setDraft({ ...draft, isPublished })} checkedChildren='Visible' unCheckedChildren='Draft' /></Form.Item></Col>
          </Row>
        </Form>

        <Flex justify='space-between' align='center' style={{ marginBottom: 10 }}>
          <div><Typography.Title level={5} style={{ margin: 0 }}>Lesson items and authored associations</Typography.Title><Typography.Text type='secondary'>Published lessons must have a reviewed English and Chinese association for every item. Mobile will not generate a template for these lessons.</Typography.Text></div>
          <Button disabled={saveMutation.isPending || draft.items.length >= 100} icon={<PlusOutlined />} onClick={addItem}>Add item</Button>
        </Flex>
        <Table
          pagination={false}
          rowKey={(item) => item.id ?? String(item.position)}
          dataSource={draft.items}
          columns={[
            { title: '#', width: 110, render: (_, item, index) => <Space>{item.position}<Button size='small' aria-label={`Move item ${index + 1} up`} disabled={saveMutation.isPending || index === 0} onClick={() => moveItem(index, -1)}>↑</Button><Button size='small' aria-label={`Move item ${index + 1} down`} disabled={saveMutation.isPending || index === draft.items.length - 1} onClick={() => moveItem(index, 1)}>↓</Button></Space> },
            { title: 'English content', render: (_, item, index) => <Input disabled={saveMutation.isPending} aria-label={`Item ${index + 1} English content`} maxLength={500} value={item.contentEn} onChange={(event) => updateItem(index, { contentEn: event.target.value })} /> },
            { title: 'Chinese content', render: (_, item, index) => <Input disabled={saveMutation.isPending} aria-label={`Item ${index + 1} Chinese content`} maxLength={500} value={item.contentZh} onChange={(event) => updateItem(index, { contentZh: event.target.value })} /> },
            { title: 'English association', render: (_, item, index) => <Input.TextArea disabled={saveMutation.isPending} aria-label={`Item ${index + 1} English association`} maxLength={1000} autoSize={{ minRows: 2, maxRows: 4 }} value={item.associationEn} onChange={(event) => updateItem(index, { associationEn: event.target.value })} placeholder='Write the reviewed memory scene.' /> },
            { title: 'Chinese association', render: (_, item, index) => <Input.TextArea disabled={saveMutation.isPending} aria-label={`Item ${index + 1} Chinese association`} maxLength={1000} autoSize={{ minRows: 2, maxRows: 4 }} value={item.associationZh} onChange={(event) => updateItem(index, { associationZh: event.target.value })} placeholder='填写审核后的中文联想。' /> },
            { title: '', width: 54, render: (_, _item, index) => <Button danger type='text' aria-label={`Remove item ${index + 1}`} icon={<DeleteOutlined />} disabled={saveMutation.isPending || draft.items.length === 1} onClick={() => removeItem(index)} /> },
          ]}
          scroll={{ x: 1250 }}
          size='small'
        />
        {!canSave && <Typography.Paragraph type='secondary' style={{ marginTop: 12 }}>Complete both titles, a valid key, category, emoji, both content languages, and reviewed associations for every published item. Palace lessons also need a published Palace scene. Starter lessons need 2–5 items.</Typography.Paragraph>}
        <Space style={{ marginTop: 12 }}><Typography.Text type='secondary'>Version {editing?.version ?? 1} · changes are fully audited</Typography.Text></Space>
      </Modal>
  );
}
