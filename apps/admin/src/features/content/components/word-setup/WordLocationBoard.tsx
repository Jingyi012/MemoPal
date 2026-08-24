import { Card, Empty, Flex, Spin, Typography, theme } from 'antd';
import { useMemo, useState } from 'react';
import type { LocationDto, WordDto } from '../../../../types/content';
import { MediaThumbnail } from '../MediaThumbnail';

interface WordLocationBoardProps {
  title?: string;
  words: WordDto[];
  locations: LocationDto[];
  loading?: boolean;
  onMoveWord: (word: WordDto, nextLocationId: string) => Promise<void>;
}

export function WordLocationBoard({
  title = 'Drag & Drop Assignment',
  words,
  locations,
  loading,
  onMoveWord,
}: WordLocationBoardProps) {
  const { token } = theme.useToken();
  const [draggingWordId, setDraggingWordId] = useState<string | null>(null);
  const [movingWordId, setMovingWordId] = useState<string | null>(null);

  const wordsByLocation = useMemo(() => {
    return locations.reduce<Record<string, WordDto[]>>((acc, location) => {
      acc[location.id] = words.filter((word) => word.locationId === location.id);
      return acc;
    }, {});
  }, [locations, words]);

  const wordMap = useMemo(
    () => new Map(words.map((word) => [word.id, word])),
    [words]
  );

  const handleDrop = async (nextLocationId: string) => {
    if (!draggingWordId) return;

    const draggedWord = wordMap.get(draggingWordId);
    setDraggingWordId(null);
    if (!draggedWord || draggedWord.locationId === nextLocationId) return;

    try {
      setMovingWordId(draggedWord.id);
      await onMoveWord(draggedWord, nextLocationId);
    } finally {
      setMovingWordId(null);
    }
  };

  return (
    <Card title={title}>
      {loading ? (
        <Flex justify='center' style={{ padding: 16 }}>
          <Spin />
        </Flex>
      ) : (
        <Flex wrap gap={12}>
          {locations.map((location) => {
            const assignedWords = wordsByLocation[location.id] ?? [];
            const isDropTarget = draggingWordId !== null;

            return (
              <Card
                key={location.id}
                size='small'
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => void handleDrop(location.id)}
                style={{
                  minHeight: 170,
                  minWidth: 260,
                  flex: '1 1 260px',
                  borderStyle: 'dashed',
                  borderColor: isDropTarget ? token.colorPrimary : token.colorBorderSecondary,
                  background: token.colorFillAlter,
                }}
                bodyStyle={{ display: 'flex', flexDirection: 'column', gap: 10 }}
              >
                <Flex align='center' gap={10}>
                  <MediaThumbnail
                    path={location.imageUrl}
                    alt={`${location.name} image`}
                    width={44}
                    height={32}
                  />
                  <Typography.Text strong>{`${location.position}. ${location.name}`}</Typography.Text>
                </Flex>

                {assignedWords.length === 0 ? (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description='Drop words here'
                    style={{ margin: 0 }}
                  />
                ) : (
                  <Flex vertical gap={8}>
                    {assignedWords.map((word) => {
                      const isBusy = movingWordId === word.id;

                      return (
                        <Card
                          key={word.id}
                          size='small'
                          draggable={!isBusy}
                          onDragStart={() => setDraggingWordId(word.id)}
                          onDragEnd={() => setDraggingWordId(null)}
                          style={{
                            cursor: isBusy ? 'wait' : 'grab',
                            opacity: isBusy ? 0.6 : 1,
                          }}
                          bodyStyle={{ padding: '8px 10px' }}
                        >
                          <Typography.Text strong>{word.text}</Typography.Text>
                          {word.meaning ? (
                            <Typography.Text
                              type='secondary'
                              style={{ display: 'block', marginTop: 2, fontSize: 12 }}
                            >
                              {word.meaning}
                            </Typography.Text>
                          ) : null}
                        </Card>
                      );
                    })}
                  </Flex>
                )}
              </Card>
            );
          })}
        </Flex>
      )}
    </Card>
  );
}
