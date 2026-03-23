import { UploadOutlined } from '@ant-design/icons';
import { Button, Image, Space, Upload } from 'antd';
import type { UploadProps } from 'antd';
import { useState } from 'react';
import { adminMediaApi, type AdminImageCategory } from '../../../api/adminMediaApi';
import { compressImageForUpload } from '../utils/imageCompression';

interface ImageUploadFieldProps {
  value?: string;
  onChange?: (value: string) => void;
  category: AdminImageCategory;
}

export function ImageUploadField({ value, onChange, category }: ImageUploadFieldProps) {
  const [uploading, setUploading] = useState(false);

  const uploadProps: UploadProps = {
    accept: 'image/*',
    showUploadList: false,
    customRequest: async (options) => {
      try {
        setUploading(true);
        const originalFile = options.file as File;
        const optimizedFile = await compressImageForUpload(originalFile);
        const uploadedPath = await adminMediaApi.uploadImage(optimizedFile, category);
        onChange?.(uploadedPath);
        options.onSuccess?.({}, new XMLHttpRequest());
      } catch (error) {
        options.onError?.(error as Error);
      } finally {
        setUploading(false);
      }
    },
  };

  const previewUrl = value ? adminMediaApi.resolveMediaUrl(value) : '';

  return (
    <Space direction='vertical' size={8} style={{ width: '100%' }}>
      <Upload {...uploadProps}>
        <Button icon={<UploadOutlined />} loading={uploading}>
          Upload Image
        </Button>
      </Upload>
      {value ? (
        <Image src={previewUrl} alt='uploaded preview' width={180} style={{ borderRadius: 8 }} />
      ) : null}
    </Space>
  );
}
