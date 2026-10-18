import { Spin, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { useEducationResponseAudio } from '../hooks/useEducationResponseAudio';

export function EducationResponseAudio({ userId, attemptId, questionId, attachmentId, label }: {
  userId: string; attemptId: string; questionId: string; attachmentId: string; label: string;
}) {
  const audio = useEducationResponseAudio(userId, attemptId, questionId, attachmentId);
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!audio.data) {
      setUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(audio.data);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [audio.data]);

  if (audio.isPending) return <Spin size="small" />;
  if (audio.isError || !url) return <Typography.Text type="danger">Could not load the private student recording.</Typography.Text>;
  return <audio controls preload="none" src={url} aria-label={`Student response: ${label}`} style={{ width: '100%' }} />;
}
