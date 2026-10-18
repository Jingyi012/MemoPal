import { Alert, Button, Card, Space, Table, Tag, Timeline, Typography } from 'antd';
import { useClassroomObjectiveProgress } from '../hooks/useEducationProgress';
import type { EducationObjectiveEvidenceDto, EducationObjectiveMasteryDto } from '../../../types/educationProgress';

const masteryLabel: Record<EducationObjectiveMasteryDto['status'], string> = {
  'insufficient-evidence': 'Insufficient evidence',
  'needs-revalidation': 'Needs revalidation',
  'selected-response-only': 'Option-based evidence only',
  'currently-strong': 'Currently strong',
  'continue-practice': 'Continue practice',
  'needs-support': 'Needs support',
};

const masteryColor: Record<EducationObjectiveMasteryDto['status'], string> = {
  'insufficient-evidence': 'default',
  'needs-revalidation': 'orange',
  'selected-response-only': 'blue',
  'currently-strong': 'green',
  'continue-practice': 'gold',
  'needs-support': 'red',
};

function ObjectiveEvidenceTimeline({ evidence }: { evidence: EducationObjectiveEvidenceDto[] }) {
  return <Timeline items={evidence.map(item => ({
    children: <Space direction="vertical" size={0}>
      <Typography.Text strong>{item.questionPrompt}</Typography.Text>
      <Typography.Text>{item.assessmentTitle} · {item.assignmentTitle} · {item.questionType}</Typography.Text>
      <Typography.Text type="secondary">{new Date(item.submittedAt).toLocaleString()} · {item.score} / {item.maxScore}</Typography.Text>
    </Space>,
  }))} />;
}

function performanceLabel(performance: EducationObjectiveMasteryDto['selectedResponsePerformance']) {
  if (performance.score === null || performance.maxScore === null) return '—';
  return `${performance.score} / ${performance.maxScore} (${performance.percentage}%) · ${performance.distinctQuestionCount} questions / ${performance.distinctAssessmentCount} assessments / ${performance.distinctSubmissionDateCount} days`;
}

export function ClassroomObjectiveProgress({ userId, classroomId, enabled }: {
  userId: string;
  classroomId: string;
  enabled: boolean;
}) {
  const progress = useClassroomObjectiveProgress(userId, classroomId, enabled);
  const rows = progress.data?.students.flatMap(student => student.objectives.map(objective => ({
    ...objective,
    studentUserId: student.studentUserId,
    studentName: student.studentName,
  }))) ?? [];

  return <Card title="Learning objectives" loading={progress.isPending} style={{ marginTop: 20 }}>
    {progress.isError ? <Alert type="error" showIcon message="Could not load learning-objective evidence." action={<Button type="link" onClick={() => void progress.refetch()}>Retry</Button>} /> : null}
    {progress.data && <>
      <Typography.Paragraph type="secondary">
        Published first submissions from the last 30 days. Mastery status uses open-response evidence only and requires at least five distinct questions, two assessments, and two submission dates. Option-based results are shown separately and cannot establish unaided recall by themselves.
      </Typography.Paragraph>
      <Table<typeof rows[number]>
        rowKey={row => `${row.studentUserId}-${row.objectiveId}`}
        dataSource={rows}
        pagination={{ pageSize: 10 }}
        locale={{ emptyText: 'No students have assigned learning objectives yet.' }}
        expandable={{
          rowExpandable: row => row.evidence.length > 0,
          expandedRowRender: row => <ObjectiveEvidenceTimeline evidence={row.evidence} />,
        }}
        columns={[
          { title: 'Student', dataIndex: 'studentName', render: (name: string, row) => <Space direction="vertical" size={0}><span>{name}</span><Typography.Text type="secondary">{row.studentUserId}</Typography.Text></Space> },
          { title: 'Course', dataIndex: 'courseTitle' },
          { title: 'Objective', dataIndex: 'objectiveTitle' },
          { title: 'Evidence status', dataIndex: 'status', render: (status: EducationObjectiveMasteryDto['status']) => <Tag color={masteryColor[status]}>{masteryLabel[status]}</Tag> },
          { title: 'Option-based performance', render: (_: unknown, row) => performanceLabel(row.selectedResponsePerformance) },
          { title: 'Open-response performance', render: (_: unknown, row) => performanceLabel(row.openResponsePerformance) },
        ]}
      />
    </>}
  </Card>;
}
