import { Flex, Image, Typography } from 'antd';
import { adminMediaApi } from '../../../api/adminMediaApi';

interface MediaThumbnailProps {
  path?: string | null;
  alt: string;
  width?: number;
  height?: number;
}

export function MediaThumbnail({ path, alt, width = 88, height = 56 }: MediaThumbnailProps) {
  if (!path) {
    return (
      <Flex
        align='center'
        justify='center'
        style={{
          width,
          height,
          borderRadius: 8,
          border: '1px dashed #d9d9d9',
          background: '#fafafa',
        }}
      >
        <Typography.Text type='secondary' style={{ fontSize: 12 }}>
          No image
        </Typography.Text>
      </Flex>
    );
  }

  return (
    <Image
      src={adminMediaApi.resolveMediaUrl(path)}
      alt={alt}
      width={width}
      height={height}
      preview={false}
      style={{ borderRadius: 8, objectFit: 'cover' }}
    />
  );
}
