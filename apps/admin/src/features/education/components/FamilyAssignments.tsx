import { Alert, Button, Card, DatePicker, Form, Input, InputNumber, Modal, Select, Space, Table, Typography } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminPaths } from '../../../navigation/adminPaths';
import { useEducationCourse, useEducationCourses } from '../hooks/useEducationAuthoring';
import { useEducationFamilyAssignments } from '../hooks/useEducationFamilyAssignments';
import { EducationAssignmentGradebook } from './EducationAssignmentGradebook';
import { PublishedAssessmentSelect } from './PublishedAssessmentSelect';

interface FamilyAssignmentFormValue {
  title: string;
  courseId: string;
  assessmentId: string;
  studentUserIds: string[];
  opensAt: Dayjs;
  dueAt: Dayjs;
  timeLimitMinutes?: number;
}

export function FamilyAssignments({ userId, initialCourseId = '', initialAssessmentId = '' }: { userId: string; initialCourseId?: string; initialAssessmentId?: string }) {
  const [open, setOpen] = useState(false);
  const [courseId, setCourseId] = useState('');
  const [expandedAssignmentId, setExpandedAssignmentId] = useState<string | null>(null);
  const [form] = Form.useForm<FamilyAssignmentFormValue>();
  const idempotencyKey = useRef<string | null>(null);
  const courses = useEducationCourses(userId);
  const family = useEducationFamilyAssignments(userId);
  const children = family.children.data ?? [];
  const initialCourse = courses.courses.data?.find(item => item.id === initialCourseId && !item.isPlatformCourse);
  const initialContent = useEducationCourse(userId, initialCourse?.id ?? '');
  const [initialSelectionApplied, setInitialSelectionApplied] = useState(false);
  const hasInitialSelection = !!initialCourseId && !!initialAssessmentId;
  const initialSelectionError = hasInitialSelection && !initialSelectionApplied && (
    courses.courses.isError || initialContent.assessments.isError
  );
  const initialSelectionUnavailable = hasInitialSelection && !initialSelectionApplied && (
    (courses.courses.isSuccess && !initialCourse)
    || (initialContent.assessments.isSuccess && !initialContent.assessments.data?.some(item => item.id === initialAssessmentId && item.status === 'published'))
  );
  useEffect(() => {
    if (initialSelectionApplied || !initialCourse || !initialAssessmentId || !initialContent.assessments.isSuccess) return;
    const assessment = initialContent.assessments.data?.find(item => item.id === initialAssessmentId && item.status === 'published');
    if (!assessment) return;
    setInitialSelectionApplied(true);
    setCourseId(initialCourse.id);
    form.setFieldsValue({ courseId: initialCourse.id, assessmentId: assessment.id, title: assessment.title,
      opensAt: dayjs(), dueAt: dayjs().add(7, 'day') });
    setOpen(true);
  }, [initialSelectionApplied, initialCourse, initialAssessmentId, initialContent.assessments.isSuccess, initialContent.assessments.data, form]);

  const create = (value: FamilyAssignmentFormValue) => {
    idempotencyKey.current ??= crypto.randomUUID();
    family.createAssignment.mutate({
      assessmentId: value.assessmentId,
      title: value.title.trim(),
      opensAt: value.opensAt.toISOString(),
      dueAt: value.dueAt.toISOString(),
      timeLimitMinutes: value.timeLimitMinutes ?? null,
      idempotencyKey: idempotencyKey.current,
      studentUserIds: value.studentUserIds,
    }, { onSuccess: () => {
      idempotencyKey.current = null;
      form.resetFields();
      setCourseId('');
      setOpen(false);
    } });
  };

  return <Card title="Family practice" extra={<Button type="primary" disabled={!children.length} onClick={() => setOpen(true)}>Assign practice</Button>}>
    <Typography.Paragraph type="secondary">
      Assign one of your published assessments to children whose guardian relationship is verified. Their reports show progress and results only after publication.
    </Typography.Paragraph>
    {initialSelectionError ? <Alert type="error" showIcon message="Could not load the linked lesson." action={<Button onClick={() => {
      if (courses.courses.isError) void courses.courses.refetch();
      if (initialContent.assessments.isError) void initialContent.assessments.refetch();
    }}>Retry</Button>} /> : initialSelectionUnavailable ? <Alert type="warning" showIcon message="This lesson is unavailable for assignment. Choose one of your published lessons instead." /> : null}
    {!family.children.isPending && family.children.isError ? <Alert type="error" showIcon message="Could not load verified children." action={<Button type="link" onClick={() => void family.children.refetch()}>Retry</Button>} /> : null}
    {!family.children.isPending && !family.children.isError && children.length === 0 ? <Alert type="info" showIcon message="No verified children are linked to your account yet." /> : null}
    {family.assignments.isError ? <Alert type="error" showIcon message="Could not load family assignments." action={<Button type="link" onClick={() => void family.assignments.refetch()}>Retry</Button>} style={{ marginBottom: 12 }} /> : null}
    <Table rowKey="id" scroll={{ x: 'max-content' }} loading={family.assignments.isPending} dataSource={family.assignments.data ?? []} pagination={{ pageSize: 5 }} locale={{ emptyText: 'No family practice assigned yet.' }} expandable={{
      expandedRowKeys: expandedAssignmentId ? [expandedAssignmentId] : [],
      showExpandColumn: false,
      expandedRowRender: row => <EducationAssignmentGradebook userId={userId} assignment={row} enabled={expandedAssignmentId === row.id} />,
    }} columns={[
      { title: 'Practice', dataIndex: 'title' },
      { title: 'Children', dataIndex: 'recipients', render: (recipients: unknown[]) => recipients.length },
      { title: 'Opens', dataIndex: 'opensAt', render: (date: string) => new Date(date).toLocaleString() },
      { title: 'Due', dataIndex: 'dueAt', render: (date: string) => new Date(date).toLocaleString() },
      { title: 'Assessment', render: (_: unknown, row) => <Link to={adminPaths.educationAssessment(row.assessmentId)}>v{row.assessmentVersion}</Link> },
      { title: 'Progress and results', render: (_: unknown, row) => <Button type="link" onClick={() => setExpandedAssignmentId(current => current === row.id ? null : row.id)}>{expandedAssignmentId === row.id ? 'Hide results' : 'View progress'}</Button> },
    ]} />

    <Modal title="Assign family practice" open={open} forceRender onCancel={() => !family.createAssignment.isPending && setOpen(false)} footer={null}>
      <Typography.Paragraph type="secondary">Only verified children are available. The assessment content and scoring version are fixed when assigned.</Typography.Paragraph>
      <Form form={form} layout="vertical" disabled={family.createAssignment.isPending} onValuesChange={() => { idempotencyKey.current = null; }} onFinish={create} initialValues={{ opensAt: dayjs(), dueAt: dayjs().add(7, 'day') }}>
        <Form.Item name="title" label="Practice title" rules={[{ required: true }, { max: 200 }]}><Input maxLength={200} /></Form.Item>
        <Form.Item name="courseId" label="Course" rules={[{ required: true }]}>
          <Select loading={courses.courses.isPending} onChange={value => { setCourseId(value); form.setFieldValue('assessmentId', undefined); }} options={(courses.courses.data ?? []).filter(item => !item.isPlatformCourse).map(item => ({ value: item.id, label: item.title }))} />
        </Form.Item>
        <Form.Item name="assessmentId" label="Published assessment" rules={[{ required: true }]}>
          <PublishedAssessmentSelect userId={userId} courseId={courseId} />
        </Form.Item>
        <Form.Item name="studentUserIds" label="Children" rules={[{ required: true, message: 'Choose at least one verified child.' }]}>
          <Select mode="multiple" loading={family.children.isPending} placeholder="Choose children" options={children.map(child => ({ value: child.studentUserId, label: child.studentName }))} />
        </Form.Item>
        <Space wrap align="start">
          <Form.Item name="opensAt" label="Opens at (your local time)" rules={[{ required: true }]}><DatePicker showTime /></Form.Item>
          <Form.Item name="dueAt" label="Due at (your local time)" dependencies={['opensAt']} rules={[{ required: true }, { validator: (_, value: Dayjs | undefined) => {
            const opensAt = form.getFieldValue('opensAt') as Dayjs | undefined;
            return !value || !opensAt || value.isAfter(opensAt) ? Promise.resolve() : Promise.reject(new Error('Due time must be after the opening time.'));
          } }]}><DatePicker showTime /></Form.Item>
          <Form.Item name="timeLimitMinutes" label="Time limit (minutes)"><InputNumber min={1} precision={0} /></Form.Item>
        </Space>
        {children.length === 0 ? <Alert type="info" showIcon message="Verify a guardian relationship before assigning family practice." style={{ marginBottom: 16 }} /> : null}
        <Button type="primary" htmlType="submit" disabled={!children.length || family.children.isError} loading={family.createAssignment.isPending}>Create assignment</Button>
      </Form>
    </Modal>
  </Card>;
}
