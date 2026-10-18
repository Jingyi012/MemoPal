import { ArrowDownOutlined, ArrowUpOutlined, AudioOutlined, CameraOutlined } from '@ant-design/icons';
import { Button, Card, Checkbox, Input, InputNumber, Radio, Select, Space, Tag, Typography } from 'antd';
import { useState } from 'react';
import type { EducationQuestionPreview } from '../utils/educationQuestionPreview';

const typeLabels: Record<EducationQuestionPreview['type'], string> = {
  'single-choice': 'Multiple choice',
  'multiple-select': 'Select all that apply',
  ordering: 'Put in order',
  matching: 'Match pairs',
  'true-false': 'True or false',
  'fill-blank': 'Fill in the blank',
  'written-response': 'Written response',
  'photo-response': 'Photo response',
  'voice-response': 'Voice response',
};

export function EducationQuestionPreviewCard({ question, index }: {
  question: EducationQuestionPreview;
  index: number;
}) {
  const [orderedOptions, setOrderedOptions] = useState([...question.options]);
  const [matches, setMatches] = useState<Record<number, string>>({});

  const moveOption = (optionIndex: number, offset: -1 | 1) => {
    setOrderedOptions(current => {
      const nextIndex = optionIndex + offset;
      if (nextIndex < 0 || nextIndex >= current.length) return current;
      const next = [...current];
      [next[optionIndex], next[nextIndex]] = [next[nextIndex], next[optionIndex]];
      return next;
    });
  };

  return <Card size="small" title={`Question ${index + 1}`}>
    <Space direction="vertical" size="middle" style={{ display: 'flex' }}>
      <Space wrap><Tag>{typeLabels[question.type]}</Tag><Typography.Text type="secondary">{question.maxScore} points</Typography.Text></Space>
      <Typography.Text strong>{question.prompt || 'Question prompt'}</Typography.Text>
      {question.type === 'single-choice' && <Radio.Group options={[...question.options]} />}
      {question.type === 'multiple-select' && <Checkbox.Group options={[...question.options]} />}
      {question.type === 'ordering' && <Space direction="vertical" style={{ display: 'flex' }}>
        {orderedOptions.map((option, optionIndex) => <Space key={`${optionIndex}-${option}`}>
          <Typography.Text>{optionIndex + 1}. {option || `Item ${optionIndex + 1}`}</Typography.Text>
          <Button aria-label={`Move ${option || `item ${optionIndex + 1}`} up`} icon={<ArrowUpOutlined />}
            disabled={optionIndex === 0} onClick={() => moveOption(optionIndex, -1)} />
          <Button aria-label={`Move ${option || `item ${optionIndex + 1}`} down`} icon={<ArrowDownOutlined />}
            disabled={optionIndex === orderedOptions.length - 1} onClick={() => moveOption(optionIndex, 1)} />
        </Space>)}
      </Space>}
      {question.type === 'matching' && <Space direction="vertical" style={{ display: 'flex' }}>
        {question.options.map((option, optionIndex) => <Space key={`${optionIndex}-${option}`} wrap>
          <Typography.Text>{option || `Item ${optionIndex + 1}`}</Typography.Text>
          <Select aria-label={`Choose a match for ${option || `item ${optionIndex + 1}`}`} allowClear
            placeholder="Choose a match" style={{ minWidth: 200 }} value={matches[optionIndex]}
            onChange={value => setMatches(current => {
              const next = { ...current };
              if (value === undefined) delete next[optionIndex];
              else {
                Object.entries(next).forEach(([leftIndex, selectedTarget]) => {
                  if (Number(leftIndex) !== optionIndex && selectedTarget === value) delete next[Number(leftIndex)];
                });
                next[optionIndex] = value;
              }
              return next;
            })}
            options={question.matchingTargets.map((target, targetIndex) => ({
              value: String(targetIndex), label: target || `Match ${targetIndex + 1}`,
              disabled: Object.entries(matches).some(([leftIndex, selectedTarget]) => Number(leftIndex) !== optionIndex && selectedTarget === String(targetIndex)),
            }))} />
        </Space>)}
      </Space>}
      {question.type === 'true-false' && <Radio.Group options={['True', 'False']} />}
      {question.type === 'fill-blank' && (question.fillMode === 'number'
        ? <InputNumber placeholder="Your answer" style={{ width: '100%' }} />
        : <Input placeholder="Your answer" />)}
      {question.type === 'written-response' && <Input.TextArea placeholder="Your answer" autoSize={{ minRows: 3, maxRows: 5 }} />}
      {question.type === 'photo-response' && <Space>
        <Button icon={<CameraOutlined />} disabled>Choose or take a photo</Button>
        <Typography.Text type="secondary">Students can replace the photo before submission.</Typography.Text>
      </Space>}
      {question.type === 'voice-response' && <Space>
        <Button icon={<AudioOutlined />} disabled>Record an answer</Button>
        <Typography.Text type="secondary">Students can replay or replace the recording before submission.</Typography.Text>
      </Space>}
      {question.explanation && <Typography.Text type="secondary">Explanation shown after results are published: {question.explanation}</Typography.Text>}
    </Space>
  </Card>;
}
