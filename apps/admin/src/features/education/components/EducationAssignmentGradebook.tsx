import { Alert, Button, Card, Space, Table, Tag, Timeline, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { useEducationAssignmentGradebook } from '../hooks/useEducationAssignments';
import type { EducationAssignmentDto, EducationAssignmentGradeRowDto } from '../../../types/educationAssignments';
import { GradeCorrectionModal } from './GradeCorrectionModal';
import { ManualResponseGradingCard } from './ManualResponseGradingCard';
import { EducationRetakeModal } from './EducationRetakeModal';

export function EducationAssignmentGradebook({ userId, assignment, enabled }: {
  userId: string; assignment: EducationAssignmentDto; enabled: boolean;
}) {
  const { gradebook, publishResults, correctGrade, gradeWrittenResponse, createRetake } = useEducationAssignmentGradebook(userId, assignment.id, enabled);
  const [due, setDue] = useState(false);
  const [selectedRow, setSelectedRow] = useState<EducationAssignmentGradeRowDto | null>(null);
  const [retakeRow, setRetakeRow] = useState<EducationAssignmentGradeRowDto | null>(null);
  const rows = gradebook.data?.students ?? [];
  const published = Boolean(gradebook.data?.resultsPublishedAt);
  const hasOpenAttempts = rows.some(row => row.status === 'in-progress');
  const hasPendingManualGrades = rows.some(row => row.status === 'awaiting-manual-grade');
  const canPublish = due && !published && !hasOpenAttempts && !hasPendingManualGrades;

  useEffect(() => {
    const updateDueState = () => setDue(Date.now() >= new Date(assignment.dueAt).getTime());
    updateDueState();
    const timer = setInterval(updateDueState, 60_000);
    return () => clearInterval(timer);
  }, [assignment.dueAt]);

  return <Card size="small" title="Gradebook" extra={published
    ? <Tag color="green">Published {new Date(gradebook.data!.resultsPublishedAt!).toLocaleString()}</Tag>
    : <Button type="primary" disabled={!canPublish || gradebook.isPending} loading={publishResults.isPending}
      onClick={() => publishResults.mutate()}>Publish results</Button>}>
    {gradebook.isError ? <Alert type="error" showIcon message="Could not load gradebook." action={<Button type="link" onClick={() => void gradebook.refetch()}>Retry</Button>} /> : null}
    {!published && !due ? <Typography.Text type="secondary">Results can be released after the due time.</Typography.Text> : null}
    {!published && due && hasOpenAttempts ? <Typography.Text type="secondary">Wait for started attempts to be submitted before publishing.</Typography.Text> : null}
    {!published && hasPendingManualGrades ? <Alert type="warning" showIcon message="Grade every submitted written response before publishing results." style={{ marginTop: 12 }} /> : null}
    {!published && rows.some(row => row.gradeRevisionCount > 0) ? <Alert type="warning" showIcon message="Grades were corrected. Students and guardians will see revised scores after results are published again." style={{ marginTop: 12 }} /> : null}
    <Table<EducationAssignmentGradeRowDto> size="small" rowKey="recipientId" loading={gradebook.isPending}
      dataSource={rows} pagination={false} locale={{ emptyText: 'No assigned students.' }} expandable={{
        rowExpandable: row => row.gradeRevisions.length > 0 || row.manualResponses.length > 0,
        expandedRowRender: row => <Space direction="vertical" style={{ width: '100%' }}>
          {row.manualResponses.map(response => <ManualResponseGradingCard key={response.questionId} response={response} userId={userId}
            attemptId={row.attemptId}
            canGrade={row.status === 'awaiting-manual-grade'} loading={gradeWrittenResponse.isPending}
            onGrade={(score, feedback) => row.attemptId && gradeWrittenResponse.mutate({
              attemptId: row.attemptId, questionId: response.questionId, score, feedback,
            })} />)}
          {row.gradeRevisions.length > 0 && <Timeline items={row.gradeRevisions.map(revision => ({
          children: <Space direction="vertical" size={0}>
            <Typography.Text strong>{revision.previousScore} → {revision.newScore} / {revision.maxScore}</Typography.Text>
            <Typography.Text>{revision.reason}</Typography.Text>
            <Typography.Text type="secondary">{new Date(revision.correctedAt).toLocaleString()} · {revision.correctedByUserId}</Typography.Text>
          </Space>,
          }))} />}
        </Space>,
      }} columns={[
        { title: 'Student', dataIndex: 'studentName', render: (name: string, row) => <Space direction="vertical" size={0}><span>{name}</span><Typography.Text type="secondary">{row.studentUserId}</Typography.Text></Space> },
        { title: 'Status', dataIndex: 'status', render: (status: EducationAssignmentGradeRowDto['status']) => <Tag color={status === 'submitted' ? 'green' : status === 'in-progress' ? 'blue' : status === 'awaiting-manual-grade' ? 'orange' : 'default'}>{status}</Tag> },
        { title: 'Submitted', dataIndex: 'submittedAt', render: (date: string | null) => date ? new Date(date).toLocaleString() : '—' },
        { title: 'Score', render: (_: unknown, row) => <Space>
          <span>{row.score === null || row.maxScore === null ? '—' : `${row.score} / ${row.maxScore}`}</span>
          {row.gradeRevisionCount > 0 && <Tag color="gold">Corrected ×{row.gradeRevisionCount}</Tag>}
        </Space> },
        { title: '', key: 'correct', render: (_: unknown, row) => row.status === 'submitted' && row.attemptId && row.score !== null && row.maxScore !== null
          ? <Space>
            <Button type="link" onClick={() => setSelectedRow(row)}>Correct grade</Button>
            {published && !assignment.retakeOfAssignmentId ? <Button type="link" onClick={() => setRetakeRow(row)}>Authorize retake</Button> : null}
          </Space> : null },
      ]} />
    {selectedRow !== null && selectedRow.attemptId !== null && selectedRow.score !== null && selectedRow.maxScore !== null && <GradeCorrectionModal
      open
      studentName={selectedRow.studentName}
      score={selectedRow.score}
      maxScore={selectedRow.maxScore}
      loading={correctGrade.isPending}
      onCancel={() => setSelectedRow(null)}
      onSubmit={values => {
        const attemptId = selectedRow.attemptId;
        if (attemptId) correctGrade.mutate({ attemptId, ...values }, { onSuccess: () => setSelectedRow(null) });
      }}
    />}
    <EducationRetakeModal
      open={retakeRow !== null}
      student={retakeRow}
      originalTitle={assignment.title}
      loading={createRetake.isPending}
      onCancel={() => setRetakeRow(null)}
      onSubmit={value => createRetake.mutate(value, { onSuccess: () => setRetakeRow(null) })}
    />
  </Card>;
}
