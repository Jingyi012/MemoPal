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
  onChanged: () => Promise<void> | void;
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
  onChanged,
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
        defaultActiveKey='locations'
        items={[
          {
            key: 'locations',
            label: `Locations (${locations.length})`,
            children: (
              <LocationsSetupCard
                palaceId={palaceId}
                locations={locations}
                loading={locationsLoading}
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
