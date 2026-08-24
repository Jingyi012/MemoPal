import { ArrowLeftOutlined } from '@ant-design/icons';
import { Breadcrumb, Button, Space, Tabs } from 'antd';
import { Link } from 'react-router-dom';
import type { LessonDto, LocationDto, PalaceDto } from '../../../../types/content';
import { LessonsSetupCard } from './LessonsSetupCard';
import { LocationsSetupCard } from './LocationsSetupCard';
import { PalaceOverviewCard } from './PalaceOverviewCard';

interface PalaceDetailsWorkspaceProps {
  palaceId: string;
  palace: PalaceDto;
  locations: LocationDto[];
  lessons: LessonDto[];
  locationsLoading?: boolean;
  lessonsLoading?: boolean;
  locationsRefreshing?: boolean;
  lessonsRefreshing?: boolean;
  onChanged: () => Promise<void> | void;
  onRefreshLocations?: () => Promise<void> | void;
  onRefreshLessons?: () => Promise<void> | void;
  activeTab?: 'locations' | 'lessons';
  onTabChange?: (tab: 'locations' | 'lessons') => void;
  onBack?: () => void;
  backLabel?: string;
  showBackButton?: boolean;
  breadcrumbRootPath?: string;
  breadcrumbRootLabel?: string;
  editablePalace?: boolean;
  editableLocations?: boolean;
  canCreateLesson?: boolean;
  lessonsLabel?: string;
  onConfigureLessonWords?: (lessonId: string) => void;
}

export function PalaceDetailsWorkspace({
  palaceId,
  palace,
  locations,
  lessons,
  locationsLoading,
  lessonsLoading,
  locationsRefreshing,
  lessonsRefreshing,
  onChanged,
  onRefreshLocations,
  onRefreshLessons,
  activeTab,
  onTabChange,
  onBack,
  backLabel = 'Back to Palaces',
  showBackButton = true,
  breadcrumbRootPath,
  breadcrumbRootLabel = 'Palaces',
  editablePalace = true,
  editableLocations = true,
  canCreateLesson = true,
  lessonsLabel,
  onConfigureLessonWords,
}: PalaceDetailsWorkspaceProps) {
  return (
    <Space direction='vertical' size={16} style={{ width: '100%' }}>
      {showBackButton ? (
        <Button icon={<ArrowLeftOutlined />} onClick={onBack} style={{ width: 'fit-content' }}>
          {backLabel}
        </Button>
      ) : null}

      {breadcrumbRootPath ? (
        <Breadcrumb
          items={[
            { title: <Link to={breadcrumbRootPath}>{breadcrumbRootLabel}</Link> },
            { title: palace.name },
          ]}
        />
      ) : null}

      <PalaceOverviewCard palaceId={palaceId} palace={palace} onChanged={onChanged} editable={editablePalace} />

      <Tabs
        activeKey={activeTab}
        defaultActiveKey={activeTab ? undefined : 'locations'}
        onChange={(tabKey) => onTabChange?.(tabKey as 'locations' | 'lessons')}
        items={[
          {
            key: 'locations',
            label: `Locations (${locations.length})`,
            children: (
              <LocationsSetupCard
                palaceId={palaceId}
                locations={locations}
                loading={locationsLoading}
                refreshing={locationsRefreshing}
                onRefresh={onRefreshLocations}
                onChanged={onChanged}
                editable={editableLocations}
              />
            ),
          },
          {
            key: 'lessons',
            label: lessonsLabel ?? `Lessons (${lessons.length})`,
            children: (
              <LessonsSetupCard
                palaceId={palaceId}
                lessons={lessons}
                loading={lessonsLoading}
                refreshing={lessonsRefreshing}
                onRefresh={onRefreshLessons}
                onChanged={onChanged}
                canCreate={canCreateLesson}
                onConfigureWords={onConfigureLessonWords}
              />
            ),
          },
        ]}
      />
    </Space>
  );
}
