import { Button, Card, Checkbox, Form, Form as AntForm, Input, InputNumber, Select, Space, Typography } from 'antd';
import { DeleteOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons';
import type { FormInstance } from 'antd';
import type { EducationObjectiveDto, EducationQuestionRequest } from '../../../types/educationAuthoring';
import { toEducationQuestionRequests, type AssessmentFormValue, type QuestionFormValue } from '../utils/educationQuestionForm';
import { toEducationQuestionPreview } from '../utils/educationQuestionPreview';
import { EducationQuestionPreviewModal } from './EducationQuestionPreviewModal';
import { EducationMatchingPairsEditor } from './EducationMatchingPairsEditor';
import { useState } from 'react';

function QuestionOptionsEditor({ questionName, disabled, maximum, label }: {
  questionName: number; disabled: boolean; maximum: number; label: string;
}) {
  return <>
    <Typography.Text strong>{label}</Typography.Text>
    <Form.List name={[questionName, 'options']} rules={[{ validator: async (_, values: QuestionFormValue['options']) => {
      if (!values || values.length < 2 || values.length > maximum) throw new Error(`Add between 2 and ${maximum} items.`);
    } }]}>
      {(fields, { add, remove }, { errors }) => <>
        {fields.map((field, optionIndex) => <Space key={field.key} align="baseline" style={{ display: 'flex' }}>
          <Form.Item name={[field.name, 'id']} hidden><Input /></Form.Item>
          <Form.Item name={[field.name, 'label']} label={`Item ${optionIndex + 1}`} rules={[{ required: true }, { max: 500 }]}><Input disabled={disabled} /></Form.Item>
          {!disabled && <Button type="text" danger aria-label={`Remove item ${optionIndex + 1}`} icon={<DeleteOutlined />} onClick={() => remove(field.name)} />}
        </Space>)}
        {!disabled && fields.length < maximum && <Button icon={<PlusOutlined />} onClick={() => add({ id: crypto.randomUUID(), label: '' })}>Add item</Button>}
        <AntForm.ErrorList errors={errors} />
      </>}
    </Form.List>
  </>;
}

function QuestionEditorCard({ form, name, index, objectives, onRemove, disabled }: {
  form: FormInstance<AssessmentFormValue>; name: number; index: number; objectives: EducationObjectiveDto[]; onRemove: () => void; disabled: boolean;
}) {
  const type = Form.useWatch(['questions', name, 'type'], form) as QuestionFormValue['type'] | undefined;
  const fillMode = Form.useWatch(['questions', name, 'fillMode'], form) as QuestionFormValue['fillMode'] | undefined;
  const options = (Form.useWatch(['questions', name, 'options'], form) ?? []) as Array<{ id: string; label: string }>;
  return <Card size="small" title={`Question ${index + 1}`} extra={!disabled && <Button aria-label={`Remove question ${index + 1}`} danger type="text" icon={<DeleteOutlined />} onClick={onRemove} />}>
    <Form.Item name={[name, 'id']} hidden><Input /></Form.Item>
    <Form.Item name={[name, 'prompt']} label="Question prompt" rules={[{ required: true }, { max: 1000 }]}><Input.TextArea autoSize={{ minRows: 2, maxRows: 5 }} disabled={disabled} /></Form.Item>
    <Form.Item name={[name, 'explanation']} label="Question explanation (shown after results are published)" rules={[{ max: 2000 }]}><Input.TextArea showCount maxLength={2000} autoSize={{ minRows: 2, maxRows: 4 }} disabled={disabled} /></Form.Item>
    <Space align="start" wrap>
      <Form.Item name={[name, 'type']} label="Answer method" rules={[{ required: true }]}>
        <Select disabled={disabled} style={{ width: 200 }} options={[
          { value: 'single-choice', label: 'Multiple choice' },
          { value: 'multiple-select', label: 'Select all that apply' },
          { value: 'ordering', label: 'Put in order' },
          { value: 'matching', label: 'Match pairs' },
          { value: 'true-false', label: 'True or false' },
          { value: 'fill-blank', label: 'Fill in the blank' },
          { value: 'written-response', label: 'Written response (manual grading)' },
          { value: 'photo-response', label: 'Photo response (manual grading)' },
          { value: 'voice-response', label: 'Voice response (manual grading)' },
        ]} />
      </Form.Item>
      <Form.Item name={[name, 'objectiveId']} label="Learning objective" rules={[{ required: true }]}>
        <Select disabled={disabled} style={{ width: 240 }} placeholder="Choose objective" options={objectives.map(item => ({ value: item.id, label: item.title }))} />
      </Form.Item>
      <Form.Item name={[name, 'maxScore']} label="Points" rules={[{ required: true }]}><InputNumber min={0.01} max={99999999.99} precision={2} disabled={disabled} /></Form.Item>
    </Space>

    {type === 'single-choice' && <>
      <QuestionOptionsEditor questionName={name} disabled={disabled} maximum={4} label="Options (2–4)" />
      <Form.Item label="Correct option" name={[name, 'correctOptionId']} rules={[{ required: true, message: 'Choose the correct option.' }]}>
        <Select disabled={disabled} placeholder="Choose correct option" options={options.filter(item => item.id && item.label).map(item => ({ value: item.id, label: item.label }))} />
      </Form.Item>
    </>}

    {type === 'multiple-select' && <>
      <QuestionOptionsEditor questionName={name} disabled={disabled} maximum={4} label="Options (2–4)" />
      <Form.Item shouldUpdate={(previous, current) => previous.questions?.[name]?.options !== current.questions?.[name]?.options} noStyle>
        {() => <Form.Item label="Correct options" name={[name, 'correctOptionIds']} rules={[{ validator: async (_, ids: string[]) => {
          if (!ids || ids.length < 2) throw new Error('Choose at least two correct options.');
        } }]}>
          <Checkbox.Group options={((form.getFieldValue(['questions', name, 'options']) ?? []) as Array<{ id: string; label: string }>).filter(item => item.id && item.label).map(item => ({ value: item.id, label: item.label }))} disabled={disabled} />
        </Form.Item>}
      </Form.Item>
    </>}

    {type === 'ordering' && <>
      <QuestionOptionsEditor questionName={name} disabled={disabled} maximum={10} label="Items (shown in this starting order)" />
      <Typography.Text type="secondary">Select every item in the correct sequence. The student will reorder the starting list.</Typography.Text>
      <Form.Item name={[name, 'correctSequenceIds']} rules={[{ validator: async (_, ids: string[] | undefined) => {
        const optionIds = options.map(item => item.id);
        if (!ids || ids.length !== optionIds.length || new Set(ids).size !== optionIds.length || optionIds.some(id => !ids.includes(id))) {
          throw new Error('Choose every item exactly once in the correct order.');
        }
      } }]}>
        <Select mode="multiple" disabled={disabled} placeholder="Select items in correct order" options={options.filter(item => item.id && item.label).map(item => ({ value: item.id, label: item.label }))} />
      </Form.Item>
    </>}

    {type === 'matching' && <>
      <Typography.Text type="secondary">Each row defines one private answer pair; students see the two columns separately.</Typography.Text>
      <EducationMatchingPairsEditor questionName={name} disabled={disabled} />
    </>}

    {type === 'true-false' && <Form.Item name={[name, 'correctBooleanAnswer']} label="Correct answer" rules={[{ required: true }]}>
      <Select disabled={disabled} options={[{ value: true, label: 'True' }, { value: false, label: 'False' }]} />
    </Form.Item>}

    {(type === 'written-response' || type === 'photo-response' || type === 'voice-response') && <Form.Item name={[name, 'gradingRubric']} label="Teacher grading rubric" rules={[{ required: true }, { min: 1 }, { max: 4000 }]}>
      <Input.TextArea disabled={disabled} showCount maxLength={4000} autoSize={{ minRows: 3, maxRows: 8 }} placeholder={type === 'photo-response' ? 'Describe what makes a photo answer complete and how to award partial credit.' : type === 'voice-response' ? 'Describe the key ideas and speaking criteria; audio is reviewed by the teacher, not automatically scored.' : 'Describe criteria, expected elements, and partial-credit rules.'} />
    </Form.Item>}

    {type === 'fill-blank' && <>
      <Form.Item name={[name, 'fillMode']} label="Answer format" rules={[{ required: true }]}>
        <Select disabled={disabled} options={[{ value: 'text', label: 'Text' }, { value: 'number', label: 'Number' }]} />
      </Form.Item>
      {fillMode === 'text' && <>
        <Form.Item name={[name, 'allowedTextAnswers']} label="Accepted answers (one per line)" rules={[{ validator: async (_, value: string | undefined) => {
          const answers = (value ?? '').split(/\r?\n/).filter(item => item.trim().length > 0);
          if (!answers.length || answers.length > 20 || answers.some(answer => answer.length > 500)) throw new Error('Enter 1–20 answers, each 500 characters or fewer.');
        } }]}><Input.TextArea disabled={disabled} autoSize={{ minRows: 2, maxRows: 5 }} /></Form.Item>
        <Space wrap>
          <Form.Item name={[name, 'trimTextAnswers']} label="Ignore leading/trailing spaces"><Select disabled={disabled} options={[{ value: true, label: 'Yes' }, { value: false, label: 'No' }]} /></Form.Item>
          <Form.Item name={[name, 'ignoreCase']} label="Ignore capitalization"><Select disabled={disabled} options={[{ value: true, label: 'Yes' }, { value: false, label: 'No' }]} /></Form.Item>
        </Space>
      </>}
      {fillMode === 'number' && <Space wrap>
        <Form.Item name={[name, 'allowedNumericAnswers']} label="Accepted numbers (comma separated)" rules={[{ validator: async (_, value: string | undefined) => {
          const values = (value ?? '').split(',').map(item => item.trim());
          const validDecimal = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/;
          if (!values.length || values.length > 20 || values.some(item => !validDecimal.test(item) || !Number.isFinite(Number(item)))) throw new Error('Enter 1–20 decimal answers, separated by commas.');
        } }]}><Input disabled={disabled} placeholder="e.g. 0.5, 1" /></Form.Item>
        <Form.Item name={[name, 'numericTolerance']} label="Allowed tolerance"><InputNumber min={0} disabled={disabled} /></Form.Item>
      </Space>}
    </>}
  </Card>;
}

export function EducationQuestionEditor({ form, objectives, disabled, onSave, saving }: {
  form: FormInstance<AssessmentFormValue>; objectives: EducationObjectiveDto[]; disabled: boolean; saving: boolean;
  onSave: (title: string, questions: EducationQuestionRequest[]) => void;
}) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const previewQuestions = (Form.useWatch('questions', form) ?? []) as QuestionFormValue[];
  return <>
    <Form form={form} layout="vertical" onFinish={values => onSave(values.title, toEducationQuestionRequests(values))}>
    <Form.Item name="title" label="Assessment title" rules={[{ required: true }, { max: 200 }]}><Input disabled={disabled} maxLength={200} /></Form.Item>
    <Form.List name="questions">
      {(fields, { add, remove }) => <Space direction="vertical" size="middle" style={{ display: 'flex' }}>
        {fields.map((field, index) => <QuestionEditorCard key={field.key} form={form} name={field.name} index={index} objectives={objectives} onRemove={() => remove(field.name)} disabled={disabled} />)}
        {!disabled && <Button icon={<PlusOutlined />} onClick={() => add({ id: null, prompt: '', type: 'single-choice', maxScore: 1, objectiveId: '', options: [{ id: crypto.randomUUID(), label: '' }, { id: crypto.randomUUID(), label: '' }], correctOptionIds: [], correctSequenceIds: [], matchingPairs: [], allowedTextAnswers: '', allowedNumericAnswers: '', trimTextAnswers: true, ignoreCase: false, numericTolerance: 0 })}>Add question</Button>}
      </Space>}
    </Form.List>
      <Space style={{ marginTop: 20 }}>
        {!disabled && <Button type="primary" htmlType="submit" loading={saving}>Save draft</Button>}
        <Button icon={<EyeOutlined />} disabled={previewQuestions.length === 0} onClick={() => setPreviewOpen(true)}>Preview as student</Button>
      </Space>
    </Form>
    <EducationQuestionPreviewModal open={previewOpen} questions={previewQuestions.map(toEducationQuestionPreview)} onClose={() => setPreviewOpen(false)} />
  </>;
}

export type { AssessmentFormValue } from '../utils/educationQuestionForm';
