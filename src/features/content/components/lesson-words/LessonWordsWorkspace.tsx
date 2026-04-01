import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import type { ProColumns } from '@ant-design/pro-components';
import { useMutation } from '@tanstack/react-query';
import { Alert, App, Button, Card, Popconfirm, Space, Tabs, Typography } from 'antd';
import { useMemo, useState } from 'react';
import type { WordDto, WordUpsertRequest } from '../../../../types/content';
import { useAdminContentApi } from '../../hooks/useAdminContentApi';
import { MediaThumbnail } from '../MediaThumbnail';
import { WordLocationBoard } from '../word-setup/WordLocationBoard';
import { type PlannedWordItem } from '../word-setup/WordPlannerBoard';
import { useLessonWordsData } from '../../hooks/useLessonWordsData';
import { LessonWordsHeader } from './LessonWordsHeader';
import { LessonWordsListPanel } from './LessonWordsListPanel';
import { LessonWordsModals } from './LessonWordsModals';
import { LessonWordsPlannerPanel } from './LessonWordsPlannerPanel';

function createTempId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `tmp-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

type LessonWordsTabKey = 'words' | 'board' | 'planner';

type WordFormValues = {
  locationId: string;
  text: string;
  meaning?: string;
};

interface LessonWordsWorkspaceProps {
  palaceId: string;
  lessonId: string;
  onBack: () => void;
}

export function LessonWordsWorkspace({ palaceId, lessonId, onBack }: LessonWordsWorkspaceProps) {
  const { message } = App.useApp();
  const {
    createWord,
    updateWord,
    createWordsBatch,
    deleteWord,
  } = useAdminContentApi();
  const [activeTab, setActiveTab] = useState<LessonWordsTabKey>('words');
  const [createOpen, setCreateOpen] = useState(false);
  const [batchOpen, setBatchOpen] = useState(false);
  const [plannedWords, setPlannedWords] = useState<PlannedWordItem[]>([]);
  const [editingWord, setEditingWord] = useState<WordDto | null>(null);
  const {
    palaceQuery,
    lessonQuery,
    locationsQuery,
    wordsQuery,
    locationByIdMap,
    refreshWords,
  } = useLessonWordsData(palaceId, lessonId);

  const locationOptions = useMemo(
    () =>
      (locationsQuery.data ?? []).map((location) => ({
        label: (
          <Space size={8}>
            <MediaThumbnail path={location.imageUrl} alt={`${location.name} image`} width={48} height={32} />
            <Typography.Text>{`${location.position}. ${location.name}`}</Typography.Text>
          </Space>
        ),
        value: location.id,
        title: `${location.position}. ${location.name}`,
      })),
    [locationsQuery.data]
  );

  const renderLocation = (locationId: string) => {
    const location = locationByIdMap.get(locationId);
    if (!location) return locationId;

    return (
      <Space size={8}>
        <MediaThumbnail path={location.imageUrl} alt={`${location.name} image`} width={52} height={34} />
        <Typography.Text>{`${location.position}. ${location.name}`}</Typography.Text>
      </Space>
    );
  };

  const createWordMutation = useMutation({
    mutationFn: (payload: WordUpsertRequest) => createWord(payload),
    onSuccess: async () => {
      message.success('Word created.');
      setCreateOpen(false);
      await refreshWords();
    },
  });

  const updateWordMutation = useMutation({
    mutationFn: (args: { id: string; payload: WordUpsertRequest }) =>
      updateWord(args.id, args.payload),
    onSuccess: async () => {
      message.success('Word updated.');
      setEditingWord(null);
      await refreshWords();
    },
  });

  const moveWordMutation = useMutation({
    mutationFn: (args: { id: string; payload: WordUpsertRequest }) =>
      updateWord(args.id, args.payload),
    onSuccess: async () => {
      await refreshWords();
    },
  });

  const batchCreateMutation = useMutation({
    mutationFn: (payload: WordUpsertRequest[]) => createWordsBatch(payload),
    onSuccess: async (createdWords) => {
      message.success(`${createdWords.length} words created.`);
      setPlannedWords([]);
      setBatchOpen(false);
      await refreshWords();
    },
  });

  const deleteWordMutation = useMutation({
    mutationFn: deleteWord,
    onSuccess: async () => {
      message.success('Word deleted.');
      await refreshWords();
    },
  });

  const wordsColumns: ProColumns<WordDto>[] = [
    { title: 'Word', dataIndex: 'text' },
    { title: 'Meaning', dataIndex: 'meaning' },
    {
      title: 'Location',
      dataIndex: 'locationId',
      width: 220,
      render: (_, row) => renderLocation(row.locationId),
    },
    {
      title: 'Actions',
      valueType: 'option',
      width: 120,
      render: (_, row) => [
        <Button key='edit' size='small' icon={<EditOutlined />} onClick={() => setEditingWord(row)} />,
        <Popconfirm key='delete' title='Delete this word?' onConfirm={() => deleteWordMutation.mutate(row.id)}>
          <Button size='small' danger icon={<DeleteOutlined />} />
        </Popconfirm>,
      ],
    },
  ];

  const existingWords = wordsQuery.data ?? [];
  const assignedPlannedCount = plannedWords.filter((word) => !!word.locationId).length;
  const unassignedPlannedCount = plannedWords.length - assignedPlannedCount;
  const canSavePlannedWords = plannedWords.length > 0 && unassignedPlannedCount === 0;

  if (palaceQuery.isLoading || lessonQuery.isLoading) {
    return <Card loading />;
  }

  if (palaceQuery.isError || lessonQuery.isError || !palaceQuery.data || !lessonQuery.data) {
    return <Alert type='error' showIcon message='Failed to load lesson context.' />;
  }

  const parseBatchLines = (raw: string): Array<{ text: string; meaning: string | null }> => {
    return raw
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => {
        const [textPart, ...meaningParts] = line.split('|');
        const text = textPart?.trim() ?? '';
        const meaning = meaningParts.join('|').trim();
        return { text, meaning: meaning.length > 0 ? meaning : null };
      })
      .filter((item) => item.text.length > 0);
  };

  const addPlannedWords = (items: Array<{ text: string; meaning: string | null }>) => {
    const existingWordKeys = new Set(
      [...existingWords, ...plannedWords].map(
        (item) => `${item.text.trim().toLowerCase()}|${(item.meaning ?? '').trim().toLowerCase()}`
      )
    );

    const uniqueItems = items.filter((item) => {
      const key = `${item.text.trim().toLowerCase()}|${(item.meaning ?? '').trim().toLowerCase()}`;
      if (existingWordKeys.has(key)) {
        return false;
      }
      existingWordKeys.add(key);
      return true;
    });

    if (uniqueItems.length === 0) {
      message.warning('All entered words already exist in this lesson or planner.');
      return;
    }

    setPlannedWords((prev) => [
      ...prev,
      ...uniqueItems.map((item) => ({
        id: createTempId(),
        text: item.text,
        meaning: item.meaning,
        locationId: null,
      })),
    ]);
    message.success(`${uniqueItems.length} words added to planner.`);
  };

  const handleMoveWord = async (word: WordDto, nextLocationId: string) => {
    await moveWordMutation.mutateAsync({
      id: word.id,
      payload: {
        locationId: nextLocationId,
        text: word.text,
        meaning: word.meaning ?? null,
      },
    });
  };

  const handleMovePlannedWord = (wordId: string, nextLocationId: string | null) => {
    setPlannedWords((prev) =>
      prev.map((item) => (item.id === wordId ? { ...item, locationId: nextLocationId } : item))
    );
  };

  const handleRemovePlannedWord = (wordId: string) => {
    setPlannedWords((prev) => prev.filter((item) => item.id !== wordId));
  };

  const handleSavePlannedWords = async () => {
    if (plannedWords.length === 0) {
      message.warning('Planner is empty.');
      return;
    }

    if (unassignedPlannedCount > 0) {
      message.warning('Please assign all planned words to locations before saving.');
      return;
    }

    await batchCreateMutation.mutateAsync(
      plannedWords.map((item) => ({
        lessonId,
        locationId: item.locationId!,
        text: item.text,
        meaning: item.meaning ?? null,
      }))
    );
  };

  const handleBatchSubmit = async (lines: string): Promise<boolean> => {
    const items = parseBatchLines(lines);
    if (items.length === 0) {
      message.warning('Please provide at least one valid line.');
      return false;
    }

    addPlannedWords(items);
    setBatchOpen(false);
    return true;
  };

  const handleCreateWord = async (values: WordFormValues) => {
    await createWordMutation.mutateAsync({
      lessonId,
      locationId: values.locationId,
      text: values.text,
      meaning: values.meaning || null,
    });
  };

  const handleUpdateWord = async (wordId: string, values: WordFormValues): Promise<boolean> => {
    await updateWordMutation.mutateAsync({
      id: wordId,
      payload: {
        locationId: values.locationId,
        text: values.text,
        meaning: values.meaning || null,
      },
    });
    return true;
  };

  return (
    <Space direction='vertical' size={16} style={{ width: '100%' }}>
      <LessonWordsHeader
        palaceId={palaceId}
        palaceName={palaceQuery.data.name}
        lessonTitle={lessonQuery.data.title}
        onBack={onBack}
      />

      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as LessonWordsTabKey)}
        items={[
          {
            key: 'words',
            label: `Words (${existingWords.length})`,
            children: (
              <LessonWordsListPanel
                lessonTitle={lessonQuery.data.title}
                locationOptions={locationOptions}
                words={existingWords}
                isLoading={wordsQuery.isLoading}
                columns={wordsColumns}
                onOpenPlanner={() => setActiveTab('planner')}
                onCreateWord={() => setCreateOpen(true)}
              />
            ),
          },
          {
            key: 'board',
            label: 'Location Board',
            children: (
              <WordLocationBoard
                title='Reassign Saved Words'
                words={existingWords}
                locations={locationsQuery.data ?? []}
                loading={wordsQuery.isLoading || moveWordMutation.isPending}
                onMoveWord={handleMoveWord}
              />
            ),
          },
          {
            key: 'planner',
            label: `Planner (${plannedWords.length})`,
            children: (
              <LessonWordsPlannerPanel
                plannedWords={plannedWords}
                locations={locationsQuery.data ?? []}
                assignedPlannedCount={assignedPlannedCount}
                unassignedPlannedCount={unassignedPlannedCount}
                canSavePlannedWords={canSavePlannedWords}
                isSaving={batchCreateMutation.isPending}
                onOpenBatch={() => setBatchOpen(true)}
                onSave={handleSavePlannedWords}
                onMoveWord={handleMovePlannedWord}
                onRemoveWord={handleRemovePlannedWord}
              />
            ),
          },
        ]}
      />

      <LessonWordsModals
        createOpen={createOpen}
        batchOpen={batchOpen}
        editingWord={editingWord}
        locationOptions={locationOptions}
        onCreateOpenChange={setCreateOpen}
        onBatchOpenChange={setBatchOpen}
        onEditingWordChange={setEditingWord}
        onCreateWord={handleCreateWord}
        onUpdateWord={handleUpdateWord}
        onBatchSubmit={handleBatchSubmit}
      />
    </Space>
  );
}
