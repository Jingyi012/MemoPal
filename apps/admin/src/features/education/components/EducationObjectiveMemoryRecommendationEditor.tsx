import { Button, Flex, Select } from 'antd';
import { useEffect, useState } from 'react';

type MemorySetOption = { id: string; title: string; techniqueKey: string };

export function EducationObjectiveMemoryRecommendationEditor({
  objectiveId, currentId, memorySets, loading, onSave,
}: {
  objectiveId: string;
  currentId: string | null;
  memorySets: readonly MemorySetOption[];
  loading: boolean;
  onSave: (objectiveId: string, memorySetId: string | null) => void;
}) {
  const [selectedId, setSelectedId] = useState<string | undefined>(currentId ?? undefined);
  useEffect(() => setSelectedId(currentId ?? undefined), [currentId]);

  const options = memorySets.map(set => ({
    value: set.id,
    label: `${set.title} · ${set.techniqueKey === 'palace' ? 'Memory Palace' : 'Number Peg'}`,
  }));
  if (currentId && !options.some(option => option.value === currentId)) {
    options.unshift({ value: currentId, label: 'Unavailable or no longer public (clear this recommendation)' });
  }

  return <Flex align="center" gap={8}>
    <Select
      allowClear
      aria-label="Recommended memory practice"
      placeholder="No recommendation"
      value={selectedId}
      onChange={setSelectedId}
      options={options}
      style={{ minWidth: 240 }}
    />
    <Button
      size="small"
      loading={loading}
      disabled={loading || (selectedId ?? null) === currentId}
      onClick={() => onSave(objectiveId, selectedId ?? null)}
    >Save</Button>
  </Flex>;
}
