import { ArrowLeftOutlined, DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import {
  ModalForm,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
  ProTable,
} from '@ant-design/pro-components';
import type { ProColumns } from '@ant-design/pro-components';
import { useMutation } from '@tanstack/react-query';
import { Alert, Breadcrumb, Button, Card, Collapse, Popconfirm, Space, Steps, Tag, Typography, message } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { adminContentApi } from '../../../api/adminContentApi';
import { PortalPageContainer } from '../../../components/PortalPageContainer';
import { adminPaths } from '../../../navigation/adminPaths';
import type { WordDto, WordUpsertRequest } from '../../../types/content';
import { MediaThumbnail } from '../components/MediaThumbnail';
import { WordLocationBoard } from '../components/word-setup/WordLocationBoard';
import { WordPlannerBoard, type PlannedWordItem } from '../components/word-setup/WordPlannerBoard';
import { useLessonWordsData } from '../hooks/useLessonWordsData';

type WordFormValues = {
  locationId: string;
  text: string;
  meaning?: string;
};

type BatchWordFormValues = {
  lines: string;
};

function createTempId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `tmp-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function LessonWordsPage() {
  const { palaceId, lessonId } = useParams<{ palaceId: string; lessonId: string }>();
  const navigate = useNavigate();
  const [createOpen, setCreateOpen] = useState(false);
  const [batchOpen, setBatchOpen] = useState(false);
  const [plannerExpanded, setPlannerExpanded] = useState(false);
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
    mutationFn: (payload: WordUpsertRequest) => adminContentApi.createWord(payload),
    onSuccess: async () => {
      message.success('Word created.');
      setCreateOpen(false);
      await refreshWords();
    },
    onError: () => message.error('Failed to create word.'),
  });

  const updateWordMutation = useMutation({
    mutationFn: (args: { id: string; payload: WordUpsertRequest }) =>
      adminContentApi.updateWord(args.id, args.payload),
    onSuccess: async () => {
      message.success('Word updated.');
      setEditingWord(null);
      await refreshWords();
    },
    onError: () => message.error('Failed to update word.'),
  });

  const moveWordMutation = useMutation({
    mutationFn: (args: { id: string; payload: WordUpsertRequest }) =>
      adminContentApi.updateWord(args.id, args.payload),
    onSuccess: async () => {
      await refreshWords();
    },
    onError: () => message.error('Failed to move word to selected location.'),
  });

  const batchCreateMutation = useMutation({
    mutationFn: (payload: WordUpsertRequest[]) => adminContentApi.createWordsBatch(payload),
    onSuccess: async (createdWords) => {
      message.success(`${createdWords.length} words created.`);
      setPlannedWords([]);
      setBatchOpen(false);
      await refreshWords();
    },
    onError: () => message.error('Failed to create words in batch.'),
  });

  const deleteWordMutation = useMutation({
    mutationFn: (id: string) => adminContentApi.deleteWord(id),
    onSuccess: async () => {
      message.success('Word deleted.');
      await refreshWords();
    },
    onError: () => message.error('Failed to delete word.'),
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

  if (!palaceId || !lessonId) {
    return <Alert type='error' showIcon message='Missing palace or lesson id.' />;
  }

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
      [...(wordsQuery.data ?? []), ...plannedWords].map(
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

  const assignedPlannedCount = plannedWords.filter((word) => !!word.locationId).length;
  const unassignedPlannedCount = plannedWords.length - assignedPlannedCount;
  const canSavePlannedWords = plannedWords.length > 0 && unassignedPlannedCount === 0;
  const existingWords = wordsQuery.data ?? [];
  const existingWordCount = existingWords.length;

  useEffect(() => {
    if (existingWordCount === 0 || plannedWords.length > 0) {
      setPlannerExpanded(true);
    }
  }, [existingWordCount, plannedWords.length]);

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

  return (
    <PortalPageContainer>
      <Space direction='vertical' size={16} style={{ width: '100%' }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(adminPaths.palaceDetails(palaceId))}
          style={{ width: 'fit-content' }}
        >
          Back to Palace Details
        </Button>

        <Breadcrumb
          items={[
            { title: <Link to={adminPaths.palaces}>Palaces</Link> },
            { title: <Link to={adminPaths.palaceDetails(palaceId)}>{palaceQuery.data.name}</Link> },
            { title: lessonQuery.data.title },
            { title: 'Words' },
          ]}
        />

        <Card
          title={`Words for "${lessonQuery.data.title}"`}
          extra={
            <Space>
              <Button onClick={() => setPlannerExpanded(true)}>
                Open Planner
              </Button>
              <Button
                type='primary'
                icon={<PlusOutlined />}
                onClick={() => setCreateOpen(true)}
                disabled={locationOptions.length === 0}
              >
                New Word
              </Button>
            </Space>
          }
        >
          <Space direction='vertical' size={12} style={{ width: '100%' }}>
            <Typography.Text type='secondary'>
              Edit existing words first. Use the planner below for faster batch setup and drag-and-drop assignment.
            </Typography.Text>

            {locationOptions.length === 0 ? (
              <Alert
                type='warning'
                showIcon
                message='No locations found for this palace. Please create locations first.'
              />
            ) : null}

            <ProTable<WordDto>
              rowKey='id'
              search={false}
              options={false}
              pagination={false}
              loading={wordsQuery.isLoading}
              dataSource={existingWords}
              columns={wordsColumns}
            />
          </Space>
        </Card>

        <WordLocationBoard
          title='Reassign Saved Words'
          words={existingWords}
          locations={locationsQuery.data ?? []}
          loading={wordsQuery.isLoading || moveWordMutation.isPending}
          onMoveWord={handleMoveWord}
        />

        <Card>
          <Collapse
            activeKey={plannerExpanded ? ['planner'] : []}
            onChange={(keys) => setPlannerExpanded(Array.isArray(keys) ? keys.includes('planner') : keys === 'planner')}
            items={[
              {
                key: 'planner',
                label: (
                  <Space wrap>
                    <Typography.Text strong>Add New Words Planner</Typography.Text>
                    <Tag color='blue'>Planned: {plannedWords.length}</Tag>
                    <Tag color='green'>Assigned: {assignedPlannedCount}</Tag>
                    <Tag color={unassignedPlannedCount > 0 ? 'gold' : 'default'}>
                      Unassigned: {unassignedPlannedCount}
                    </Tag>
                  </Space>
                ),
                children: (
                  <Space direction='vertical' size={12} style={{ width: '100%' }}>
                    <Typography.Text type='secondary'>
                      Add all words first, assign each word to a location, then save once.
                    </Typography.Text>

                    <Space>
                      <Button onClick={() => setBatchOpen(true)}>Add Batch Lines</Button>
                      <Button
                        type='primary'
                        onClick={() => void handleSavePlannedWords()}
                        loading={batchCreateMutation.isPending}
                        disabled={!canSavePlannedWords}
                      >
                        Save Planned Words
                      </Button>
                    </Space>

                    <Steps
                      size='small'
                      current={plannedWords.length === 0 ? 0 : unassignedPlannedCount > 0 ? 1 : 2}
                      items={[
                        { title: 'Add words' },
                        { title: 'Assign locations' },
                        { title: 'Save to lesson' },
                      ]}
                    />

                    <WordPlannerBoard
                      withCard={false}
                      plannedWords={plannedWords}
                      locations={locationsQuery.data ?? []}
                      onMoveWord={handleMovePlannedWord}
                      onRemoveWord={handleRemovePlannedWord}
                    />
                  </Space>
                ),
              },
            ]}
          />
        </Card>

        <ModalForm<WordFormValues>
        title='Create Word'
        open={createOpen}
        modalProps={{ destroyOnClose: true }}
        layout='horizontal'
        labelCol={{ span: 7 }}
        wrapperCol={{ span: 17 }}
        onOpenChange={setCreateOpen}
        onFinish={async (values) => {
          await createWordMutation.mutateAsync({
            lessonId,
            locationId: values.locationId,
            text: values.text,
            meaning: values.meaning || null,
          });
          return true;
        }}
      >
        <ProFormSelect
          name='locationId'
          label='Location'
          placeholder='Select a location'
          options={locationOptions}
          fieldProps={{
            showSearch: true,
            optionFilterProp: 'title',
            placeholder: 'Select a location',
          }}
          rules={[{ required: true }]}
        />
        <ProFormText
          name='text'
          label='Word'
          rules={[{ required: true }]}
          fieldProps={{ placeholder: 'Enter word (e.g., Lantern)' }}
        />
        <ProFormText
          name='meaning'
          label='Meaning'
          fieldProps={{ placeholder: 'Enter meaning (optional)' }}
        />
      </ModalForm>

        <ModalForm<BatchWordFormValues>
        title='Batch Add Words'
        open={batchOpen}
        modalProps={{ destroyOnClose: true }}
        layout='horizontal'
        labelCol={{ span: 7 }}
        wrapperCol={{ span: 17 }}
        onOpenChange={setBatchOpen}
        onFinish={async (values) => {
          const items = parseBatchLines(values.lines);
          if (items.length === 0) {
            message.warning('Please provide at least one valid line.');
            return false;
          }

          addPlannedWords(items);
          setBatchOpen(false);
          return true;
        }}
      >
        <ProFormTextArea
          name='lines'
          label='Words'
          fieldProps={{
            rows: 8,
            placeholder: 'apple | a fruit\nanchor | something that holds steady',
          }}
          extra='One line per word. Format: word | meaning (meaning is optional).'
          rules={[{ required: true }]}
        />
      </ModalForm>

        <ModalForm<WordFormValues>
        key={editingWord?.id ?? 'edit-word'}
        title='Edit Word'
        open={!!editingWord}
        modalProps={{ destroyOnClose: true }}
        layout='horizontal'
        labelCol={{ span: 7 }}
        wrapperCol={{ span: 17 }}
        initialValues={
          editingWord
            ? {
                locationId: editingWord.locationId,
                text: editingWord.text,
                meaning: editingWord.meaning ?? '',
              }
            : undefined
        }
        onOpenChange={(isOpen) => {
          if (!isOpen) setEditingWord(null);
        }}
        onFinish={async (values) => {
          if (!editingWord) return false;
          await updateWordMutation.mutateAsync({
            id: editingWord.id,
            payload: {
              locationId: values.locationId,
              text: values.text,
              meaning: values.meaning || null,
            },
          });
          return true;
        }}
      >
        <ProFormSelect
          name='locationId'
          label='Location'
          placeholder='Select a location'
          options={locationOptions}
          fieldProps={{
            showSearch: true,
            optionFilterProp: 'title',
            placeholder: 'Select a location',
          }}
          rules={[{ required: true }]}
        />
        <ProFormText
          name='text'
          label='Word'
          rules={[{ required: true }]}
          fieldProps={{ placeholder: 'Enter word (e.g., Lantern)' }}
        />
        <ProFormText
          name='meaning'
          label='Meaning'
          fieldProps={{ placeholder: 'Enter meaning (optional)' }}
        />
      </ModalForm>
      </Space>
    </PortalPageContainer>
  );
}

