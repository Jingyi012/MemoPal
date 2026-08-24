import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import { adminContentApi, type ContentQueryScope } from '../../../api/adminContentApi';

export type { ContentQueryScope };

interface UsePaginatedPalacesOptions {
  scope?: ContentQueryScope;
  initialPageNumber?: number;
  initialPageSize?: number;
}

export function usePaginatedPalaces({
  scope,
  initialPageNumber = 1,
  initialPageSize = 20,
}: UsePaginatedPalacesOptions = {}) {
  const [pageNumber, setPageNumber] = useState(initialPageNumber);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const normalizedScope = useMemo<ContentQueryScope | undefined>(() => {
    return scope?.adminCreatedOnly ? { adminCreatedOnly: true } : undefined;
  }, [scope?.adminCreatedOnly]);
  const scopeKey = normalizedScope?.adminCreatedOnly ? 'admin-created-only' : 'all';

  const query = useQuery({
    queryKey: ['admin-content', 'palaces', 'paged', pageNumber, pageSize, scopeKey],
    queryFn: () => adminContentApi.listPalaces(pageNumber, pageSize, normalizedScope),
    placeholderData: keepPreviousData,
  });

  const onTablePageChange = useCallback((nextPage: number, nextPageSize: number) => {
    setPageNumber(nextPage);
    setPageSize(nextPageSize);
  }, []);

  return {
    pageNumber,
    pageSize,
    onTablePageChange,
    palacesQuery: query,
  };
}

export function useAdminContentApi() {
  const listPalaces = useCallback(
    (pageNumber = 1, pageSize = 20, scope?: ContentQueryScope) =>
      adminContentApi.listPalaces(pageNumber, pageSize, scope),
    [],
  );
  const createPalace = useCallback((payload: Parameters<typeof adminContentApi.createPalace>[0]) => {
    return adminContentApi.createPalace(payload);
  }, []);
  const updatePalace = useCallback(
    (
      id: Parameters<typeof adminContentApi.updatePalace>[0],
      payload: Parameters<typeof adminContentApi.updatePalace>[1],
    ) => adminContentApi.updatePalace(id, payload),
    [],
  );
  const deletePalace = useCallback(
    (id: Parameters<typeof adminContentApi.deletePalace>[0]) =>
      adminContentApi.deletePalace(id),
    [],
  );

  const createLocation = useCallback((payload: Parameters<typeof adminContentApi.createLocation>[0]) => {
    return adminContentApi.createLocation(payload);
  }, []);
  const updateLocation = useCallback(
    (
      id: Parameters<typeof adminContentApi.updateLocation>[0],
      payload: Parameters<typeof adminContentApi.updateLocation>[1],
    ) => adminContentApi.updateLocation(id, payload),
    [],
  );
  const deleteLocation = useCallback(
    (id: Parameters<typeof adminContentApi.deleteLocation>[0]) =>
      adminContentApi.deleteLocation(id),
    [],
  );
  const reorderLocations = useCallback(
    (
      palaceId: Parameters<typeof adminContentApi.reorderLocations>[0],
      payload: Parameters<typeof adminContentApi.reorderLocations>[1],
    ) => adminContentApi.reorderLocations(palaceId, payload),
    [],
  );

  const createLesson = useCallback((payload: Parameters<typeof adminContentApi.createLesson>[0]) => {
    return adminContentApi.createLesson(payload);
  }, []);
  const updateLesson = useCallback(
    (
      id: Parameters<typeof adminContentApi.updateLesson>[0],
      payload: Parameters<typeof adminContentApi.updateLesson>[1],
    ) => adminContentApi.updateLesson(id, payload),
    [],
  );
  const deleteLesson = useCallback(
    (id: Parameters<typeof adminContentApi.deleteLesson>[0]) =>
      adminContentApi.deleteLesson(id),
    [],
  );

  const createWord = useCallback((payload: Parameters<typeof adminContentApi.createWord>[0]) => {
    return adminContentApi.createWord(payload);
  }, []);
  const updateWord = useCallback(
    (
      id: Parameters<typeof adminContentApi.updateWord>[0],
      payload: Parameters<typeof adminContentApi.updateWord>[1],
    ) => adminContentApi.updateWord(id, payload),
    [],
  );
  const createWordsBatch = useCallback(
    (payload: Parameters<typeof adminContentApi.createWordsBatch>[0]) =>
      adminContentApi.createWordsBatch(payload),
    [],
  );
  const deleteWord = useCallback(
    (id: Parameters<typeof adminContentApi.deleteWord>[0]) =>
      adminContentApi.deleteWord(id),
    [],
  );

  return {
    listPalaces,
    createPalace,
    updatePalace,
    deletePalace,
    createLocation,
    updateLocation,
    deleteLocation,
    reorderLocations,
    createLesson,
    updateLesson,
    deleteLesson,
    createWord,
    updateWord,
    createWordsBatch,
    deleteWord,
  };
}
