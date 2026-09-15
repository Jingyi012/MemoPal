import { Alert, Form, Modal, Select, Typography } from 'antd';
import { useState } from 'react';
import type { MemoryCollectionDto, MoveCollectionLessonInput } from '../../../api/adminMemoryCollectionsApi';
import type { PredefinedMemoryLessonDto } from '../../../types/predefinedMemoryLesson';

export function MoveLessonDialog({ lesson, collections, sourceId, targetId, pending, onMove, onClose }: {
  lesson: PredefinedMemoryLessonDto; collections: MemoryCollectionDto[]; sourceId?: string; targetId?: string;
  pending: boolean; onMove: (input: MoveCollectionLessonInput) => Promise<unknown>; onClose: () => void;
}) {
  const memberships = collections.filter(c => c.lessons.some(l => l.id === lesson.id));
  const [source, setSource] = useState(sourceId ?? memberships[0]?.id ?? 'unassigned');
  const [target, setTarget] = useState<string | undefined>(targetId);
  const [error, setError] = useState(false);
  const sourceCollection = collections.find(c => c.id === source);
  const targetCollection = collections.find(c => c.id === target);
  const blocked = targetCollection?.isPublished && (!lesson.isPublished || !lesson.category.isActive)
    ? 'Publish this lesson and activate its category before moving it into a published collection.'
    : sourceCollection?.isPublished && sourceCollection.lessons.length === 1
      ? 'Unpublish the source collection before moving its last lesson.' : undefined;
  return <Modal open title='Move lesson' okText='Move lesson' confirmLoading={pending}
    okButtonProps={{ disabled: !target || source === target || Boolean(blocked) || (target === 'unassigned' && memberships.length > 1) || Boolean(targetCollection?.lessons.some(l => l.id === lesson.id)) }}
    cancelButtonProps={{ disabled: pending }} closable={!pending} maskClosable={false} keyboard={!pending}
    onCancel={onClose} onOk={async () => {
      setError(false);
      try {
        await onMove({ sourceCollectionId: source === 'unassigned' ? null : source,
          targetCollectionId: target === 'unassigned' ? null : target!, expectedSourceVersion: sourceCollection?.version,
          expectedTargetVersion: targetCollection?.version, expectedLessonVersion: lesson.version });
        onClose();
      } catch { setError(true); }
    }}>
    <Typography.Paragraph>Choose where to move <strong>{lesson.emoji} {lesson.titleEn}</strong>.</Typography.Paragraph>
    <Form layout='vertical'>
      <Form.Item label='From' htmlFor='move-source'><Select id='move-source' value={source} disabled={memberships.length < 2 || pending} onChange={value => { setSource(value); setTarget(undefined); }}
        options={memberships.length ? memberships.map(c => ({ value: c.id, label: c.titleEn })) : [{ value: 'unassigned', label: 'Unassigned lessons' }]} /></Form.Item>
      <Form.Item label='Destination' htmlFor='move-target' required><Select id='move-target' value={target} disabled={pending} showSearch optionFilterProp='label' placeholder='Choose a collection' onChange={setTarget}
        options={[{ value: 'unassigned', label: 'Unassigned lessons', disabled: source === 'unassigned' || memberships.length > 1 },
          ...collections.map(c => ({ value: c.id, label: `${c.emoji} ${c.titleEn} · ${c.lessons.length} lessons`,
            disabled: c.id === source || c.lessons.length >= 100 || c.lessons.some(l => l.id === lesson.id) }))]} /></Form.Item>
    </Form>
    {memberships.length > 1 && <Alert showIcon type='info' message='Only the selected source membership will move. Other collections keep their references to this lesson.' />}
    {blocked && <Alert showIcon type='warning' message={blocked} />}
    {error && <Alert showIcon type='error' message='Move failed. Close this dialog and refresh the library if the content has changed.' />}
  </Modal>;
}
