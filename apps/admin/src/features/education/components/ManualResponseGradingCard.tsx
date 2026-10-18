import { Button, Card, Input, InputNumber, Space, Typography } from 'antd';
import { useState } from 'react';
import type { EducationAssignmentGradeRowDto } from '../../../types/educationAssignments';
import { EducationResponsePhoto } from './EducationResponsePhoto';
import { EducationResponseAudio } from './EducationResponseAudio';

type ManualResponseGrade = EducationAssignmentGradeRowDto['manualResponses'][number];

export function ManualResponseGradingCard({ response, userId, attemptId, canGrade, loading, onGrade }: {
  response: ManualResponseGrade; userId: string; attemptId: string | null; canGrade: boolean; loading: boolean;
  onGrade: (score: number, feedback: string) => void;
}) {
  const [score, setScore] = useState<number | null>(response.score);
  const [feedback, setFeedback] = useState(response.feedback ?? '');
  const graded = response.score !== null;
  return <Card size="small" title={response.prompt}>
    <Space direction="vertical" style={{ width: '100%' }}>
      <div><Typography.Text strong>Student response</Typography.Text><Typography.Paragraph style={{ whiteSpace: 'pre-wrap' }}>{response.answer || 'No response (scored as zero).'}</Typography.Paragraph></div>
      {response.photoAttachmentId && attemptId ? <EducationResponsePhoto userId={userId} attemptId={attemptId} questionId={response.questionId}
        attachmentId={response.photoAttachmentId} alt={response.prompt} /> : null}
      {response.audioAttachmentId && attemptId ? <EducationResponseAudio userId={userId} attemptId={attemptId} questionId={response.questionId}
        attachmentId={response.audioAttachmentId} label={response.prompt} /> : null}
      <div><Typography.Text strong>Rubric</Typography.Text><Typography.Paragraph style={{ whiteSpace: 'pre-wrap' }}>{response.rubric}</Typography.Paragraph></div>
      {graded ? <>
        <Typography.Text strong>Grade: {response.score} / {response.maxScore}</Typography.Text>
        {response.feedback && <Typography.Paragraph>{response.feedback}</Typography.Paragraph>}
      </> : canGrade ? <>
        <Space align="center"><Typography.Text>Score</Typography.Text>
          <InputNumber min={0} max={response.maxScore} precision={2} value={score} onChange={setScore} />
          <Typography.Text type="secondary">/ {response.maxScore}</Typography.Text>
        </Space>
        <Input.TextArea value={feedback} onChange={event => setFeedback(event.target.value)} maxLength={1000} showCount rows={2} placeholder="Feedback for the student (optional)" />
        <Button type="primary" disabled={score === null || score < 0 || score > response.maxScore} loading={loading}
          onClick={() => score !== null && onGrade(score, feedback)}>Save grade</Button>
      </> : <Typography.Text type="secondary">Waiting for the student to submit.</Typography.Text>}
    </Space>
  </Card>;
}
