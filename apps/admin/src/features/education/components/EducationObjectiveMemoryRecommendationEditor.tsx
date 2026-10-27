import { Button, Flex, Select } from 'antd';
import { useEffect, useState } from 'react';
import { useEducationText } from '../i18n/useEducationText';

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
  const { t } = useEducationText();
  const [selectedId, setSelectedId] = useState<string | undefined>(currentId ?? undefined);
  useEffect(() => setSelectedId(currentId ?? undefined), [currentId]);

  const options = memorySets.map(set => ({
    value: set.id,
    label: `${set.title} · ${t(set.techniqueKey === 'palace' ? 'typePalace' : 'typePeg')}`,
  }));
  if (currentId && !options.some(option => option.value === currentId)) {
    options.unshift({ value: currentId, label: t('recommendationUnavailable') });
  }

  return <Flex align="center" gap={8} className="education-memory-recommendation-editor">
    <Select
      allowClear
      aria-label="Recommended memory practice"
      placeholder={t('noRecommendation')}
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
