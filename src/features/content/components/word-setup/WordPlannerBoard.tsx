import { DeleteOutlined } from '@ant-design/icons';
import { Button, Card, Empty, Flex, Typography, theme } from 'antd';
import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import type { LocationDto } from '../../../../types/content';
import { MediaThumbnail } from '../MediaThumbnail';

export interface PlannedWordItem {
  id: string;
  text: string;
  meaning?: string | null;
  locationId?: string | null;
}

interface WordPlannerBoardProps {
  title?: string;
  withCard?: boolean;
  plannedWords: PlannedWordItem[];
  locations: LocationDto[];
  onMoveWord: (wordId: string, nextLocationId: string | null) => void;
  onRemoveWord: (wordId: string) => void;
}

export function WordPlannerBoard({
  title = 'Word Planner Assignment',
  withCard = true,
  plannedWords,
  locations,
  onMoveWord,
  onRemoveWord,
}: WordPlannerBoardProps) {
  const { token } = theme.useToken();
  const [draggingWordId, setDraggingWordId] = useState<string | null>(null);

  const wordsByLocation = useMemo(() => {
    return locations.reduce<Record<string, PlannedWordItem[]>>((acc, location) => {
      acc[location.id] = plannedWords.filter((word) => word.locationId === location.id);
      return acc;
    }, {});
  }, [locations, plannedWords]);

  const unassignedWords = useMemo(
    () => plannedWords.filter((word) => !word.locationId),
    [plannedWords]
  );

  const renderWordCard = (word: PlannedWordItem) => {
    return (
      <Card
        key={word.id}
        size='small'
        draggable
        onDragStart={() => setDraggingWordId(word.id)}
        onDragEnd={() => setDraggingWordId(null)}
        style={{
          cursor: 'grab',
        }}
        bodyStyle={{ padding: '8px 10px' }}
      >
        <Flex justify='space-between' gap={8}>
          <Typography.Text strong>{word.text}</Typography.Text>
          <Button
            type='text'
            size='small'
            danger
            icon={<DeleteOutlined />}
            onClick={() => onRemoveWord(word.id)}
          />
        </Flex>
        {word.meaning ? (
          <Typography.Text type='secondary' style={{ display: 'block', fontSize: 12 }}>
            {word.meaning}
          </Typography.Text>
        ) : null}
      </Card>
    );
  };

  const renderDropZone = (
    key: string,
    title: string,
    words: PlannedWordItem[],
    nextLocationId: string | null,
    thumbnail?: ReactNode
  ) => {
    const isDropTarget = draggingWordId !== null;

    return (
      <Card
        key={key}
        size='small'
        onDragOver={(event) => event.preventDefault()}
        onDrop={() => {
          if (!draggingWordId) return;
          onMoveWord(draggingWordId, nextLocationId);
          setDraggingWordId(null);
        }}
        style={{
          minHeight: 180,
          minWidth: 260,
          flex: '1 1 260px',
          borderStyle: 'dashed',
          borderColor: isDropTarget ? token.colorPrimary : token.colorBorderSecondary,
          background: token.colorFillAlter,
        }}
        bodyStyle={{ display: 'flex', flexDirection: 'column', gap: 10 }}
      >
        <Flex align='center' gap={10}>
          {thumbnail}
          <Typography.Text strong>{title}</Typography.Text>
        </Flex>

        {words.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description='Drop words here'
            style={{ margin: 0 }}
          />
        ) : (
          <Flex vertical gap={8}>
            {words.map(renderWordCard)}
          </Flex>
        )}
      </Card>
    );
  };

  const content = (
    <Flex wrap gap={12}>
      {renderDropZone('unassigned', 'Unassigned', unassignedWords, null)}
      {locations.map((location) =>
        renderDropZone(
          location.id,
          `${location.position}. ${location.name}`,
          wordsByLocation[location.id] ?? [],
          location.id,
          <MediaThumbnail
            path={location.imageUrl}
            alt={`${location.name} image`}
            width={44}
            height={32}
          />
        )
      )}
    </Flex>
  );

  if (!withCard) {
    return content;
  }

  return (
    <Card title={title}>
      {content}
    </Card>
  );
}
