import { Image, Spin, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { useEducationResponsePhoto } from '../hooks/useEducationResponsePhoto';

export function EducationResponsePhoto({ userId, attemptId, questionId, attachmentId, alt }: {
  userId: string; attemptId: string; questionId: string; attachmentId: string; alt: string;
}) {
  const photo = useEducationResponsePhoto(userId, attemptId, questionId, attachmentId);
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!photo.data) {
      setUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(photo.data);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [photo.data]);

  if (photo.isPending) return <Spin size="small" />;
  if (photo.isError || !url) return <Typography.Text type="danger">Could not load the private student photo.</Typography.Text>;
  return <Image src={url} alt={alt} style={{ maxWidth: '100%', maxHeight: 360, objectFit: 'contain' }} />;
}
