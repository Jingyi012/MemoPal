import { Form, Input, InputNumber, Modal } from 'antd';
import { useEffect } from 'react';

type GradeCorrectionValues = { score: number; reason: string };

export function GradeCorrectionModal({ open, studentName, score, maxScore, loading, onCancel, onSubmit }: {
  open: boolean;
  studentName: string;
  score: number;
  maxScore: number;
  loading: boolean;
  onCancel: () => void;
  onSubmit: (values: GradeCorrectionValues) => void;
}) {
  const [form] = Form.useForm<GradeCorrectionValues>();
  useEffect(() => {
    if (open) form.setFieldsValue({ score, reason: '' });
  }, [form, open, score]);

  return <Modal title={`Correct grade — ${studentName}`} open={open} okText="Save correction"
    confirmLoading={loading} onCancel={onCancel} onOk={() => void form.submit()} destroyOnClose>
    <Form form={form} layout="vertical" onFinish={onSubmit}>
      <Form.Item name="score" label={`Final score (maximum ${maxScore})`} rules={[{ required: true }, { type: 'number', min: 0, max: maxScore }]}>
        <InputNumber min={0} max={maxScore} precision={2} style={{ width: '100%' }} />
      </Form.Item>
      <Form.Item name="reason" label="Reason (saved in grade history)" rules={[{ required: true }, { max: 1000 }]}>
        <Input.TextArea maxLength={1000} showCount autoSize={{ minRows: 3, maxRows: 6 }} />
      </Form.Item>
    </Form>
  </Modal>;
}
