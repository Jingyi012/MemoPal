import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { adminUsersApi } from '../../../api/adminUsersApi';

export type ContentSubTabKey = 'custom-palaces' | 'predefined-palaces';

interface UseUserContentTabDataArgs {
  userId: string;
  active: boolean;
}

export function useUserContentTabData({ userId, active }: UseUserContentTabDataArgs) {
  const [activeSubTab, setActiveSubTab] = useState<ContentSubTabKey>('custom-palaces');
  const [customPage, setCustomPage] = useState(1);
  const [customPageSize, setCustomPageSize] = useState(10);
  const [predefinedPage, setPredefinedPage] = useState(1);
  const [predefinedPageSize, setPredefinedPageSize] = useState(10);

  const [selectedCustomPalaceId, setSelectedCustomPalaceId] = useState<string>();
  const [selectedPredefinedPalaceId, setSelectedPredefinedPalaceId] = useState<string>();

  const customPalacesQuery = useQuery({
    queryKey: ['admin-user-data-palaces-paged', userId, 'custom', customPage, customPageSize],
    queryFn: () => adminUsersApi.listUserPalacesPaged(userId, customPage, customPageSize, { isCustom: true }),
    enabled: active,
    placeholderData: keepPreviousData,
  });

  const predefinedPalacesQuery = useQuery({
    queryKey: ['admin-user-data-palaces-paged', userId, 'predefined', predefinedPage, predefinedPageSize],
    queryFn: () =>
      adminUsersApi.listUserPalacesPaged(userId, predefinedPage, predefinedPageSize, {
        isCustom: false,
        requireUserLessons: true,
      }),
    enabled: active,
    placeholderData: keepPreviousData,
  });

  const customPalaces = customPalacesQuery.data?.data ?? [];
  const predefinedPalaces = predefinedPalacesQuery.data?.data ?? [];

  useEffect(() => {
    setSelectedCustomPalaceId(undefined);
    setSelectedPredefinedPalaceId(undefined);
    setCustomPage(1);
    setPredefinedPage(1);
  }, [userId]);

  const viewCustomPalace = (palaceId: string) => {
    setSelectedCustomPalaceId(palaceId);
  };

  const viewPredefinedPalace = (palaceId: string) => {
    setSelectedPredefinedPalaceId(palaceId);
  };

  const backToCustomList = () => {
    setSelectedCustomPalaceId(undefined);
  };

  const backToPredefinedList = () => {
    setSelectedPredefinedPalaceId(undefined);
  };

  return {
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
  };
}
