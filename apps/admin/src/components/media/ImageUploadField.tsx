import { UploadOutlined } from '@ant-design/icons';
import { Button, Image, Space, Upload } from 'antd';
import type { UploadProps } from 'antd';
import { useState } from 'react';
import {
  useAdminMediaApi,
  type ImageCategory,
} from '../../hooks/useAdminMediaApi';
import { compressImageForUpload } from '../../utils/imageCompression';

interface ImageUploadFieldProps {
  value?: string;
  onChange?: (value: string) => void;
  category: ImageCategory;
  disabled?: boolean;
  onUploadingChange?: (uploading: boolean) => void;
  onUploadError?: (error: unknown) => void;
  validateFile?: (file: File) => Promise<void>;
}

export function ImageUploadField({ value, onChange, category, disabled, onUploadingChange, onUploadError, validateFile }: ImageUploadFieldProps) {
  const { uploadImage, resolveMediaPath } = useAdminMediaApi();
  const [uploading, setUploading] = useState(false);

  const uploadProps: UploadProps = {
    disabled: disabled || uploading,
    accept: 'image/*',
    showUploadList: false,
    customRequest: async (options) => {
      try {
        setUploading(true);
        onUploadingChange?.(true);
        const originalFile = options.file as File;
        await validateFile?.(originalFile);
        const optimizedFile = await compressImageForUpload(originalFile);
        const uploadedPath = await uploadImage(optimizedFile, category);
        onChange?.(uploadedPath);
        options.onSuccess?.({}, new XMLHttpRequest());
      } catch (error) {
        onUploadError?.(error);
        options.onError?.(error as Error);
      } finally {
        setUploading(false);
        onUploadingChange?.(false);
      }
    },
  };

  const previewUrl = value ? resolveMediaPath(value) : '';

  return (
    <Space direction='vertical' size={8} style={{ width: '100%' }}>
      <Upload {...uploadProps}>
        <Button icon={<UploadOutlined />} loading={uploading} disabled={disabled}>
          Upload Image
        </Button>
      </Upload>
      {value ? (
        <Image src={previewUrl} alt='uploaded preview' width={180} style={{ borderRadius: 8 }} />
      ) : null}
    </Space>
  );
}
