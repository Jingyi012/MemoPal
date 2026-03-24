import { EditOutlined } from '@ant-design/icons';
import { ModalForm, ProForm, ProFormDigit, ProFormSwitch, ProFormText } from '@ant-design/pro-components';
import { useMutation } from '@tanstack/react-query';
import { Button, Card, Descriptions, message } from 'antd';
import { useState } from 'react';
import { adminContentApi } from '../../../../api/adminContentApi';
import type { PalaceDto } from '../../../../types/content';
import { ImageUploadField } from '../ImageUploadField';
import { MediaThumbnail } from '../MediaThumbnail';
import { buildPalacePayload, type PalaceFormValues } from './forms';

interface PalaceOverviewCardProps {
  palaceId: string;
  palace: PalaceDto;
  onChanged: () => Promise<void> | void;
}

export function PalaceOverviewCard({ palaceId, palace, onChanged }: PalaceOverviewCardProps) {
  const [editingPalace, setEditingPalace] = useState(false);
  const formLayout = { layout: 'horizontal' as const, labelCol: { span: 8 }, wrapperCol: { span: 16 } };

  const palaceMutation = useMutation({
    mutationFn: (values: PalaceFormValues) =>
      adminContentApi.updatePalace(palaceId, buildPalacePayload(values, palace)),
    onSuccess: async () => {
      message.success('Palace updated.');
      setEditingPalace(false);
      await onChanged();
    },
    onError: () => message.error('Failed to update palace.'),
  });

  return (
    <Card
      title='Palace Details'
      extra={
        <Button icon={<EditOutlined />} onClick={() => setEditingPalace(true)}>
          Edit Palace
        </Button>
      }
    >
      <Descriptions column={1} size='small' labelStyle={{ width: 140 }}>
        <Descriptions.Item label='Name'>{palace.name}</Descriptions.Item>
        <Descriptions.Item label='Description'>{palace.description}</Descriptions.Item>
        <Descriptions.Item label='Unlock Level'>{palace.level}</Descriptions.Item>
        <Descriptions.Item label='Thumbnail'>
          <MediaThumbnail
            path={palace.thumbnail}
            alt={`${palace.name} thumbnail`}
            width={220}
            height={132}
          />
        </Descriptions.Item>
      </Descriptions>

      <ModalForm<PalaceFormValues>
        title='Edit Palace'
        open={editingPalace}
        modalProps={{ destroyOnClose: true }}
        onOpenChange={setEditingPalace}
        {...formLayout}
        initialValues={{
          name: palace.name,
          description: palace.description,
          thumbnail: palace.thumbnail,
          level: palace.level,
          isPremium: palace.isPremium,
          isCustom: palace.isCustom,
          isLocked: palace.isLocked,
        }}
        onFinish={async (values) => {
          await palaceMutation.mutateAsync(values);
          return true;
        }}
      >
        <ProFormText
          name='name'
          label='Name'
          rules={[{ required: true }]}
          fieldProps={{ placeholder: 'Enter palace name' }}
        />
        <ProFormText
          name='description'
          label='Description'
          rules={[{ required: true }]}
          fieldProps={{ placeholder: 'Enter short palace description' }}
        />
        <ProForm.Item name='thumbnail' label='Thumbnail' rules={[{ required: true }]}>
          <ImageUploadField category='palace' />
        </ProForm.Item>
        <ProFormDigit
          name='level'
          label='Unlock Level'
          min={1}
          rules={[{ required: true }]}
          fieldProps={{ placeholder: 'Enter required user level' }}
        />
        <ProFormSwitch name='isPremium' label='Premium' />
        <ProFormSwitch name='isCustom' label='Custom' />
        <ProFormSwitch name='isLocked' label='Locked' />
      </ModalForm>
    </Card>
  );
}
