import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { adminUsersApi } from '../../../api/adminUsersApi';

export type ContentSubTabKey = 'custom-palaces' | 'predefined-palaces';

interface UseUserContentTabDataArgs {
  userId: string;
  active: boolean;
}

export function useUserContentTabData({ userId, active }: UseUserContentTabDataArgs) {
  const [activeSubTab, setActiveSubTab] = useState<ContentSubTabKey>('custom-palaces');
  const [customPageByUser, setCustomPageByUser] = useState<Record<string, number>>({});
  const [customPageSizeByUser, setCustomPageSizeByUser] = useState<Record<string, number>>({});
  const [predefinedPageByUser, setPredefinedPageByUser] = useState<Record<string, number>>({});
  const [predefinedPageSizeByUser, setPredefinedPageSizeByUser] = useState<Record<string, number>>({});

  const [selectedCustomPalaceByUser, setSelectedCustomPalaceByUser] = useState<Record<string, string | undefined>>({});
  const [selectedPredefinedPalaceByUser, setSelectedPredefinedPalaceByUser] = useState<Record<string, string | undefined>>({});

  const customPage = customPageByUser[userId] ?? 1;
  const customPageSize = customPageSizeByUser[userId] ?? 10;
  const predefinedPage = predefinedPageByUser[userId] ?? 1;
  const predefinedPageSize = predefinedPageSizeByUser[userId] ?? 10;

  const selectedCustomPalaceId = selectedCustomPalaceByUser[userId];
  const selectedPredefinedPalaceId = selectedPredefinedPalaceByUser[userId];

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

  const viewCustomPalace = useCallback((palaceId: string) => {
    setSelectedCustomPalaceByUser((prev) => ({ ...prev, [userId]: palaceId }));
  }, [userId]);

  const viewPredefinedPalace = useCallback((palaceId: string) => {
    setSelectedPredefinedPalaceByUser((prev) => ({ ...prev, [userId]: palaceId }));
  }, [userId]);

  const backToCustomList = useCallback(() => {
    setSelectedCustomPalaceByUser((prev) => ({ ...prev, [userId]: undefined }));
  }, [userId]);

  const backToPredefinedList = useCallback(() => {
    setSelectedPredefinedPalaceByUser((prev) => ({ ...prev, [userId]: undefined }));
  }, [userId]);

  const setCustomPage = useCallback(
    (value: number) => setCustomPageByUser((prev) => ({ ...prev, [userId]: value })),
    [userId]
  );
  const setCustomPageSize = useCallback(
    (value: number) => setCustomPageSizeByUser((prev) => ({ ...prev, [userId]: value })),
    [userId]
  );
  const setPredefinedPage = useCallback(
    (value: number) => setPredefinedPageByUser((prev) => ({ ...prev, [userId]: value })),
    [userId]
  );
  const setPredefinedPageSize = useCallback(
    (value: number) => setPredefinedPageSizeByUser((prev) => ({ ...prev, [userId]: value })),
    [userId]
  );

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
