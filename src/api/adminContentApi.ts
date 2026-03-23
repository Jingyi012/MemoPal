import { apiClient } from '../lib/apiClient';
import type { ApiResponse, PaginatedResponse } from '../types/api';
import type {
  LessonDto,
  LessonUpsertRequest,
  LocationDto,
  LocationReorderRequest,
  LocationUpsertRequest,
  PalaceDto,
  PalaceUpsertRequest,
  WordDto,
  WordUpsertRequest,
} from '../types/content';

async function listPalacesPage(pageNumber: number, pageSize: number) {
  const response = await apiClient.get<PaginatedResponse<PalaceDto>>('/palaces', {
    params: { pageNumber, pageSize },
  });
  return response.data;
}

export const adminContentApi = {
  listPalaces(pageNumber = 1, pageSize = 20) {
    return listPalacesPage(pageNumber, pageSize);
  },

  async listAllPalaces() {
    const pageSize = 100;
    let pageNumber = 1;
    let totalCount = Number.MAX_SAFE_INTEGER;
    const all: PalaceDto[] = [];

    while (all.length < totalCount) {
      const page = await listPalacesPage(pageNumber, pageSize);
      all.push(...page.data);
      totalCount = page.pagination.totalCount;
      if (page.data.length === 0) break;
      pageNumber += 1;
    }

    return all;
  },

  createPalace(payload: PalaceUpsertRequest) {
    return apiClient
      .post<ApiResponse<PalaceDto>>('/palaces', payload)
      .then((response) => response.data.data);
  },

  updatePalace(id: string, payload: PalaceUpsertRequest) {
    return apiClient
      .put<ApiResponse<PalaceDto>>(`/palaces/${id}`, payload)
      .then((response) => response.data.data);
  },

  deletePalace(id: string) {
    return apiClient
      .delete<ApiResponse<boolean>>(`/palaces/${id}`)
      .then((response) => response.data.data);
  },

  listLocationsByPalace(palaceId: string) {
    return apiClient
      .get<ApiResponse<LocationDto[]>>(`/palaces/${palaceId}/locations`)
      .then((response) => response.data.data);
  },

  getPalaceById(palaceId: string) {
    return apiClient
      .get<ApiResponse<PalaceDto>>(`/palaces/${palaceId}`)
      .then((response) => response.data.data);
  },

  createLocation(payload: LocationUpsertRequest) {
    return apiClient
      .post<ApiResponse<LocationDto>>('/locations', payload)
      .then((response) => response.data.data);
  },

  updateLocation(id: string, payload: LocationUpsertRequest) {
    return apiClient
      .put<ApiResponse<LocationDto>>(`/locations/${id}`, payload)
      .then((response) => response.data.data);
  },

  deleteLocation(id: string) {
    return apiClient
      .delete<ApiResponse<boolean>>(`/locations/${id}`)
      .then((response) => response.data.data);
  },

  reorderLocations(palaceId: string, payload: LocationReorderRequest) {
    return apiClient
      .post<ApiResponse<LocationDto[]>>(`/palaces/${palaceId}/locations/reorder`, payload)
      .then((response) => response.data.data);
  },

  listLessons() {
    return apiClient
      .get<ApiResponse<LessonDto[]>>('/lessons')
      .then((response) => response.data.data);
  },

  listLessonsByPalace(palaceId: string) {
    return apiClient
      .get<ApiResponse<LessonDto[]>>(`/palaces/${palaceId}/lessons`)
      .then((response) => response.data.data);
  },

  getLessonById(lessonId: string) {
    return apiClient
      .get<ApiResponse<LessonDto>>(`/lessons/${lessonId}`)
      .then((response) => response.data.data);
  },

  createLesson(payload: LessonUpsertRequest) {
    return apiClient
      .post<ApiResponse<LessonDto>>('/lessons', payload)
      .then((response) => response.data.data);
  },

  updateLesson(id: string, payload: LessonUpsertRequest) {
    return apiClient
      .put<ApiResponse<LessonDto>>(`/lessons/${id}`, payload)
      .then((response) => response.data.data);
  },

  deleteLesson(id: string) {
    return apiClient
      .delete<ApiResponse<boolean>>(`/lessons/${id}`)
      .then((response) => response.data.data);
  },

  listWordsByLesson(lessonId: string) {
    return apiClient
      .get<ApiResponse<WordDto[]>>('/words', { params: { lessonId } })
      .then((response) => response.data.data);
  },

  createWord(payload: WordUpsertRequest) {
    return apiClient
      .post<ApiResponse<WordDto>>('/words', payload)
      .then((response) => response.data.data);
  },

  createWordsBatch(payload: WordUpsertRequest[]) {
    return apiClient
      .post<ApiResponse<WordDto[]>>('/words/batch', payload)
      .then((response) => response.data.data);
  },

  updateWord(id: string, payload: WordUpsertRequest) {
    return apiClient
      .patch<ApiResponse<WordDto>>(`/words/${id}`, payload)
      .then((response) => response.data.data);
  },

  deleteWord(id: string) {
    return apiClient
      .delete<ApiResponse<boolean>>(`/words/${id}`)
      .then((response) => response.data.data);
  },
};
