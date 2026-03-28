import { Button, Card, Space, Steps, Tag, Typography } from 'antd';
import type { LocationDto } from '../../../../types/content';
import { WordPlannerBoard, type PlannedWordItem } from '../word-setup/WordPlannerBoard';

type LessonWordsPlannerPanelProps = {
  plannedWords: PlannedWordItem[];
  locations: LocationDto[];
  assignedPlannedCount: number;
  unassignedPlannedCount: number;
  canSavePlannedWords: boolean;
  isSaving: boolean;
  onOpenBatch: () => void;
  onSave: () => Promise<void>;
  onMoveWord: (wordId: string, locationId: string | null) => void;
  onRemoveWord: (wordId: string) => void;
};

export function LessonWordsPlannerPanel({
  plannedWords,
  locations,
  assignedPlannedCount,
  unassignedPlannedCount,
  canSavePlannedWords,
  isSaving,
  onOpenBatch,
  onSave,
  onMoveWord,
  onRemoveWord,
}: LessonWordsPlannerPanelProps) {
  return (
    <Card
      title='Add New Words Planner'
      extra={
        <Space wrap>
          <Tag color='blue'>Planned: {plannedWords.length}</Tag>
          <Tag color='green'>Assigned: {assignedPlannedCount}</Tag>
          <Tag color={unassignedPlannedCount > 0 ? 'gold' : 'default'}>
            Unassigned: {unassignedPlannedCount}
          </Tag>
        </Space>
      }
    >
      <Space direction='vertical' size={12} style={{ width: '100%' }}>
        <Typography.Text type='secondary'>
          Add all words first, assign each word to a location, then save once.
        </Typography.Text>

        <Space>
          <Button onClick={onOpenBatch}>Add Batch Lines</Button>
          <Button
            type='primary'
            onClick={() => void onSave()}
            loading={isSaving}
            disabled={!canSavePlannedWords}
          >
            Save Planned Words
          </Button>
        </Space>

        <Steps
          size='small'
          current={plannedWords.length === 0 ? 0 : unassignedPlannedCount > 0 ? 1 : 2}
          items={[{ title: 'Add words' }, { title: 'Assign locations' }, { title: 'Save to lesson' }]}
        />

        <WordPlannerBoard
          withCard={false}
          plannedWords={plannedWords}
          locations={locations}
          onMoveWord={onMoveWord}
          onRemoveWord={onRemoveWord}
        />
      </Space>
    </Card>
  );
}

