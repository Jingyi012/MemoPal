import { Button, Empty, Modal, Space } from 'antd';
import type { EducationQuestionPreview } from '../utils/educationQuestionPreview';
import { EducationQuestionPreviewCard } from './EducationQuestionPreviewCard';

type EducationQuestionPreviewModalProps = Readonly<{
  open: boolean;
  questions: readonly EducationQuestionPreview[];
  onClose: () => void;
}>;

export function EducationQuestionPreviewModal({ open, questions, onClose }: EducationQuestionPreviewModalProps) {
  return <Modal title="Student preview" open={open} onCancel={onClose} footer={<Button onClick={onClose}>Close preview</Button>} width={760} destroyOnHidden>
    {questions.length === 0 ? <Empty description="Add a question to preview this assessment." /> : (
      <Space direction="vertical" size="middle" style={{ display: 'flex', maxHeight: '65vh', overflowY: 'auto', padding: 2 }}>
        {questions.map((question, index) => <EducationQuestionPreviewCard
          key={`${index}-${JSON.stringify(question)}`} question={question} index={index} />)}
      </Space>
    )}
  </Modal>;
}
