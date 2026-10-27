import { Alert, Button, Card, DatePicker, Form, Input, InputNumber, Modal, Select, Space, Switch, Table, Tag, Typography } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useEducationCourses } from '../hooks/useEducationAuthoring';
import { useEducationAssignments } from '../hooks/useEducationAssignments';
import { useClassroomMembers } from '../hooks/useEducationRelationships';
import { adminPaths } from '../../../navigation/adminPaths';
import type { CreateEducationAssignmentRequest } from '../../../types/educationAssignments';
import { EducationAssignmentGradebook } from './EducationAssignmentGradebook';
import { PublishedAssessmentSelect } from './PublishedAssessmentSelect';

interface AssignmentFormValue {
  title: string; courseId: string; assessmentId: string; studentUserIds: string[];
  opensAt: Dayjs; dueAt: Dayjs; timeLimitMinutes?: number; enableStudentLeaderboard: boolean;
}

export function ClassroomAssignments({ userId, classroomId, canManage }: { userId: string; classroomId: string; canManage: boolean }) {
  const [open, setOpen] = useState(false);
  const [courseId, setCourseId] = useState('');
  const [expandedAssignmentId, setExpandedAssignmentId] = useState<string | null>(null);
  const [form] = Form.useForm<AssignmentFormValue>();
  const idempotencyKey = useRef<string | null>(null);
  const courses = useEducationCourses(userId);
  const members = useClassroomMembers(userId, classroomId, canManage);
  const assignments = useEducationAssignments(userId, classroomId);
  const students = (members.data ?? []).filter(member => member.role === 'student' && member.status === 'active');

  const create = (value: AssignmentFormValue) => {
    idempotencyKey.current ??= crypto.randomUUID();
    const request: CreateEducationAssignmentRequest = {
      assessmentId: value.assessmentId,
      title: value.title.trim(),
      opensAt: value.opensAt.toISOString(),
      dueAt: value.dueAt.toISOString(),
      timeLimitMinutes: value.timeLimitMinutes ?? null,
      idempotencyKey: idempotencyKey.current,
      studentUserIds: value.studentUserIds,
      enableStudentLeaderboard: value.enableStudentLeaderboard ?? false,
    };
    assignments.createAssignment.mutate(request, { onSuccess: () => {
      idempotencyKey.current = null;
      form.resetFields();
      setCourseId('');
      setOpen(false);
    } });
  };

  return <Card title="Assignments" style={{ marginTop: 20 }} extra={canManage && <Button type="primary" onClick={() => setOpen(true)}>Assign assessment</Button>}>
    <Table rowKey="id" loading={assignments.assignments.isPending} dataSource={assignments.assignments.data ?? []} scroll={{ x: 900 }} pagination={{ pageSize: 5 }} locale={{ emptyText: 'No classroom assignments yet.' }} expandable={{
      expandedRowKeys: expandedAssignmentId ? [expandedAssignmentId] : [],
      showExpandColumn: false,
      expandedRowRender: row => <EducationAssignmentGradebook userId={userId} assignment={row} enabled={expandedAssignmentId === row.id} />,
    }} columns={[
      { title: 'Assignment', dataIndex: 'title', render: (title: string, row) => <Space wrap>
        <span>{title}</span>
        {row.retakeOfAssignmentId ? <Tag title={row.retakeReason ?? undefined} color="gold">Authorized retake</Tag> : null}
      </Space> },
      { title: 'Recipients', dataIndex: 'recipients', render: (rows: unknown[]) => rows.length },
      { title: 'Opens', dataIndex: 'opensAt', render: (date: string) => new Date(date).toLocaleString() },
      { title: 'Due', dataIndex: 'dueAt', render: (date: string) => new Date(date).toLocaleString() },
      { title: 'Assessment', render: (_: unknown, row) => <Link to={adminPaths.educationAssessment(row.assessmentId)}>v{row.assessmentVersion}</Link> },
      { title: 'Results', render: (_: unknown, row) => <Button type="link" onClick={() => setExpandedAssignmentId(current => current === row.id ? null : row.id)}>{expandedAssignmentId === row.id ? 'Hide gradebook' : 'View gradebook'}</Button> },
    ]} />
    {assignments.assignments.isError && <Button type="link" onClick={() => void assignments.assignments.refetch()}>Retry loading assignments</Button>}
    <Modal title="Assign a published assessment" open={open} onCancel={() => !assignments.createAssignment.isPending && setOpen(false)} footer={null} destroyOnClose>
      <Typography.Paragraph type="secondary">Only active students in this classroom can receive the assignment. Published question content is fixed.</Typography.Paragraph>
      <Form form={form} layout="vertical" onFinish={create} initialValues={{ opensAt: dayjs(), dueAt: dayjs().add(7, 'day') }}>
        <Form.Item name="title" label="Assignment title" rules={[{ required: true }, { max: 200 }]}><Input maxLength={200} /></Form.Item>
        <Form.Item name="courseId" label="Course" rules={[{ required: true }]}>
          <Select loading={courses.courses.isPending} onChange={value => { setCourseId(value); form.setFieldValue('assessmentId', undefined); }} options={(courses.courses.data ?? []).map(item => ({ value: item.id, label: item.title }))} />
        </Form.Item>
        <Form.Item name="assessmentId" label="Published assessment" rules={[{ required: true }]}>
          <PublishedAssessmentSelect userId={userId} courseId={courseId} />
        </Form.Item>
        <Form.Item name="studentUserIds" label="Students" rules={[{ required: true, message: 'Choose at least one active student.' }]}>
          <Select mode="multiple" loading={members.isPending} placeholder="Choose students" options={students.map(item => ({ value: item.userId, label: item.userDisplayName ? `${item.userDisplayName} · ${item.userId}` : item.userId }))} />
        </Form.Item>
        <Form.Item name="enableStudentLeaderboard" label="Allow a pseudonymous class leaderboard" valuePropName="checked" extra="Students must also opt in. Names and account IDs are never shown; publication freezes the ranked snapshot.">
          <Switch />
        </Form.Item>
        {students.length === 0 && <Alert type="info" showIcon message="Invite students and wait for them to accept before assigning work." style={{ marginBottom: 16 }} />}
        <Space wrap align="start">
          <Form.Item name="opensAt" label="Opens at (your local time)" rules={[{ required: true }]}><DatePicker showTime /></Form.Item>
          <Form.Item name="dueAt" label="Due at (your local time)" dependencies={['opensAt']} rules={[{ required: true }, { validator: (_, value: Dayjs | undefined) => {
            const opensAt = form.getFieldValue('opensAt') as Dayjs | undefined;
            return !value || !opensAt || value.isAfter(opensAt) ? Promise.resolve() : Promise.reject(new Error('Due time must be after the opening time.'));
          } }]}><DatePicker showTime /></Form.Item>
          <Form.Item name="timeLimitMinutes" label="Time limit (minutes)"><InputNumber min={1} precision={0} /></Form.Item>
        </Space>
        <Button type="primary" htmlType="submit" loading={assignments.createAssignment.isPending}>Create assignment</Button>
      </Form>
    </Modal>
  </Card>;
}

