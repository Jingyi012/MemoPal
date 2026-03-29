import { ArrowLeftOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Space, Spin, Tabs } from 'antd';
import { useEffect } from 'react';
import { ContentPalaceDetails } from './ContentPalaceDetails';
import { useUserContentTabData } from '../../hooks/useUserContentTabData';
import type { ContentSubTabKey } from '../../hooks/useUserContentTabData';
import { PalaceSelectionListCard } from '../../../content/components/palace-setup/PalaceSelectionListCard';

export interface UserContentFocusRequest {
  palaceId: string;
  subTab: ContentSubTabKey;
  requestId: number;
}

interface UserContentTabProps {
  userId: string;
  active: boolean;
  focusRequest?: UserContentFocusRequest | null;
}

export function UserContentTab({ userId, active, focusRequest }: UserContentTabProps) {
  const {
    activeSubTab,
    setActiveSubTab,
    customPalacesQuery,
    predefinedPalacesQuery,
    customPalaces,
    predefinedPalaces,
    selectedCustomPalaceId,
    selectedPredefinedPalaceId,
    viewCustomPalace,
    viewPredefinedPalace,
    backToCustomList,
    backToPredefinedList,
    customPage,
    customPageSize,
    setCustomPage,
    setCustomPageSize,
    predefinedPage,
    predefinedPageSize,
    setPredefinedPage,
    setPredefinedPageSize,
  } = useUserContentTabData({ userId, active });

  useEffect(() => {
    if (!focusRequest) {
      return;
    }

    setActiveSubTab(focusRequest.subTab);

    if (focusRequest.subTab === 'custom-palaces') {
      viewCustomPalace(focusRequest.palaceId);
      return;
    }

    viewPredefinedPalace(focusRequest.palaceId);
  }, [focusRequest, setActiveSubTab, viewCustomPalace, viewPredefinedPalace]);

  const activeListQuery = activeSubTab === 'custom-palaces' ? customPalacesQuery : predefinedPalacesQuery;
  const activeSelectedPalaceId = activeSubTab === 'custom-palaces' ? selectedCustomPalaceId : selectedPredefinedPalaceId;

  if (activeListQuery.isLoading && !activeListQuery.data && !activeSelectedPalaceId) {
    return (
      <Card>
        <Spin />
      </Card>
    );
  }

  if (activeListQuery.isError && !activeSelectedPalaceId) {
    return <Alert type='error' showIcon message='Failed to load content data.' />;
  }

  const customPalaceRows = customPalaces.map((palace) => ({
    id: palace.id,
    name: palace.name,
    level: palace.level,
    isCustom: palace.isCustom,
    locationsCount: palace.locationsCount,
    lessonsCount: palace.userLessonCount,
  }));

  const predefinedPalaceRows = predefinedPalaces.map((palace) => ({
    id: palace.id,
    name: palace.name,
    level: palace.level,
    isCustom: palace.isCustom,
    locationsCount: palace.locationsCount,
    lessonsCount: palace.userLessonCount,
  }));

  return (
    <Space direction='vertical' size={16} style={{ width: '100%' }}>
      <Tabs
        activeKey={activeSubTab}
        onChange={(key) => setActiveSubTab(key as ContentSubTabKey)}
        items={[
          {
            key: 'custom-palaces',
            label: `Custom Palaces (${customPalacesQuery.data?.pagination.totalCount ?? 0})`,
            children: selectedCustomPalaceId ? (
              <Space direction='vertical' size={12} style={{ width: '100%' }}>
                <Button icon={<ArrowLeftOutlined />} onClick={backToCustomList} style={{ width: 'fit-content' }}>
                  Back to Custom Palaces
                </Button>
                <ContentPalaceDetails
                  userId={userId}
                  palaceId={selectedCustomPalaceId}
                  scope='custom'
                />
              </Space>
            ) : (
              <PalaceSelectionListCard
                title='Custom Palace List'
                palaces={customPalaceRows}
                loading={customPalacesQuery.isFetching}
                emptyText='No custom palaces created by this user.'
                onViewPalace={viewCustomPalace}
                pagination={{
                  current: customPage,
                  pageSize: customPageSize,
                  total: customPalacesQuery.data?.pagination.totalCount ?? 0,
                  onChange: (page, pageSize) => {
                    setCustomPage(page);
                    setCustomPageSize(pageSize);
                  },
                }}
              />
            ),
          },
          {
            key: 'predefined-palaces',
            label: `Predefined Palaces (${predefinedPalacesQuery.data?.pagination.totalCount ?? 0})`,
            children: selectedPredefinedPalaceId ? (
              <Space direction='vertical' size={12} style={{ width: '100%' }}>
                <Button icon={<ArrowLeftOutlined />} onClick={backToPredefinedList} style={{ width: 'fit-content' }}>
                  Back to Predefined Palaces
                </Button>
                <ContentPalaceDetails
                  userId={userId}
                  palaceId={selectedPredefinedPalaceId}
                  scope='predefined'
                />
              </Space>
            ) : (
              <PalaceSelectionListCard
                title='Predefined Palace List (with user custom lessons)'
                palaces={predefinedPalaceRows}
                loading={predefinedPalacesQuery.isFetching}
                emptyText='No user-created lessons found under predefined palaces.'
                onViewPalace={viewPredefinedPalace}
                pagination={{
                  current: predefinedPage,
                  pageSize: predefinedPageSize,
                  total: predefinedPalacesQuery.data?.pagination.totalCount ?? 0,
                  onChange: (page, pageSize) => {
                    setPredefinedPage(page);
                    setPredefinedPageSize(pageSize);
                  },
                }}
              />
            ),
          },
        ]}
      />
    </Space>
  );
}
