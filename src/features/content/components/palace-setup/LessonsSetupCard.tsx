import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import {
  ModalForm,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
  ProTable,
} from '@ant-design/pro-components';
import type { ProColumns } from '@ant-design/pro-components';
import { useMutation } from '@tanstack/react-query';
import { App, Button, Card, Popconfirm } from 'antd';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminPaths } from '../../../../navigation/adminPaths';
import type { LessonDto } from '../../../../types/content';
import { useAdminContentApi } from '../../hooks/useAdminContentApi';
import { buildLessonPayload, type LessonFormValues } from './forms';

interface LessonsSetupCardProps {
  palaceId: string;
  lessons: LessonDto[];
  loading?: boolean;
  onChanged: () => Promise<void> | void;
  canCreate?: boolean;
  onConfigureWords?: (lessonId: string) => void;
}

export function LessonsSetupCard({
  palaceId,
  lessons,
  loading,
  onChanged,
  canCreate = true,
  onConfigureWords,
}: LessonsSetupCardProps) {
  const { message } = App.useApp();
  const { createLesson, updateLesson, deleteLesson } = useAdminContentApi();
  const navigate = useNavigate();
  const [editingLesson, setEditingLesson] = useState<LessonDto | null>(null);
  const [createLessonOpen, setCreateLessonOpen] = useState(false);
  const formLayout = {
    layout: 'horizontal' as const,
    labelCol: { span: 7 },
    wrapperCol: { span: 17 },
  };

  const createLessonMutation = useMutation({
    mutationFn: (values: LessonFormValues) =>
      createLesson(buildLessonPayload(palaceId, values)),
    onSuccess: async () => {
      message.success('Lesson created.');
      setCreateLessonOpen(false);
      await onChanged();
    },
  });

  const updateLessonMutation = useMutation({
    mutationFn: (args: { id: string; values: LessonFormValues }) =>
      updateLesson(
        args.id,
        buildLessonPayload(palaceId, args.values, editingLesson ?? undefined),
      ),
    onSuccess: async () => {
      message.success('Lesson updated.');
      setEditingLesson(null);
      await onChanged();
    },
  });

  const deleteLessonMutation = useMutation({
    mutationFn: deleteLesson,
    onSuccess: async () => {
      message.success('Lesson deleted.');
      await onChanged();
    },
  });

  const columns: ProColumns<LessonDto>[] = useMemo(
    () => [
      { title: 'Title', dataIndex: 'title' },
      { title: 'Category', dataIndex: 'category' },
      { title: 'Privacy', dataIndex: 'privacy', width: 100 },
      { title: 'Words', dataIndex: 'wordCount', width: 90 },
      {
        title: 'Is Locked',
        dataIndex: 'isLocked',
        width: 90,
        render: (_, record: LessonDto) => (record.isLocked ? 'Yes' : 'No'),
      },
      {
        title: 'Actions',
        valueType: 'option',
        width: 240,
        render: (_, row) => [
          <Button
            key='configure'
            size='small'
            icon={<SettingOutlined />}
            onClick={() => {
              if (onConfigureWords) {
                onConfigureWords(row.id);
                return;
              }
              navigate(adminPaths.lessonWords(palaceId, row.id));
            }}
          >
            Configure Words
          </Button>,
          <Button
            key='edit'
            size='small'
            icon={<EditOutlined />}
            onClick={() => setEditingLesson(row)}
          />,
          <Popconfirm
            key='delete'
            title='Delete this lesson?'
            onConfirm={() => deleteLessonMutation.mutate(row.id)}
          >
            <Button size='small' danger icon={<DeleteOutlined />} />
          </Popconfirm>,
        ],
      },
    ],
    [deleteLessonMutation, navigate, palaceId],
  );

  return (
    <Card
      title='Lessons'
      extra={
        canCreate ? (
          <Button
            type='primary'
            icon={<PlusOutlined />}
            onClick={() => setCreateLessonOpen(true)}
          >
            New Lesson
          </Button>
        ) : undefined
      }
    >
      <ProTable<LessonDto>
        rowKey='id'
        search={false}
        options={false}
        pagination={false}
        loading={loading}
        dataSource={lessons}
        columns={columns}
      />

      <ModalForm<LessonFormValues>
        title='Create Lesson'
        open={canCreate && createLessonOpen}
        modalProps={{ destroyOnClose: true }}
        {...formLayout}
        onOpenChange={setCreateLessonOpen}
        initialValues={{
          privacy: 'private',
          isPremium: false,
          isCustom: false,
          isLocked: false,
        }}
        onFinish={async (values) => {
          await createLessonMutation.mutateAsync(values);
          return true;
        }}
      >
        <ProFormText
          name='title'
          label='Title'
          rules={[{ required: true }]}
          fieldProps={{ placeholder: 'Enter lesson title' }}
        />
        <ProFormText
          name='description'
          label='Description'
          fieldProps={{ placeholder: 'Enter lesson description (optional)' }}
        />
        <ProFormText
          name='category'
          label='Category'
          fieldProps={{
            placeholder: 'Enter category (e.g., anchors, actions)',
          }}
        />
        <ProFormSelect
          name='privacy'
          label='Privacy'
          placeholder='Select privacy'
          options={[
            { label: 'Private', value: 'private' },
            { label: 'Public', value: 'public' },
          ]}
          rules={[{ required: true }]}
        />
        <ProFormSwitch name='isPremium' label='Premium' />
        <ProFormSwitch name='isCustom' label='Custom' />
        <ProFormSwitch name='isLocked' label='Locked' />
      </ModalForm>

      <ModalForm<LessonFormValues>
        key={editingLesson?.id ?? 'edit-lesson'}
        title='Edit Lesson'
        open={!!editingLesson}
        modalProps={{ destroyOnClose: true }}
        {...formLayout}
        initialValues={
          editingLesson
            ? {
                title: editingLesson.title,
                description: editingLesson.description ?? '',
                category: editingLesson.category ?? '',
                privacy: editingLesson.privacy,
                isPremium: editingLesson.isPremium ?? false,
                isCustom: editingLesson.isCustom ?? false,
                isLocked: editingLesson.isLocked ?? false,
              }
            : undefined
        }
        onOpenChange={(isOpen) => {
          if (!isOpen) setEditingLesson(null);
        }}
        onFinish={async (values) => {
          if (!editingLesson) return false;
          await updateLessonMutation.mutateAsync({
            id: editingLesson.id,
            values,
          });
          return true;
        }}
      >
        <ProFormText
          name='title'
          label='Title'
          rules={[{ required: true }]}
          fieldProps={{ placeholder: 'Enter lesson title' }}
        />
        <ProFormText
          name='description'
          label='Description'
          fieldProps={{ placeholder: 'Enter lesson description (optional)' }}
        />
        <ProFormText
          name='category'
          label='Category'
          fieldProps={{
            placeholder: 'Enter category (e.g., anchors, actions)',
          }}
        />
        <ProFormSelect
          name='privacy'
          label='Privacy'
          placeholder='Select privacy'
          options={[
            { label: 'Private', value: 'private' },
            { label: 'Public', value: 'public' },
          ]}
          rules={[{ required: true }]}
        />
        <ProFormSwitch name='isPremium' label='Premium' />
        <ProFormSwitch name='isCustom' label='Custom' />
        <ProFormSwitch name='isLocked' label='Locked' />
      </ModalForm>
    </Card>
  );
}
