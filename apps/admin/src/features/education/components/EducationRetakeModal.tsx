import { Alert, Button, DatePicker, Form, Input, InputNumber, Modal, Space, Typography } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useEffect, useRef } from 'react';
import type { CreateEducationRetakeRequest, EducationAssignmentGradeRowDto } from '../../../types/educationAssignments';

interface RetakeFormValue {
  reason: string;
  opensAt: Dayjs;
  dueAt: Dayjs;
  timeLimitMinutes?: number;
}

export function EducationRetakeModal({
  open,
  student,
  originalTitle,
  loading,
  onCancel,
  onSubmit,
}: {
  open: boolean;
  student: EducationAssignmentGradeRowDto | null;
  originalTitle: string;
  loading: boolean;
  onCancel: () => void;
  onSubmit: (value: CreateEducationRetakeRequest) => void;
}) {
  const [form] = Form.useForm<RetakeFormValue>();
  const idempotencyKey = useRef<string | null>(null);
  useEffect(() => {
    if (open) {
      idempotencyKey.current = null;
      form.setFieldsValue({ opensAt: dayjs(), dueAt: dayjs().add(7, 'day'), reason: undefined });
    } else {
      idempotencyKey.current = null;
    }
  }, [form, open]);
  const submit = (value: RetakeFormValue) => {
    if (!student) return;
    idempotencyKey.current ??= crypto.randomUUID();
    onSubmit({
      studentUserId: student.studentUserId,
      reason: value.reason.trim(),
      opensAt: value.opensAt.toISOString(),
      dueAt: value.dueAt.toISOString(),
      timeLimitMinutes: value.timeLimitMinutes ?? null,
      idempotencyKey: idempotencyKey.current,
    });
  };

  return <Modal title="Authorize an individual retake" open={open} onCancel={() => !loading && onCancel()} footer={null} destroyOnClose>
    <Typography.Paragraph type="secondary">
      This creates a separate assignment for {student?.studentName ?? 'the student'}. The original submission, grade, and ranking stay unchanged; the retake is not ranked with the original class assessment.
    </Typography.Paragraph>
    <Alert type="info" showIcon message={`Based on: ${originalTitle}`} description="The published assessment version is reused." style={{ marginBottom: 16 }} />
    <Form form={form} layout="vertical" onFinish={submit} initialValues={{ opensAt: dayjs(), dueAt: dayjs().add(7, 'day') }}>
      <Form.Item name="reason" label="Reason for retake" rules={[{ required: true, whitespace: true, message: 'Record why this student is receiving a retake.' }, { max: 500 }]}>
        <Input.TextArea maxLength={500} showCount rows={3} />
      </Form.Item>
      <Space wrap align="start">
        <Form.Item name="opensAt" label="Opens at (your local time)" rules={[{ required: true }]}><DatePicker showTime /></Form.Item>
        <Form.Item name="dueAt" label="Due at (your local time)" dependencies={['opensAt']} rules={[{ required: true }, { validator: (_, value: Dayjs | undefined) => {
          const opensAt = form.getFieldValue('opensAt') as Dayjs | undefined;
          return !value || !opensAt || value.isAfter(opensAt) ? Promise.resolve() : Promise.reject(new Error('Due time must be after the opening time.'));
        } }]}><DatePicker showTime /></Form.Item>
        <Form.Item name="timeLimitMinutes" label="Time limit (minutes)"><InputNumber min={1} precision={0} /></Form.Item>
      </Space>
      <Button type="primary" htmlType="submit" loading={loading}>Authorize retake</Button>
    </Form>
  </Modal>;
}
